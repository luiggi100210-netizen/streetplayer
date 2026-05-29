const pool         = require('../config/database');
const asyncHandler = require('../middleware/asyncHandler');

// GET /api/torneos
const listarTorneos = asyncHandler(async (req, res) => {
  const { deporte, ciudad, estado = 'aprobado' } = req.query;
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
});

// GET /api/torneos/:id
const obtenerTorneo = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows } = await pool.query(
    `SELECT t.*, u.username AS organizador_username, u.nombre AS organizador_nombre, u.foto_url AS organizador_foto
     FROM torneos t JOIN usuarios u ON t.organizador_id = u.id WHERE t.id = $1`,
    [id]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Torneo no encontrado' });

  const { rows: equipos } = await pool.query(
    `SELECT eq.*, te.estado AS estado_inscripcion, te.fecha AS fecha_inscripcion
     FROM torneo_equipos te JOIN equipos eq ON te.equipo_id = eq.id
     WHERE te.torneo_id = $1 ORDER BY te.fecha ASC`,
    [id]
  );

  const { rows: partidos } = await pool.query(
    `SELECT p.*,
      el.nombre AS equipo_local_nombre, ev.nombre AS equipo_visita_nombre
     FROM partidos p
     JOIN equipos el ON p.equipo_local_id  = el.id
     JOIN equipos ev ON p.equipo_visita_id = ev.id
     WHERE p.torneo_id = $1 ORDER BY p.fecha ASC`,
    [id]
  );

  res.json({ ...rows[0], equipos, partidos });
});

// POST /api/torneos
const crearTorneo = asyncHandler(async (req, res) => {
  const { nombre, descripcion, deporte, ciudad, latitud, longitud,
          fecha_inicio, fecha_fin, max_equipos, premio, precio_inscripcion, formato, foto_url } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO torneos (organizador_id, nombre, descripcion, deporte, foto_url, ciudad,
      latitud, longitud, fecha_inicio, fecha_fin, max_equipos, premio, precio_inscripcion, formato)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
    [req.usuario.id, nombre, descripcion, deporte, foto_url || null, ciudad,
     latitud, longitud, fecha_inicio, fecha_fin, max_equipos || 8,
     premio, precio_inscripcion || 0, formato || 'eliminacion']
  );
  res.status(201).json({ ...rows[0], mensaje: 'Torneo enviado para aprobación' });
});

// POST /api/torneos/:id/inscribir — el capitán inscribe su equipo
const inscribirEquipo = asyncHandler(async (req, res) => {
  const { id: torneo_id } = req.params;
  const { equipo_id }     = req.body;

  if (!equipo_id) return res.status(400).json({ error: 'equipo_id requerido' });

  const { rows: torneos } = await pool.query(
    `SELECT * FROM torneos WHERE id = $1 AND aprobado = true AND estado = 'aprobado'`,
    [torneo_id]
  );
  if (torneos.length === 0) return res.status(400).json({ error: 'Torneo no disponible para inscripción' });

  const torneo = torneos[0];

  const { rows: cap } = await pool.query(
    'SELECT 1 FROM equipos WHERE id = $1 AND capitan_id = $2',
    [equipo_id, req.usuario.id]
  );
  if (cap.length === 0) return res.status(403).json({ error: 'Solo el capitán puede inscribir el equipo' });

  const { rows: yaInscrito } = await pool.query(
    'SELECT 1 FROM torneo_equipos WHERE torneo_id = $1 AND equipo_id = $2',
    [torneo_id, equipo_id]
  );
  if (yaInscrito.length > 0) return res.status(409).json({ error: 'El equipo ya está inscrito' });

  const { rows: count } = await pool.query(
    `SELECT COUNT(*) FROM torneo_equipos WHERE torneo_id = $1 AND estado != 'eliminado'`,
    [torneo_id]
  );
  if (parseInt(count[0].count) >= torneo.max_equipos) {
    return res.status(400).json({ error: 'El torneo está lleno' });
  }

  await pool.query(
    `INSERT INTO torneo_equipos (torneo_id, equipo_id, estado) VALUES ($1, $2, 'inscrito')`,
    [torneo_id, equipo_id]
  );
  res.status(201).json({ mensaje: 'Equipo inscrito correctamente' });
});

// DELETE /api/torneos/:id/inscribir — el capitán retira su equipo
const desinscribirEquipo = asyncHandler(async (req, res) => {
  const { id: torneo_id } = req.params;
  const { equipo_id }     = req.body;

  if (!equipo_id) return res.status(400).json({ error: 'equipo_id requerido' });

  const { rows: cap } = await pool.query(
    'SELECT 1 FROM equipos WHERE id = $1 AND capitan_id = $2',
    [equipo_id, req.usuario.id]
  );
  if (cap.length === 0) return res.status(403).json({ error: 'Solo el capitán puede retirar el equipo' });

  await pool.query(
    'DELETE FROM torneo_equipos WHERE torneo_id = $1 AND equipo_id = $2',
    [torneo_id, equipo_id]
  );
  res.json({ mensaje: 'Equipo retirado del torneo' });
});

module.exports = { listarTorneos, obtenerTorneo, crearTorneo, inscribirEquipo, desinscribirEquipo };
