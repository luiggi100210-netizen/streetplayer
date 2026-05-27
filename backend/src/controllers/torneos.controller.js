const pool = require('../config/database');

// GET /api/torneos
async function listarTorneos(req, res, next) {
  try {
    const { deporte, ciudad, estado = 'abierto' } = req.query;
    let query = `
      SELECT t.*,
        u.username AS organizador_username, u.nombre AS organizador_nombre, u.foto_url AS organizador_foto,
        (SELECT COUNT(*) FROM torneo_equipos WHERE torneo_id = t.id) AS equipos_inscritos
      FROM torneos t JOIN usuarios u ON t.organizador_id = u.id
      WHERE t.aprobado = true
    `;
    const params = [];
    let idx = 1;
    if (estado)  { query += ` AND t.estado = $${idx++}`;               params.push(estado); }
    if (deporte) { query += ` AND LOWER(t.deporte) = $${idx++}`;       params.push(deporte.toLowerCase()); }
    if (ciudad)  { query += ` AND LOWER(t.ciudad) LIKE $${idx++}`;     params.push(`%${ciudad.toLowerCase()}%`); }
    query += ' ORDER BY t.fecha_inicio ASC LIMIT 30';

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) { next(err); }
}

// GET /api/torneos/:id
async function obtenerTorneo(req, res, next) {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      `SELECT t.*, u.username AS organizador_username, u.nombre AS organizador_nombre, u.foto_url AS organizador_foto
       FROM torneos t JOIN usuarios u ON t.organizador_id = u.id WHERE t.id = $1`, [id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Torneo no encontrado' });

    const { rows: equipos } = await pool.query(
      `SELECT eq.*, te.estado AS estado_inscripcion, te.fecha AS fecha_inscripcion
       FROM torneo_equipos te JOIN equipos eq ON te.equipo_id = eq.id
       WHERE te.torneo_id = $1 ORDER BY te.fecha ASC`, [id]
    );

    const { rows: partidos } = await pool.query(
      `SELECT p.*,
        el.nombre AS equipo_local_nombre, ev.nombre AS equipo_visita_nombre
       FROM partidos p
       JOIN equipos el ON p.equipo_local_id = el.id
       JOIN equipos ev ON p.equipo_visita_id = ev.id
       WHERE p.torneo_id = $1 ORDER BY p.fecha ASC`, [id]
    );

    res.json({ ...rows[0], equipos, partidos });
  } catch (err) { next(err); }
}

// POST /api/torneos
async function crearTorneo(req, res, next) {
  try {
    const { nombre, descripcion, deporte, ciudad, latitud, longitud,
            fecha_inicio, fecha_fin, max_equipos, premio, precio_inscripcion, formato, foto_url } = req.body;
    if (!nombre || !deporte || !fecha_inicio) {
      return res.status(400).json({ error: 'Nombre, deporte y fecha de inicio son requeridos' });
    }
    const { rows } = await pool.query(
      `INSERT INTO torneos (organizador_id, nombre, descripcion, deporte, foto_url, ciudad,
        latitud, longitud, fecha_inicio, fecha_fin, max_equipos, premio, precio_inscripcion, formato)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [req.usuario.id, nombre, descripcion, deporte, foto_url || null, ciudad,
       latitud, longitud, fecha_inicio, fecha_fin, max_equipos || 8,
       premio, precio_inscripcion || 0, formato || 'eliminacion']
    );
    res.status(201).json({ ...rows[0], mensaje: 'Torneo enviado para aprobación' });
  } catch (err) { next(err); }
}

module.exports = { listarTorneos, obtenerTorneo, crearTorneo };
