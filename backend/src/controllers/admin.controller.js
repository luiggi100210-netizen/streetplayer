const pool         = require('../config/database');
const asyncHandler = require('../middleware/asyncHandler');

// GET /api/admin/dashboard
const dashboard = asyncHandler(async (req, res) => {
  const [
    { rows: usuarios },
    { rows: eventos },
    { rows: torneos },
    { rows: reportes },
    { rows: registros7d },
  ] = await Promise.all([
    pool.query(`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE estado='activo') AS activos,
                COUNT(*) FILTER (WHERE estado='suspendido') AS suspendidos FROM usuarios`),
    pool.query(`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE estado='abierto') AS abiertos FROM eventos`),
    pool.query(`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE aprobado=false) AS pendientes FROM torneos`),
    pool.query(`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE estado='pendiente') AS pendientes FROM reportes`),
    pool.query(`SELECT DATE(fecha_registro) AS dia, COUNT(*) AS total FROM usuarios
                WHERE fecha_registro >= NOW() - INTERVAL '7 days'
                GROUP BY dia ORDER BY dia ASC`),
  ]);
  res.json({
    usuarios:       usuarios[0],
    eventos:        eventos[0],
    torneos:        torneos[0],
    reportes:       reportes[0],
    registros_7_dias: registros7d,
  });
});

// GET /api/admin/usuarios
const listarUsuarios = asyncHandler(async (req, res) => {
  const { buscar, estado, page = 1 } = req.query;
  const limit = 30, offset = (page - 1) * limit;
  let query = `SELECT u.id, u.username, u.email, u.nombre, u.ciudad, u.nivel, u.estado, u.verificado,
                      u.partidos_jugados, u.fecha_registro, r.puntos
               FROM usuarios u LEFT JOIN ranking r ON r.usuario_id = u.id WHERE 1=1`;
  const params = [];
  let idx = 1;

  if (buscar) {
    query += ` AND (LOWER(u.username) LIKE $${idx} OR LOWER(u.email) LIKE $${idx} OR LOWER(u.nombre) LIKE $${idx})`;
    params.push(`%${buscar.toLowerCase()}%`); idx++;
  }
  if (estado) { query += ` AND u.estado = $${idx++}`; params.push(estado); }
  query += ` ORDER BY u.fecha_registro DESC LIMIT $${idx++} OFFSET $${idx++}`;
  params.push(limit, offset);

  const { rows } = await pool.query(query, params);
  res.json(rows);
});

// PUT /api/admin/usuarios/:id/estado
const cambiarEstadoUsuario = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { estado, motivo } = req.body;
  await pool.query('UPDATE usuarios SET estado = $1 WHERE id = $2', [estado, id]);
  if (estado !== 'activo' && motivo) {
    await pool.query(
      `INSERT INTO sanciones (usuario_id, tipo, motivo, admin_id) VALUES ($1, $2, $3, $4)`,
      [id, estado === 'baneado' ? 'baneo' : 'suspension', motivo, req.admin.id]
    );
  }
  res.json({ mensaje: `Usuario ${estado} correctamente` });
});

// GET /api/admin/reportes
const listarReportes = asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT r.*,
      ur.username AS reportado_por_username,
      uu.username AS usuario_reportado_username
     FROM reportes r
     JOIN usuarios ur ON r.reportado_por = ur.id
     LEFT JOIN usuarios uu ON r.usuario_id = uu.id
     ORDER BY r.fecha DESC LIMIT 50`
  );
  res.json(rows);
});

// PUT /api/admin/reportes/:id
const resolverReporte = asyncHandler(async (req, res) => {
  const { estado } = req.body;
  await pool.query('UPDATE reportes SET estado = $1 WHERE id = $2', [estado, req.params.id]);
  res.json({ mensaje: 'Reporte actualizado' });
});

// GET /api/admin/torneos
const listarTorneosAdmin = asyncHandler(async (req, res) => {
  const { estado } = req.query;
  let query = `SELECT t.*, u.username AS organizador_username
               FROM torneos t JOIN usuarios u ON t.organizador_id = u.id WHERE 1=1`;
  const params = [];
  let idx = 1;

  if (estado === 'pendiente') {
    query += ` AND t.aprobado = false`;
  } else if (estado) {
    query += ` AND t.estado = $${idx++}`;
    params.push(estado);
  }
  query += ' ORDER BY t.fecha_inicio ASC LIMIT 50';

  const { rows } = await pool.query(query, params);
  res.json(rows);
});

// PUT /api/admin/torneos/:id/aprobar
const aprobarTorneo = asyncHandler(async (req, res) => {
  await pool.query('UPDATE torneos SET aprobado = true, estado = $1 WHERE id = $2', ['aprobado', req.params.id]);
  res.json({ mensaje: 'Torneo aprobado' });
});

// GET /api/admin/anuncios
const listarAnuncios = asyncHandler(async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM anuncios ORDER BY fecha_creacion DESC');
  res.json(rows);
});

// GET /api/anuncios — anuncios activos para usuarios autenticados
const anunciosActivos = asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, titulo, imagen_url, url_destino
     FROM anuncios
     WHERE activo = true
       AND fecha_inicio <= CURRENT_DATE
       AND fecha_fin    >= CURRENT_DATE
     ORDER BY RANDOM() LIMIT 3`
  );
  res.json(rows);
});

// POST /api/admin/anuncios
const crearAnuncio = asyncHandler(async (req, res) => {
  const { titulo, imagen_url, url_destino, fecha_inicio, fecha_fin } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO anuncios (titulo, imagen_url, url_destino, fecha_inicio, fecha_fin)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [titulo, imagen_url, url_destino, fecha_inicio, fecha_fin]
  );
  res.status(201).json(rows[0]);
});

// GET /api/admin/usuarios/:id — detalle completo
const detalleUsuario = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const [uRes, equipoRes, medallasRes, eventosRes] = await Promise.all([
    pool.query(
      `SELECT u.*, r.puntos AS ranking_puntos, r.posicion AS ranking_pos
       FROM usuarios u LEFT JOIN ranking r ON r.usuario_id = u.id
       WHERE u.id = $1`, [id]
    ),
    pool.query(
      `SELECT e.id, e.nombre, e.escudo_url, e.deporte, em.rol, em.fecha
       FROM equipo_miembros em JOIN equipos e ON e.id = em.equipo_id
       WHERE em.usuario_id = $1 AND e.estado = 'activo' LIMIT 1`, [id]
    ),
    pool.query(
      `SELECT m.nombre, m.icono, mu.fecha_obtenida
       FROM medallas_usuario mu JOIN medallas m ON m.id = mu.medalla_id
       WHERE mu.usuario_id = $1 ORDER BY mu.fecha_obtenida DESC LIMIT 10`, [id]
    ),
    pool.query(
      `SELECT ev.titulo, ev.deporte, ev.fecha_evento, i.estado AS inscripcion_estado
       FROM inscripciones i JOIN eventos ev ON ev.id = i.evento_id
       WHERE i.usuario_id = $1 ORDER BY ev.fecha_evento DESC LIMIT 5`, [id]
    ),
  ]);
  if (!uRes.rows.length) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json({
    ...uRes.rows[0],
    equipo: equipoRes.rows[0] || null,
    medallas: medallasRes.rows,
    eventos_recientes: eventosRes.rows,
  });
});

// ── Publicidad ────────────────────────────────────────────────────────────────
// POST /api/publicidad/solicitar (público)
const solicitarPublicidad = asyncHandler(async (req, res) => {
  const { empresa, contacto, email, telefono, tipo, duracion_dias, mensaje } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO publicidad_solicitudes (empresa, contacto, email, telefono, tipo, duracion_dias, mensaje)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
    [empresa, contacto, email, telefono || null, tipo, duracion_dias || 7, mensaje || null]
  );
  res.status(201).json({ mensaje: 'Solicitud recibida. Te contactaremos pronto.', id: rows[0].id });
});

// GET /api/admin/publicidad/solicitudes
const listarSolicitudes = asyncHandler(async (req, res) => {
  const { estado } = req.query;
  let query = 'SELECT * FROM publicidad_solicitudes WHERE 1=1';
  const params = [];
  if (estado) { query += ` AND estado = $1`; params.push(estado); }
  query += ' ORDER BY fecha_solicitud DESC LIMIT 100';
  const { rows } = await pool.query(query, params);
  res.json(rows);
});

// PUT /api/admin/publicidad/solicitudes/:id
const actualizarSolicitud = asyncHandler(async (req, res) => {
  const { estado, precio_acordado, notas_admin } = req.body;
  const { rows } = await pool.query(
    `UPDATE publicidad_solicitudes SET
       estado = COALESCE($1, estado),
       precio_acordado = COALESCE($2, precio_acordado),
       notas_admin = COALESCE($3, notas_admin)
     WHERE id = $4 RETURNING *`,
    [estado, precio_acordado || null, notas_admin || null, req.params.id]
  );
  res.json(rows[0]);
});

// GET /api/admin/publicidad/tarifas
const listarTarifas = asyncHandler(async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM publicidad_tarifas ORDER BY tipo, precio_base ASC');
  res.json(rows);
});

// GET /api/publicidad/tarifas (público)
const tarifasPublicas = asyncHandler(async (req, res) => {
  const { rows } = await pool.query('SELECT id, nombre, tipo, descripcion, precio_base, duracion_dias FROM publicidad_tarifas WHERE activo = true ORDER BY precio_base ASC');
  res.json(rows);
});

// PUT /api/admin/anuncios/:id
const editarAnuncio = asyncHandler(async (req, res) => {
  const { titulo, imagen_url, url_destino, fecha_inicio, fecha_fin } = req.body;
  const { rows } = await pool.query(
    `UPDATE anuncios SET
       titulo      = COALESCE($1, titulo),
       imagen_url  = COALESCE($2, imagen_url),
       url_destino = COALESCE($3, url_destino),
       fecha_inicio = COALESCE($4, fecha_inicio),
       fecha_fin    = COALESCE($5, fecha_fin)
     WHERE id = $6 RETURNING *`,
    [titulo, imagen_url, url_destino, fecha_inicio, fecha_fin, req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Anuncio no encontrado' });
  res.json(rows[0]);
});

// PUT /api/admin/anuncios/:id/toggle
const toggleAnuncio = asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `UPDATE anuncios SET activo = NOT activo WHERE id = $1 RETURNING id, activo`,
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Anuncio no encontrado' });
  res.json(rows[0]);
});

// DELETE /api/admin/anuncios/:id
const eliminarAnuncio = asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM anuncios WHERE id = $1', [req.params.id]);
  res.json({ mensaje: 'Anuncio eliminado' });
});

// GET /api/admin/equipos
const listarEquiposAdmin = asyncHandler(async (req, res) => {
  const { buscar, page = 1 } = req.query;
  const limit = 30, offset = (page - 1) * limit;
  let query = `
    SELECT e.id, e.nombre, e.deporte, e.ciudad, e.estado, e.escudo_url,
           e.wins, e.losses, e.draws, e.fecha_creacion,
           u.username AS capitan_username, u.foto_url AS capitan_foto,
           (SELECT COUNT(*) FROM equipo_miembros WHERE equipo_id = e.id) AS total_miembros
    FROM equipos e JOIN usuarios u ON u.id = e.capitan_id WHERE 1=1`;
  const params = [];
  let idx = 1;
  if (buscar) { query += ` AND (LOWER(e.nombre) LIKE $${idx} OR LOWER(u.username) LIKE $${idx})`; params.push(`%${buscar.toLowerCase()}%`); idx++; }
  query += ` ORDER BY e.fecha_creacion DESC LIMIT $${idx++} OFFSET $${idx++}`;
  params.push(limit, offset);
  const { rows } = await pool.query(query, params);
  res.json(rows);
});

// GET /api/admin/eventos
const listarEventosAdmin = asyncHandler(async (req, res) => {
  const { estado, page = 1 } = req.query;
  const limit = 30, offset = (page - 1) * limit;
  let query = `
    SELECT ev.id, ev.titulo, ev.deporte, ev.ciudad, ev.estado, ev.imagen_url,
           ev.fecha_evento, ev.fecha_creacion, ev.precio_entrada,
           u.username AS creador_username, u.foto_url AS creador_foto,
           (SELECT COUNT(*) FROM inscripciones WHERE evento_id = ev.id) AS total_inscritos
    FROM eventos ev JOIN usuarios u ON u.id = ev.creador_id WHERE 1=1`;
  const params = [];
  let idx = 1;
  if (estado) { query += ` AND ev.estado = $${idx++}`; params.push(estado); }
  query += ` ORDER BY ev.fecha_creacion DESC LIMIT $${idx++} OFFSET $${idx++}`;
  params.push(limit, offset);
  const { rows } = await pool.query(query, params);
  res.json(rows);
});

// DELETE /api/admin/usuarios/:id/foto
const eliminarFotoUsuario = asyncHandler(async (req, res) => {
  await pool.query('UPDATE usuarios SET foto_url = NULL WHERE id = $1', [req.params.id]);
  res.json({ mensaje: 'Foto eliminada' });
});

// PUT /api/admin/torneos/:id/rechazar
const rechazarTorneo = asyncHandler(async (req, res) => {
  await pool.query('UPDATE torneos SET aprobado = false, estado = $1 WHERE id = $2', ['cancelado', req.params.id]);
  res.json({ mensaje: 'Torneo rechazado' });
});

// GET /api/admin/stats — stats ampliadas
const statsAmpliadas = asyncHandler(async (req, res) => {
  const [topXp, topEquipos, actividadHoy] = await Promise.all([
    pool.query(`SELECT u.username, u.foto_url, u.nivel_xp, u.ciudad FROM usuarios u ORDER BY u.nivel_xp DESC LIMIT 5`),
    pool.query(`SELECT e.nombre, e.escudo_url, e.wins, (SELECT COUNT(*) FROM equipo_miembros WHERE equipo_id=e.id) AS miembros FROM equipos e WHERE e.estado='activo' ORDER BY e.wins DESC LIMIT 5`),
    pool.query(`SELECT
      (SELECT COUNT(*) FROM usuarios WHERE fecha_registro::date = CURRENT_DATE) AS nuevos_hoy,
      (SELECT COUNT(*) FROM eventos WHERE fecha_creacion::date = CURRENT_DATE) AS eventos_hoy,
      (SELECT COUNT(*) FROM retos WHERE created_at::date = CURRENT_DATE) AS retos_hoy`),
  ]);
  res.json({ top_xp: topXp.rows, top_equipos: topEquipos.rows, actividad_hoy: actividadHoy.rows[0] });
});

module.exports = {
  dashboard, listarUsuarios, cambiarEstadoUsuario, detalleUsuario,
  listarReportes, resolverReporte,
  listarTorneosAdmin, aprobarTorneo, rechazarTorneo,
  listarAnuncios, crearAnuncio, editarAnuncio, toggleAnuncio, eliminarAnuncio, anunciosActivos,
  listarEquiposAdmin, listarEventosAdmin, eliminarFotoUsuario, statsAmpliadas,
  solicitarPublicidad, listarSolicitudes, actualizarSolicitud, listarTarifas, tarifasPublicas,
};
