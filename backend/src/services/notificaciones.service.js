const pool = require('../config/database');

async function notificar(usuarioId, tipo, mensaje, referenciaId = null) {
  const { rows } = await pool.query(
    'INSERT INTO notificaciones (usuario_id, tipo, mensaje, referencia_id) VALUES ($1,$2,$3,$4) RETURNING *',
    [usuarioId, tipo, mensaje, referenciaId]
  );
  if (global.io) {
    global.io.to(`user:${usuarioId}`).emit('notificacion', rows[0]);
  }
}

module.exports = { notificar };
