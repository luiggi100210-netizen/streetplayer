const pool = require('../config/database');

// GET /api/notificaciones
async function obtenerNotificaciones(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM notificaciones WHERE usuario_id = $1 ORDER BY fecha DESC LIMIT 30`,
      [req.usuario.id]
    );
    res.json(rows);
  } catch (err) { next(err); }
}

// PUT /api/notificaciones/leer
async function marcarLeidas(req, res, next) {
  try {
    await pool.query(
      'UPDATE notificaciones SET leida = true WHERE usuario_id = $1 AND leida = false',
      [req.usuario.id]
    );
    res.json({ mensaje: 'Notificaciones marcadas como leídas' });
  } catch (err) { next(err); }
}

// GET /api/notificaciones/conteo
async function conteoNoLeidas(req, res, next) {
  try {
    const { rows } = await pool.query(
      'SELECT COUNT(*) AS total FROM notificaciones WHERE usuario_id = $1 AND leida = false',
      [req.usuario.id]
    );
    res.json({ total: parseInt(rows[0].total) });
  } catch (err) { next(err); }
}

module.exports = { obtenerNotificaciones, marcarLeidas, conteoNoLeidas };
