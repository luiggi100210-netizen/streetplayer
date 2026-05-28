const pool              = require('../config/database');
const bcrypt            = require('bcryptjs');
const jwt               = require('jsonwebtoken');
const asyncHandler      = require('../middleware/asyncHandler');
const { reverseGeocode } = require('../utils/geocoding');

function generarToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
}

// POST /api/auth/registro
const registro = asyncHandler(async (req, res) => {
  const { username, email, password, nombre, ciudad, deportes, lat, lng } = req.body;

  // Si no hay ciudad pero sí coordenadas, intentar geolocalizar
  let ciudadFinal = ciudad || null;
  let departamentoFinal = null;
  if (!ciudadFinal && lat != null && lng != null) {
    const geo = await reverseGeocode(lat, lng);
    ciudadFinal      = geo.ciudad      || null;
    departamentoFinal = geo.departamento || null;
  }

  const hash = await bcrypt.hash(password, 10);
  const { rows } = await pool.query(
    `INSERT INTO usuarios (username, email, password_hash, nombre, ciudad, departamento, deportes)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, username, email, nombre, foto_url, puntos, nivel`,
    [username.toLowerCase(), email.toLowerCase(), hash, nombre, ciudadFinal, departamentoFinal, deportes || []]
  );

  const usuario = rows[0];
  await pool.query('INSERT INTO ranking (usuario_id) VALUES ($1) ON CONFLICT DO NOTHING', [usuario.id]);

  const token = generarToken({ id: usuario.id, username: usuario.username, esAdmin: false });
  res.status(201).json({ token, usuario });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { rows } = await pool.query(
    `SELECT id, username, email, nombre, foto_url, password_hash, puntos, nivel, estado
     FROM usuarios WHERE email = $1`,
    [email.toLowerCase()]
  );

  if (rows.length === 0) return res.status(401).json({ error: 'Credenciales incorrectas' });
  const usuario = rows[0];

  if (usuario.estado === 'baneado')    return res.status(403).json({ error: 'Tu cuenta fue suspendida permanentemente' });
  if (usuario.estado === 'suspendido') return res.status(403).json({ error: 'Tu cuenta está suspendida temporalmente' });

  const valido = await bcrypt.compare(password, usuario.password_hash);
  if (!valido) return res.status(401).json({ error: 'Credenciales incorrectas' });

  await pool.query('UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = $1', [usuario.id]);

  const { password_hash, ...datos } = usuario;
  const token = generarToken({ id: usuario.id, username: usuario.username, esAdmin: false });
  res.json({ token, usuario: datos });
});

// POST /api/auth/admin/login
const loginAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { rows } = await pool.query(
    'SELECT * FROM admins WHERE email = $1 AND activo = true', [email.toLowerCase()]
  );
  if (rows.length === 0) return res.status(401).json({ error: 'Credenciales incorrectas' });

  const admin = rows[0];
  const valido = await bcrypt.compare(password, admin.password_hash);
  if (!valido) return res.status(401).json({ error: 'Credenciales incorrectas' });

  const token = generarToken({ id: admin.id, username: admin.username, rol: admin.rol, esAdmin: true });
  const { password_hash, ...datos } = admin;
  res.json({ token, admin: datos });
});

// GET /api/auth/me
const me = asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT u.*, r.puntos AS ranking_puntos, r.posicion, r.victorias, r.derrotas
     FROM usuarios u
     LEFT JOIN ranking r ON r.usuario_id = u.id
     WHERE u.id = $1`,
    [req.usuario.id]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
  const { password_hash, ...datos } = rows[0];
  res.json(datos);
});

module.exports = { registro, login, loginAdmin, me };
