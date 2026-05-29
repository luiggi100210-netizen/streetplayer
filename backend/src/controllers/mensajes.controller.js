const pool         = require('../config/database');
const asyncHandler = require('../middleware/asyncHandler');

// Obtener o crear conversación (siempre uid1 < uid2 para UNIQUE)
async function getOrCreateConv(uid1, uid2) {
  const [u1, u2] = uid1 < uid2 ? [uid1, uid2] : [uid2, uid1];
  const { rows: [conv] } = await pool.query(
    `INSERT INTO conversaciones (usuario1_id, usuario2_id)
     VALUES ($1, $2)
     ON CONFLICT (usuario1_id, usuario2_id) DO UPDATE
       SET ultima_actividad = conversaciones.ultima_actividad
     RETURNING *`,
    [u1, u2]
  );
  return conv;
}

// GET /api/mensajes — lista de conversaciones del usuario
const listarConversaciones = asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT c.*,
       CASE WHEN c.usuario1_id = $1 THEN u2.id       ELSE u1.id       END AS otro_id,
       CASE WHEN c.usuario1_id = $1 THEN u2.username ELSE u1.username END AS otro_username,
       CASE WHEN c.usuario1_id = $1 THEN u2.nombre   ELSE u1.nombre   END AS otro_nombre,
       CASE WHEN c.usuario1_id = $1 THEN u2.foto_url ELSE u1.foto_url END AS otro_foto,
       CASE WHEN c.usuario1_id = $1 THEN u2.nivel_xp ELSE u1.nivel_xp END AS otro_nivel,
       (SELECT COUNT(*) FROM mensajes m
        WHERE m.conversacion_id = c.id
          AND m.remitente_id != $1
          AND m.leido = false) AS no_leidos
     FROM conversaciones c
     JOIN usuarios u1 ON u1.id = c.usuario1_id
     JOIN usuarios u2 ON u2.id = c.usuario2_id
     WHERE c.usuario1_id = $1 OR c.usuario2_id = $1
     ORDER BY c.ultima_actividad DESC`,
    [req.usuario.id]
  );
  res.json(rows);
});

// GET /api/mensajes/:convId/mensajes — mensajes de una conversación
const obtenerMensajes = asyncHandler(async (req, res) => {
  const { convId } = req.params;
  const page   = Math.max(1, parseInt(req.query.page) || 1);
  const limit  = 50;
  const offset = (page - 1) * limit;

  const { rows: [conv] } = await pool.query(
    'SELECT * FROM conversaciones WHERE id = $1 AND (usuario1_id = $2 OR usuario2_id = $2)',
    [convId, req.usuario.id]
  );
  if (!conv) return res.status(403).json({ error: 'Sin acceso a esta conversación' });

  const { rows } = await pool.query(
    `SELECT m.id, m.conversacion_id, m.remitente_id, m.contenido, m.leido, m.fecha,
            u.username, u.foto_url, u.nivel_xp
     FROM mensajes m JOIN usuarios u ON u.id = m.remitente_id
     WHERE m.conversacion_id = $1
     ORDER BY m.fecha DESC
     LIMIT $2 OFFSET $3`,
    [convId, limit, offset]
  );

  // Marcar como leídos los del otro
  await pool.query(
    `UPDATE mensajes SET leido = true
     WHERE conversacion_id = $1 AND remitente_id != $2 AND leido = false`,
    [convId, req.usuario.id]
  );

  res.json(rows.reverse()); // más viejos primero
});

// POST /api/mensajes/:usuarioId — enviar mensaje a un usuario
const enviarMensaje = asyncHandler(async (req, res) => {
  const { usuarioId } = req.params;
  const { contenido }  = req.body;

  if (!contenido?.trim())              return res.status(400).json({ error: 'Mensaje vacío' });
  if (contenido.trim().length > 1000)  return res.status(400).json({ error: 'Mensaje demasiado largo (máx. 1000 caracteres)' });
  if (usuarioId === req.usuario.id)    return res.status(400).json({ error: 'No puedes escribirte a ti mismo' });

  const { rows: [dest] } = await pool.query(
    'SELECT id, username FROM usuarios WHERE id = $1 AND estado = $2',
    [usuarioId, 'activo']
  );
  if (!dest) return res.status(404).json({ error: 'Usuario no encontrado' });

  const conv = await getOrCreateConv(req.usuario.id, usuarioId);

  const { rows: [msg] } = await pool.query(
    `INSERT INTO mensajes (conversacion_id, remitente_id, contenido)
     VALUES ($1, $2, $3) RETURNING *`,
    [conv.id, req.usuario.id, contenido.trim()]
  );

  await pool.query(
    `UPDATE conversaciones
     SET ultimo_mensaje = $1, ultima_actividad = NOW()
     WHERE id = $2`,
    [contenido.trim().substring(0, 100), conv.id]
  );

  const msgOut = {
    ...msg,
    conversacion_id:  conv.id,
    username:         req.usuario.username,
    foto_url:         req.usuario.foto_url,
    nivel_xp:         req.usuario.nivel_xp,
  };

  // Notificar en tiempo real al destinatario
  global.io?.to(`user:${usuarioId}`).emit('nuevo_mensaje', msgOut);

  res.status(201).json(msgOut);
});

// PUT /api/mensajes/:convId/leer — marcar mensajes como leídos
const marcarLeido = asyncHandler(async (req, res) => {
  const { convId } = req.params;
  await pool.query(
    `UPDATE mensajes SET leido = true
     WHERE conversacion_id = $1 AND remitente_id != $2 AND leido = false`,
    [convId, req.usuario.id]
  );
  res.json({ ok: true });
});

// GET /api/mensajes/no-leidos — total de mensajes no leídos (para badge)
const totalNoLeidos = asyncHandler(async (req, res) => {
  const { rows: [r] } = await pool.query(
    `SELECT COUNT(*) AS total FROM mensajes m
     JOIN conversaciones c ON c.id = m.conversacion_id
     WHERE (c.usuario1_id = $1 OR c.usuario2_id = $1)
       AND m.remitente_id != $1
       AND m.leido = false`,
    [req.usuario.id]
  );
  res.json({ total: parseInt(r.total) });
});

module.exports = { listarConversaciones, obtenerMensajes, enviarMensaje, marcarLeido, totalNoLeidos };
