const pool          = require('../config/database');
const asyncHandler  = require('../middleware/asyncHandler');
const { notificar } = require('../services/notificaciones.service');

// GET /api/retos — retos del equipo del usuario (como capitán)
const obtenerRetos = asyncHandler(async (req, res) => {
  const { rows: [miembro] } = await pool.query(
    `SELECT equipo_id FROM equipo_miembros WHERE usuario_id = $1 AND rol = 'capitan'`,
    [req.usuario.id]
  );
  if (!miembro) return res.json([]);

  const { rows } = await pool.query(
    `SELECT r.*,
       er.nombre AS retador_nombre, er.escudo_url AS retador_escudo,
       ed.nombre AS retado_nombre,  ed.escudo_url AS retado_escudo
     FROM retos r
     JOIN equipos er ON er.id = r.retador_id
     JOIN equipos ed ON ed.id = r.retado_id
     WHERE r.retador_id = $1 OR r.retado_id = $1
     ORDER BY r.fecha DESC LIMIT 20`,
    [miembro.equipo_id]
  );
  res.json(rows);
});

// POST /api/retos — lanzar reto
const crearReto = asyncHandler(async (req, res) => {
  const { equipo_retado_id } = req.body;

  const { rows: [miembro] } = await pool.query(
    `SELECT equipo_id FROM equipo_miembros WHERE usuario_id = $1 AND rol = 'capitan'`,
    [req.usuario.id]
  );
  if (!miembro) return res.status(400).json({ error: 'Debes ser capitán de un equipo para retar' });
  if (miembro.equipo_id === equipo_retado_id) return res.status(400).json({ error: 'No puedes retarte a ti mismo' });

  const { rows: [retado] } = await pool.query('SELECT id, nombre, capitan_id FROM equipos WHERE id = $1', [equipo_retado_id]);
  if (!retado) return res.status(404).json({ error: 'Equipo retado no encontrado' });

  const { rows: pendiente } = await pool.query(
    `SELECT 1 FROM retos WHERE retador_id = $1 AND retado_id = $2 AND estado = 'pendiente'`,
    [miembro.equipo_id, equipo_retado_id]
  );
  if (pendiente.length) return res.status(400).json({ error: 'Ya tienes un reto pendiente con este equipo' });

  const { rows } = await pool.query(
    `INSERT INTO retos (retador_id, retado_id) VALUES ($1,$2) RETURNING *`,
    [miembro.equipo_id, equipo_retado_id]
  );

  await notificar(retado.capitan_id, 'reto', `Tu equipo "${retado.nombre}" recibió un reto`, rows[0].id);

  res.status(201).json(rows[0]);
});

// PUT /api/retos/:id/responder — aceptar o rechazar
const responderReto = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { accion } = req.body; // 'aceptar' | 'rechazar'

  const { rows: [reto] } = await pool.query('SELECT * FROM retos WHERE id = $1', [id]);
  if (!reto)                    return res.status(404).json({ error: 'Reto no encontrado' });
  if (reto.estado !== 'pendiente') return res.status(400).json({ error: 'El reto ya fue respondido' });

  const { rows: [miembro] } = await pool.query(
    `SELECT equipo_id FROM equipo_miembros WHERE usuario_id = $1 AND rol = 'capitan' AND equipo_id = $2`,
    [req.usuario.id, reto.retado_id]
  );
  if (!miembro) return res.status(403).json({ error: 'Solo el capitán del equipo retado puede responder' });

  const nuevoEstado = accion === 'aceptar' ? 'aceptado' : 'rechazado';
  const { rows } = await pool.query(
    'UPDATE retos SET estado = $1 WHERE id = $2 RETURNING *', [nuevoEstado, id]
  );

  const { rows: [retador] } = await pool.query('SELECT capitan_id, nombre FROM equipos WHERE id = $1', [reto.retador_id]);
  await notificar(
    retador.capitan_id, 'reto',
    `Tu reto fue ${nuevoEstado === 'aceptado' ? 'aceptado ✅' : 'rechazado ❌'}`,
    id
  );

  res.json(rows[0]);
});

module.exports = { obtenerRetos, crearReto, responderReto };
