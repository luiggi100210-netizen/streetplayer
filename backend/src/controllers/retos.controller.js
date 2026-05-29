const pool          = require('../config/database');
const asyncHandler  = require('../middleware/asyncHandler');
const { notificar } = require('../services/notificaciones.service');

const RETO_QUERY = `
  SELECT r.*,
    er.nombre AS retador_nombre, er.escudo_url AS retador_escudo,
    ed.nombre AS retado_nombre,  ed.escudo_url AS retado_escudo,
    ur.username AS retador_capitan, ur.id AS retador_capitan_id,
    ud.username AS retado_capitan,  ud.id AS retado_capitan_id
  FROM retos r
  JOIN equipos er ON er.id = r.retador_id
  JOIN equipos ed ON ed.id = r.retado_id
  JOIN usuarios ur ON ur.id = er.capitan_id
  JOIN usuarios ud ON ud.id = ed.capitan_id
`;

async function notificarMiembrosEquipo(equipo_id, tipo, mensaje, ref) {
  const { rows } = await pool.query(
    'SELECT usuario_id FROM equipo_miembros WHERE equipo_id = $1', [equipo_id]
  );
  for (const { usuario_id } of rows) await notificar(usuario_id, tipo, mensaje, ref);
}

// GET /api/retos — retos del equipo del usuario
const obtenerRetos = asyncHandler(async (req, res) => {
  const { rows: [miembro] } = await pool.query(
    `SELECT em.equipo_id FROM equipo_miembros em WHERE em.usuario_id = $1 AND em.rol = 'capitan'`,
    [req.usuario.id]
  );
  if (!miembro) return res.json({ retos: [], mi_equipo_id: null });

  const { rows } = await pool.query(
    `${RETO_QUERY}
     WHERE r.retador_id = $1 OR r.retado_id = $1
     ORDER BY r.fecha DESC LIMIT 30`,
    [miembro.equipo_id]
  );
  res.json({ retos: rows, mi_equipo_id: miembro.equipo_id });
});

// GET /api/retos/comunidad — feed publico
const obtenerRetosComunidad = asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `${RETO_QUERY} ORDER BY r.fecha DESC LIMIT 30`
  );
  res.json(rows);
});

// GET /api/equipos/cercanos?lat=&lng=&radio=
const equiposCercanos = asyncHandler(async (req, res) => {
  const { lat, lng, radio = 15 } = req.query;

  const { rows: [miembro] } = await pool.query(
    `SELECT em.equipo_id FROM equipo_miembros em WHERE em.usuario_id = $1 AND em.rol = 'capitan'`,
    [req.usuario.id]
  );
  const miEquipoId = miembro?.equipo_id || null;

  if (!lat || !lng) {
    // Sin ubicacion: devolver todos los equipos activos
    const { rows } = await pool.query(
      `SELECT e.id, e.nombre, e.escudo_url, e.deporte, e.ciudad,
              e.wins, e.losses, e.draws,
              u.username AS capitan_username,
              (SELECT COUNT(*) FROM equipo_miembros WHERE equipo_id=e.id) AS total_miembros,
              NULL AS distancia_km
       FROM equipos e JOIN usuarios u ON u.id = e.capitan_id
       WHERE e.estado = 'activo' ${miEquipoId ? 'AND e.id != $1' : ''}
       ORDER BY e.wins DESC LIMIT 20`,
      miEquipoId ? [miEquipoId] : []
    );
    return res.json(rows);
  }

  const { rows } = await pool.query(
    `SELECT * FROM (
       SELECT e.id, e.nombre, e.escudo_url, e.deporte, e.ciudad,
              e.wins, e.losses, e.draws,
              u.username AS capitan_username,
              (SELECT COUNT(*) FROM equipo_miembros WHERE equipo_id=e.id) AS total_miembros,
              ROUND((6371 * acos(GREATEST(-1, LEAST(1,
                cos(radians($1)) * cos(radians(u.latitud)) *
                cos(radians(u.longitud) - radians($2)) +
                sin(radians($1)) * sin(radians(u.latitud))
              ))))::numeric, 1) AS distancia_km
       FROM equipos e JOIN usuarios u ON u.id = e.capitan_id
       WHERE e.estado = 'activo'
         AND u.latitud IS NOT NULL
         AND u.longitud IS NOT NULL
         ${miEquipoId ? 'AND e.id != $4' : ''}
     ) sub
     WHERE distancia_km <= $3
     ORDER BY distancia_km ASC LIMIT 20`,
    miEquipoId ? [parseFloat(lat), parseFloat(lng), parseFloat(radio), miEquipoId]
               : [parseFloat(lat), parseFloat(lng), parseFloat(radio)]
  );
  res.json(rows);
});

// POST /api/retos — lanzar reto
const crearReto = asyncHandler(async (req, res) => {
  const {
    equipo_retado_id,
    cancha,
    hora_propuesta,
    formato_reto = 'tiempo',
    valor_formato = 15,
    monto_apuesta = 0,
    moneda = 'PEN',
  } = req.body;

  // Verificar que el usuario es capitan
  const { rows: [miembro] } = await pool.query(
    `SELECT em.equipo_id FROM equipo_miembros em WHERE em.usuario_id = $1 AND em.rol = 'capitan'`,
    [req.usuario.id]
  );
  if (!miembro) return res.status(400).json({ error: 'Debes ser capitán de un equipo para retar' });

  // Verificar unlock de capitan (partidos_jugados >= 5)
  const { rows: [usuario] } = await pool.query(
    'SELECT partidos_jugados FROM usuarios WHERE id = $1', [req.usuario.id]
  );
  if ((usuario?.partidos_jugados || 0) < 5) {
    return res.status(403).json({ error: 'Necesitas al menos 5 partidos jugados para ser capitán y retar' });
  }

  if (miembro.equipo_id === equipo_retado_id)
    return res.status(400).json({ error: 'No puedes retarte a ti mismo' });

  const { rows: [retado] } = await pool.query(
    'SELECT id, nombre, capitan_id FROM equipos WHERE id = $1 AND estado = $2', [equipo_retado_id, 'activo']
  );
  if (!retado) return res.status(404).json({ error: 'Equipo retado no encontrado' });

  const { rows: pendiente } = await pool.query(
    `SELECT 1 FROM retos WHERE retador_id = $1 AND retado_id = $2 AND estado = 'pendiente'`,
    [miembro.equipo_id, equipo_retado_id]
  );
  if (pendiente.length) return res.status(400).json({ error: 'Ya tienes un reto pendiente con este equipo' });

  const { rows } = await pool.query(
    `INSERT INTO retos
       (retador_id, retado_id, cancha, hora_propuesta, formato_reto, valor_formato, monto_apuesta, moneda, propuesto_por)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$1) RETURNING *`,
    [miembro.equipo_id, equipo_retado_id, cancha || null, hora_propuesta || null,
     formato_reto, valor_formato, monto_apuesta, moneda]
  );

  const msg = `⚔️ Tu equipo "${retado.nombre}" recibió un reto — Cancha: ${cancha || 'por definir'}, Apuesta: ${monto_apuesta} ${moneda}`;
  await notificar(retado.capitan_id, 'reto', msg, rows[0].id);

  res.status(201).json(rows[0]);
});

// PUT /api/retos/:id/contraoferta — el equipo que recibio puede modificar y reenviar
const contraoferta = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { cancha, hora_propuesta, monto_apuesta, valor_formato } = req.body;

  const { rows: [reto] } = await pool.query(`${RETO_QUERY} WHERE r.id = $1`, [id]);
  if (!reto) return res.status(404).json({ error: 'Reto no encontrado' });
  if (reto.estado !== 'pendiente') return res.status(400).json({ error: 'El reto ya no está pendiente' });

  // El que NO hizo la ultima propuesta puede hacer contraoferta
  const { rows: [miembro] } = await pool.query(
    `SELECT em.equipo_id FROM equipo_miembros em WHERE em.usuario_id = $1 AND em.rol = 'capitan'`,
    [req.usuario.id]
  );
  if (!miembro) return res.status(403).json({ error: 'Solo el capitán puede hacer contraoferta' });
  if (miembro.equipo_id === reto.propuesto_por)
    return res.status(400).json({ error: 'Espera la respuesta de tu oferta antes de hacer otra' });
  if (miembro.equipo_id !== reto.retador_id && miembro.equipo_id !== reto.retado_id)
    return res.status(403).json({ error: 'No eres parte de este reto' });
  if (reto.rondas_contraoferta >= 3)
    return res.status(400).json({ error: 'Máximo 3 rondas de contraoferta alcanzadas' });

  const { rows } = await pool.query(
    `UPDATE retos SET
       cancha = COALESCE($1, cancha),
       hora_propuesta = COALESCE($2, hora_propuesta),
       monto_apuesta = COALESCE($3, monto_apuesta),
       valor_formato = COALESCE($4, valor_formato),
       propuesto_por = $5,
       rondas_contraoferta = rondas_contraoferta + 1
     WHERE id = $6 RETURNING *`,
    [cancha, hora_propuesta, monto_apuesta, valor_formato, miembro.equipo_id, id]
  );

  // Notificar al otro capitan
  const otroCap = miembro.equipo_id === reto.retador_id
    ? reto.retado_capitan_id : reto.retador_capitan_id;
  const otroEquipo = miembro.equipo_id === reto.retador_id
    ? reto.retado_nombre : reto.retador_nombre;
  await notificar(otroCap, 'reto',
    `Contraoferta recibida de ${otroEquipo}: ${cancha || reto.cancha || 'misma cancha'}, ${monto_apuesta || reto.monto_apuesta} ${reto.moneda}`,
    id);

  res.json(rows[0]);
});

// PUT /api/retos/:id/responder — aceptar o rechazar
const responderReto = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { accion } = req.body; // 'aceptar' | 'rechazar'

  const { rows: [reto] } = await pool.query(`${RETO_QUERY} WHERE r.id = $1`, [id]);
  if (!reto) return res.status(404).json({ error: 'Reto no encontrado' });
  if (reto.estado !== 'pendiente') return res.status(400).json({ error: 'El reto ya fue respondido' });

  // Quien puede responder = el que NO hizo la ultima propuesta
  const { rows: [miembro] } = await pool.query(
    `SELECT em.equipo_id FROM equipo_miembros em WHERE em.usuario_id = $1 AND em.rol = 'capitan'`,
    [req.usuario.id]
  );
  if (!miembro) return res.status(403).json({ error: 'Solo el capitán puede responder' });
  if (miembro.equipo_id === reto.propuesto_por)
    return res.status(403).json({ error: 'No puedes responder tu propia oferta' });
  if (miembro.equipo_id !== reto.retador_id && miembro.equipo_id !== reto.retado_id)
    return res.status(403).json({ error: 'No eres parte de este reto' });

  const nuevoEstado = accion === 'aceptar' ? 'aceptado' : 'rechazado';
  const { rows } = await pool.query(
    'UPDATE retos SET estado = $1 WHERE id = $2 RETURNING *', [nuevoEstado, id]
  );

  if (nuevoEstado === 'aceptado') {
    // Notificar a TODOS los miembros de ambos equipos
    const fecha = reto.hora_propuesta
      ? new Date(reto.hora_propuesta).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })
      : 'por confirmar';
    const apuesta = `${reto.monto_apuesta} ${reto.moneda}`;
    const formato = reto.formato_reto === 'goles'
      ? `${reto.valor_formato} goles` : `${reto.valor_formato} min`;
    const msgLocal  = `RETO CONFIRMADO vs ${reto.retado_nombre} | Cancha: ${reto.cancha || '?'} | ${fecha} | ${formato} por ${apuesta}`;
    const msgVisita = `RETO CONFIRMADO vs ${reto.retador_nombre} | Cancha: ${reto.cancha || '?'} | ${fecha} | ${formato} por ${apuesta}`;

    await notificarMiembrosEquipo(reto.retador_id, 'reto', msgLocal,  id);
    await notificarMiembrosEquipo(reto.retado_id,  'reto', msgVisita, id);
  } else {
    const otroCap = miembro.equipo_id === reto.retador_id
      ? reto.retado_capitan_id : reto.retador_capitan_id;
    await notificar(otroCap, 'reto', `Tu reto fue rechazado`, id);
  }

  res.json(rows[0]);
});

// GET /api/retos/:id/chat
const getChatReto = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { rows: [reto] } = await pool.query(
    'SELECT retador_id, retado_id FROM retos WHERE id = $1', [id]
  );
  if (!reto) return res.status(404).json({ error: 'Reto no encontrado' });

  // Solo capitanes de los dos equipos pueden ver el chat
  const { rows: [miembro] } = await pool.query(
    `SELECT em.equipo_id FROM equipo_miembros em WHERE em.usuario_id = $1 AND em.rol = 'capitan'`,
    [req.usuario.id]
  );
  if (!miembro || (miembro.equipo_id !== reto.retador_id && miembro.equipo_id !== reto.retado_id))
    return res.status(403).json({ error: 'Acceso denegado' });

  const { rows } = await pool.query(
    `SELECT rm.*, u.username, u.foto_url, u.nombre
     FROM reto_mensajes rm JOIN usuarios u ON u.id = rm.usuario_id
     WHERE rm.reto_id = $1 ORDER BY rm.fecha ASC`, [id]
  );
  res.json(rows);
});

// POST /api/retos/:id/chat
const postChatReto = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { contenido } = req.body;
  if (!contenido?.trim()) return res.status(400).json({ error: 'Mensaje vacío' });

  const { rows: [reto] } = await pool.query(
    'SELECT retador_id, retado_id FROM retos WHERE id = $1', [id]
  );
  if (!reto) return res.status(404).json({ error: 'Reto no encontrado' });

  const { rows: [miembro] } = await pool.query(
    `SELECT em.equipo_id FROM equipo_miembros em WHERE em.usuario_id = $1 AND em.rol = 'capitan'`,
    [req.usuario.id]
  );
  if (!miembro || (miembro.equipo_id !== reto.retador_id && miembro.equipo_id !== reto.retado_id))
    return res.status(403).json({ error: 'Solo los capitanes pueden chatear' });

  const { rows } = await pool.query(
    `INSERT INTO reto_mensajes (reto_id, usuario_id, contenido) VALUES ($1,$2,$3)
     RETURNING *`, [id, req.usuario.id, contenido.trim()]
  );

  const msg = { ...rows[0], username: req.usuario.username, foto_url: req.usuario.foto_url };

  // Emitir por socket al otro capitan
  if (global.io) global.io.to(`reto:${id}`).emit('reto_mensaje', msg);

  res.status(201).json(msg);
});

module.exports = {
  obtenerRetos, crearReto, responderReto, obtenerRetosComunidad,
  equiposCercanos, contraoferta, getChatReto, postChatReto,
};
