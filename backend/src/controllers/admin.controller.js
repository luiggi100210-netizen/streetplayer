const pool = require('../config/database');

// GET /api/admin/dashboard
async function dashboard(req, res, next) {
  try {
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
      usuarios: usuarios[0],
      eventos: eventos[0],
      torneos: torneos[0],
      reportes: reportes[0],
      registros_7_dias: registros7d,
    });
  } catch (err) { next(err); }
}

// GET /api/admin/usuarios
async function listarUsuarios(req, res, next) {
  try {
    const { buscar, estado, page = 1 } = req.query;
    const limit = 30, offset = (page - 1) * limit;
    let query = `SELECT u.id, u.username, u.email, u.nombre, u.ciudad, u.nivel, u.estado, u.verificado,
                        u.partidos_jugados, u.fecha_registro, r.puntos
                 FROM usuarios u LEFT JOIN ranking r ON r.usuario_id = u.id WHERE 1=1`;
    const params = [];
    let idx = 1;
    if (buscar) { query += ` AND (LOWER(u.username) LIKE $${idx} OR LOWER(u.email) LIKE $${idx} OR LOWER(u.nombre) LIKE $${idx})`; params.push(`%${buscar.toLowerCase()}%`); idx++; }
    if (estado) { query += ` AND u.estado = $${idx++}`; params.push(estado); }
    query += ` ORDER BY u.fecha_registro DESC LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(limit, offset);
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) { next(err); }
}

// PUT /api/admin/usuarios/:id/estado
async function cambiarEstadoUsuario(req, res, next) {
  try {
    const { id } = req.params;
    const { estado, motivo } = req.body;
    if (!['activo','suspendido','baneado'].includes(estado)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }
    await pool.query('UPDATE usuarios SET estado = $1 WHERE id = $2', [estado, id]);
    if (estado !== 'activo' && motivo) {
      await pool.query(
        `INSERT INTO sanciones (usuario_id, tipo, motivo, admin_id) VALUES ($1, $2, $3, $4)`,
        [id, estado === 'baneado' ? 'baneo' : 'suspension', motivo, req.admin.id]
      );
    }
    res.json({ mensaje: `Usuario ${estado} correctamente` });
  } catch (err) { next(err); }
}

// GET /api/admin/reportes
async function listarReportes(req, res, next) {
  try {
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
  } catch (err) { next(err); }
}

// PUT /api/admin/reportes/:id
async function resolverReporte(req, res, next) {
  try {
    const { estado } = req.body;
    await pool.query('UPDATE reportes SET estado = $1 WHERE id = $2', [estado, req.params.id]);
    res.json({ mensaje: 'Reporte actualizado' });
  } catch (err) { next(err); }
}

// GET /api/admin/torneos
async function listarTorneosAdmin(req, res, next) {
  try {
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
  } catch (err) { next(err); }
}

// PUT /api/admin/torneos/:id/aprobar
async function aprobarTorneo(req, res, next) {
  try {
    await pool.query('UPDATE torneos SET aprobado = true, estado = $1 WHERE id = $2', ['abierto', req.params.id]);
    res.json({ mensaje: 'Torneo aprobado' });
  } catch (err) { next(err); }
}

// GET /api/admin/anuncios
async function listarAnuncios(req, res, next) {
  try {
    const { rows } = await pool.query('SELECT * FROM anuncios ORDER BY fecha_creacion DESC');
    res.json(rows);
  } catch (err) { next(err); }
}

// POST /api/admin/anuncios
async function crearAnuncio(req, res, next) {
  try {
    const { titulo, imagen_url, url_destino, fecha_inicio, fecha_fin } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO anuncios (titulo, imagen_url, url_destino, fecha_inicio, fecha_fin)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [titulo, imagen_url, url_destino, fecha_inicio, fecha_fin]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
}

module.exports = { dashboard, listarUsuarios, cambiarEstadoUsuario, listarReportes, resolverReporte, listarTorneosAdmin, aprobarTorneo, listarAnuncios, crearAnuncio };
