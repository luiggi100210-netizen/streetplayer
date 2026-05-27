const pool = require('../config/database');

// GET /api/eventos
async function listarEventos(req, res, next) {
  try {
    const { deporte, ciudad, lat, lng, radio = 20, estado = 'abierto', page = 1 } = req.query;
    const limit = 20;
    const offset = (page - 1) * limit;
    const params = [];
    let idx = 1;

    let query = `
      SELECT e.*,
        u.username AS creador_username, u.nombre AS creador_nombre, u.foto_url AS creador_foto,
        (SELECT COUNT(*) FROM evento_participantes WHERE evento_id = e.id AND estado = 'confirmado') AS inscritos,
        EXISTS(SELECT 1 FROM evento_participantes WHERE evento_id = e.id AND usuario_id = $${idx++}) AS yo_inscrito
      FROM eventos e
      JOIN usuarios u ON e.creador_id = u.id
      WHERE e.es_privado = false
    `;
    params.push(req.usuario?.id || null);

    if (estado) { query += ` AND e.estado = $${idx++}`; params.push(estado); }
    if (deporte) { query += ` AND LOWER(e.deporte) = $${idx++}`; params.push(deporte.toLowerCase()); }
    if (ciudad)  { query += ` AND LOWER(e.ciudad) LIKE $${idx++}`; params.push(`%${ciudad.toLowerCase()}%`); }

    // Filtro por distancia si se pasa lat/lng
    if (lat && lng) {
      query += ` AND (
        6371 * acos(
          cos(radians($${idx++})) * cos(radians(e.latitud)) *
          cos(radians(e.longitud) - radians($${idx++})) +
          sin(radians($${idx - 2})) * sin(radians(e.latitud))
        )
      ) <= $${idx++}`;
      params.push(parseFloat(lat), parseFloat(lng), parseFloat(radio));
    }

    query += ` AND e.fecha_evento >= NOW()`;
    query += ` ORDER BY e.fecha_evento ASC LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(limit, offset);

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) { next(err); }
}

// GET /api/eventos/:id
async function obtenerEvento(req, res, next) {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      `SELECT e.*,
        u.username AS creador_username, u.nombre AS creador_nombre, u.foto_url AS creador_foto,
        EXISTS(SELECT 1 FROM evento_participantes WHERE evento_id = e.id AND usuario_id = $2) AS yo_inscrito
       FROM eventos e JOIN usuarios u ON e.creador_id = u.id
       WHERE e.id = $1`,
      [id, req.usuario?.id || null]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Evento no encontrado' });

    const { rows: participantes } = await pool.query(
      `SELECT u.id, u.username, u.nombre, u.foto_url, u.nivel, ep.estado, ep.fecha
       FROM evento_participantes ep JOIN usuarios u ON ep.usuario_id = u.id
       WHERE ep.evento_id = $1 AND ep.estado = 'confirmado'
       ORDER BY ep.fecha ASC`,
      [id]
    );

    res.json({ ...rows[0], participantes });
  } catch (err) { next(err); }
}

// POST /api/eventos
async function crearEvento(req, res, next) {
  try {
    const { titulo, descripcion, deporte, nivel, direccion, latitud, longitud,
            fecha_evento, duracion_min, cupos_total, precio, es_privado, foto_url } = req.body;

    if (!titulo || !deporte || !fecha_evento) {
      return res.status(400).json({ error: 'Título, deporte y fecha son requeridos' });
    }

    const { rows } = await pool.query(
      `INSERT INTO eventos
        (creador_id, titulo, descripcion, deporte, nivel, foto_url, direccion,
         latitud, longitud, fecha_evento, duracion_min, cupos_total, precio, es_privado)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING *`,
      [req.usuario.id, titulo, descripcion, deporte, nivel || 'todos', foto_url || null,
       direccion, latitud, longitud, fecha_evento, duracion_min || 90,
       cupos_total || 10, precio || 0, es_privado || false]
    );

    // El creador se une automáticamente
    await pool.query(
      'INSERT INTO evento_participantes (evento_id, usuario_id) VALUES ($1, $2)',
      [rows[0].id, req.usuario.id]
    );

    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
}

// POST /api/eventos/:id/unirse
async function unirseEvento(req, res, next) {
  try {
    const { id } = req.params;

    const { rows: evento } = await pool.query('SELECT * FROM eventos WHERE id = $1', [id]);
    if (evento.length === 0) return res.status(404).json({ error: 'Evento no encontrado' });
    if (evento[0].estado !== 'abierto') return res.status(400).json({ error: 'El evento no está disponible' });
    if (evento[0].cupos_ocupados >= evento[0].cupos_total) return res.status(400).json({ error: 'El evento está lleno' });

    const { rows: yaInscrito } = await pool.query(
      'SELECT 1 FROM evento_participantes WHERE evento_id = $1 AND usuario_id = $2',
      [id, req.usuario.id]
    );
    if (yaInscrito.length > 0) return res.status(400).json({ error: 'Ya estás inscrito en este evento' });

    await pool.query('INSERT INTO evento_participantes (evento_id, usuario_id) VALUES ($1, $2)', [id, req.usuario.id]);
    await pool.query('UPDATE eventos SET cupos_ocupados = cupos_ocupados + 1 WHERE id = $1', [id]);

    // Notificar al creador
    await pool.query(
      `INSERT INTO notificaciones (usuario_id, tipo, mensaje, referencia_id)
       VALUES ($1, 'evento', $2, $3)`,
      [evento[0].creador_id, `${req.usuario.username} se unió a tu evento "${evento[0].titulo}"`, id]
    );

    if (evento[0].cupos_ocupados + 1 >= evento[0].cupos_total) {
      await pool.query("UPDATE eventos SET estado = 'lleno' WHERE id = $1", [id]);
    }

    res.json({ mensaje: 'Te uniste al evento correctamente' });
  } catch (err) { next(err); }
}

// DELETE /api/eventos/:id/salir
async function salirEvento(req, res, next) {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      'DELETE FROM evento_participantes WHERE evento_id = $1 AND usuario_id = $2 RETURNING *',
      [id, req.usuario.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'No estás inscrito en este evento' });
    await pool.query('UPDATE eventos SET cupos_ocupados = GREATEST(0, cupos_ocupados - 1), estado = CASE WHEN estado = $1 THEN $2 ELSE estado END WHERE id = $3', ['lleno', 'abierto', id]);
    res.json({ mensaje: 'Saliste del evento' });
  } catch (err) { next(err); }
}

// PUT /api/eventos/:id
async function editarEvento(req, res, next) {
  try {
    const { id } = req.params;
    const { titulo, descripcion, fecha_evento, duracion_min, cupos_total, estado } = req.body;

    const { rows: evento } = await pool.query('SELECT * FROM eventos WHERE id = $1', [id]);
    if (evento.length === 0) return res.status(404).json({ error: 'Evento no encontrado' });
    if (evento[0].creador_id !== req.usuario.id) return res.status(403).json({ error: 'Solo el creador puede editar el evento' });

    const { rows } = await pool.query(
      `UPDATE eventos SET
        titulo       = COALESCE($1, titulo),
        descripcion  = COALESCE($2, descripcion),
        fecha_evento = COALESCE($3, fecha_evento),
        duracion_min = COALESCE($4, duracion_min),
        cupos_total  = COALESCE($5, cupos_total),
        estado       = COALESCE($6, estado)
       WHERE id = $7 RETURNING *`,
      [titulo, descripcion, fecha_evento, duracion_min, cupos_total, estado, id]
    );
    res.json(rows[0]);
  } catch (err) { next(err); }
}

module.exports = { listarEventos, obtenerEvento, crearEvento, unirseEvento, salirEvento, editarEvento };
