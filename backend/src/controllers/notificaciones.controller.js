const pool         = require('../config/database');
const asyncHandler = require('../middleware/asyncHandler');

// GET /api/notificaciones
const obtenerNotificaciones = asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT * FROM notificaciones WHERE usuario_id = $1 ORDER BY fecha DESC LIMIT 30`,
    [req.usuario.id]
  );
  res.json(rows);
});

// PUT /api/notificaciones/leer
const marcarLeidas = asyncHandler(async (req, res) => {
  await pool.query(
    'UPDATE notificaciones SET leida = true WHERE usuario_id = $1 AND leida = false',
    [req.usuario.id]
  );
  res.json({ mensaje: 'Notificaciones marcadas como leídas' });
});

// GET /api/notificaciones/conteo
const conteoNoLeidas = asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    'SELECT COUNT(*) AS total FROM notificaciones WHERE usuario_id = $1 AND leida = false',
    [req.usuario.id]
  );
  res.json({ total: parseInt(rows[0].total) });
});

module.exports = { obtenerNotificaciones, marcarLeidas, conteoNoLeidas };
