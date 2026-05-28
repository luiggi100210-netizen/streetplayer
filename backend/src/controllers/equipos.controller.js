const pool          = require('../config/database');
const asyncHandler  = require('../middleware/asyncHandler');
const { notificar } = require('../services/notificaciones.service');

// GET /api/equipos?q=&deporte=&ciudad=
const buscarEquipos = asyncHandler(async (req, res) => {
  const { q, deporte, ciudad } = req.query;
  let query = `
    SELECT e.id, e.nombre, e.escudo_url, e.deporte, e.ciudad,
           u.username AS capitan_username, u.foto_url AS capitan_foto,
           e.wins, e.losses, e.draws,
           (SELECT COUNT(*) FROM equipo_miembros WHERE equipo_id = e.id) AS total_miembros
    FROM equipos e JOIN usuarios u ON u.id = e.capitan_id
    WHERE e.estado = 'activo'
  `;
  const params = [];
  let idx = 1;

  if (q)       { query += ` AND LOWER(e.nombre) LIKE $${idx++}`;            params.push(`%${q.toLowerCase()}%`); }
  if (deporte) { query += ` AND LOWER(e.deporte) = $${idx++}`;              params.push(deporte.toLowerCase()); }
  if (ciudad)  { query += ` AND LOWER(e.ciudad) LIKE $${idx++}`;            params.push(`%${ciudad.toLowerCase()}%`); }

  query += ' ORDER BY e.wins DESC LIMIT 30';
  const { rows } = await pool.query(query, params);
  res.json(rows);
});

// GET /api/equipos/:id
const obtenerEquipo = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows } = await pool.query(
    `SELECT e.*, u.username AS capitan_username, u.foto_url AS capitan_foto
     FROM equipos e JOIN usuarios u ON u.id = e.capitan_id WHERE e.id = $1`, [id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Equipo no encontrado' });

  const { rows: miembros } = await pool.query(
    `SELECT u.id, u.username, u.nombre, u.foto_url, u.nivel_xp, em.rol, em.fecha
     FROM equipo_miembros em JOIN usuarios u ON u.id = em.usuario_id
     WHERE em.equipo_id = $1 ORDER BY em.rol DESC, em.fecha ASC`, [id]
  );

  res.json({ ...rows[0], miembros });
});

// POST /api/equipos
const crearEquipo = asyncHandler(async (req, res) => {
  const { nombre, deporte = 'futbol', ciudad, escudo_url } = req.body;

  const { rows: yaCapitan } = await pool.query(
    `SELECT id FROM equipos WHERE capitan_id = $1 AND estado = 'activo'`, [req.usuario.id]
  );
  if (yaCapitan.length) return res.status(400).json({ error: 'Ya eres capitán de un equipo activo' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      `INSERT INTO equipos (nombre, deporte, ciudad, escudo_url, capitan_id)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [nombre, deporte, ciudad || null, escudo_url || null, req.usuario.id]
    );
    const equipo = rows[0];

    await client.query(
      `INSERT INTO equipo_miembros (equipo_id, usuario_id, rol) VALUES ($1,$2,'capitan')`,
      [equipo.id, req.usuario.id]
    );
    await client.query(
      `UPDATE usuarios SET rol = 'capitan' WHERE id = $1 AND rol = 'jugador'`, [req.usuario.id]
    );

    await client.query('COMMIT');
    res.status(201).json(equipo);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

// PUT /api/equipos/:id
const actualizarEquipo = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { nombre, ciudad, escudo_url, deporte } = req.body;

  const { rows: [equipo] } = await pool.query('SELECT capitan_id FROM equipos WHERE id = $1', [id]);
  if (!equipo)                              return res.status(404).json({ error: 'Equipo no encontrado' });
  if (equipo.capitan_id !== req.usuario.id) return res.status(403).json({ error: 'Solo el capitán puede editar el equipo' });

  const { rows } = await pool.query(
    `UPDATE equipos SET
       nombre     = COALESCE($1, nombre),
       ciudad     = COALESCE($2, ciudad),
       escudo_url = COALESCE($3, escudo_url),
       deporte    = COALESCE($4, deporte)
     WHERE id = $5 RETURNING *`,
    [nombre, ciudad, escudo_url, deporte, id]
  );
  res.json(rows[0]);
});

// DELETE /api/equipos/:id
const eliminarEquipo = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows: [equipo] } = await pool.query('SELECT capitan_id FROM equipos WHERE id = $1', [id]);
  if (!equipo)                              return res.status(404).json({ error: 'Equipo no encontrado' });
  if (equipo.capitan_id !== req.usuario.id) return res.status(403).json({ error: 'Solo el capitán puede disolver el equipo' });

  await pool.query(`UPDATE equipos SET estado = 'disuelto' WHERE id = $1`, [id]);
  res.json({ mensaje: 'Equipo disuelto' });
});

// POST /api/equipos/:id/miembros — invitar jugador
const invitarMiembro = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { usuario_id } = req.body;

  const { rows: [equipo] } = await pool.query('SELECT capitan_id, nombre FROM equipos WHERE id = $1', [id]);
  if (!equipo)                              return res.status(404).json({ error: 'Equipo no encontrado' });
  if (equipo.capitan_id !== req.usuario.id) return res.status(403).json({ error: 'Solo el capitán puede invitar miembros' });

  const { rows: [yaEsMiembro] } = await pool.query(
    'SELECT 1 FROM equipo_miembros WHERE equipo_id = $1 AND usuario_id = $2', [id, usuario_id]
  );
  if (yaEsMiembro) return res.status(400).json({ error: 'El jugador ya es miembro del equipo' });

  await pool.query(
    `INSERT INTO equipo_miembros (equipo_id, usuario_id, rol) VALUES ($1,$2,'jugador')`, [id, usuario_id]
  );
  await notificar(usuario_id, 'equipo', `${req.usuario.username} te añadió al equipo "${equipo.nombre}"`, id);

  res.status(201).json({ mensaje: 'Jugador añadido al equipo' });
});

// DELETE /api/equipos/:id/miembros/:usuarioId — expulsar
const expulsarMiembro = asyncHandler(async (req, res) => {
  const { id, usuarioId } = req.params;

  const { rows: [equipo] } = await pool.query('SELECT capitan_id FROM equipos WHERE id = $1', [id]);
  if (!equipo)                              return res.status(404).json({ error: 'Equipo no encontrado' });
  if (equipo.capitan_id !== req.usuario.id) return res.status(403).json({ error: 'Solo el capitán puede expulsar miembros' });
  if (usuarioId === req.usuario.id)         return res.status(400).json({ error: 'El capitán no puede expulsarse a sí mismo' });

  const { rows } = await pool.query(
    'DELETE FROM equipo_miembros WHERE equipo_id = $1 AND usuario_id = $2 RETURNING *', [id, usuarioId]
  );
  if (!rows.length) return res.status(404).json({ error: 'El jugador no es miembro del equipo' });

  res.json({ mensaje: 'Jugador expulsado del equipo' });
});

// DELETE /api/equipos/:id/salir
const salirEquipo = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { rows: [equipo] } = await pool.query('SELECT capitan_id FROM equipos WHERE id = $1', [id]);
  if (!equipo) return res.status(404).json({ error: 'Equipo no encontrado' });
  if (equipo.capitan_id === req.usuario.id) {
    return res.status(400).json({ error: 'El capitán no puede salir. Disuelve el equipo o transfiere la capitanía.' });
  }

  const { rows } = await pool.query(
    'DELETE FROM equipo_miembros WHERE equipo_id = $1 AND usuario_id = $2 RETURNING *',
    [id, req.usuario.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'No eres miembro de este equipo' });

  res.json({ mensaje: 'Saliste del equipo' });
});

module.exports = { buscarEquipos, obtenerEquipo, crearEquipo, actualizarEquipo, eliminarEquipo, invitarMiembro, expulsarMiembro, salirEquipo };
