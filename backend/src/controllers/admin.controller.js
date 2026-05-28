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
  await pool.query('UPDATE torneos SET aprobado = true, estado = $1 WHERE id = $2', ['abierto', req.params.id]);
  res.json({ mensaje: 'Torneo aprobado' });
});

// GET /api/admin/anuncios
const listarAnuncios = asyncHandler(async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM anuncios ORDER BY fecha_creacion DESC');
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

module.exports = { dashboard, listarUsuarios, cambiarEstadoUsuario, listarReportes, resolverReporte, listarTorneosAdmin, aprobarTorneo, listarAnuncios, crearAnuncio };
