const pool   = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');

function generarToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
}

// POST /api/auth/registro
async function registro(req, res, next) {
  try {
    const { username, email, password, nombre, ciudad, deportes } = req.body;
    if (!username || !email || !password || !nombre) {
      return res.status(400).json({ error: 'username, email, password y nombre son requeridos' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const hash = await bcrypt.hash(password, 10);

    const { rows } = await pool.query(
      `INSERT INTO usuarios (username, email, password_hash, nombre, ciudad, deportes)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, username, email, nombre, foto_url, puntos, nivel`,
      [username.toLowerCase(), email.toLowerCase(), hash, nombre, ciudad || null, deportes || []]
    );

    const usuario = rows[0];
    // Crear entrada en ranking
    await pool.query('INSERT INTO ranking (usuario_id) VALUES ($1) ON CONFLICT DO NOTHING', [usuario.id]);

    const token = generarToken({ id: usuario.id, username: usuario.username, esAdmin: false });
    res.status(201).json({ token, usuario });
  } catch (err) {
    if (err.code === '23505') {
      const campo = err.constraint?.includes('email') ? 'email' : 'username';
      return res.status(409).json({ error: `Ese ${campo} ya está en uso` });
    }
    next(err);
  }
}

// POST /api/auth/login
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    const { rows } = await pool.query(
      `SELECT id, username, email, nombre, foto_url, password_hash, puntos, nivel, estado
       FROM usuarios WHERE email = $1`,
      [email.toLowerCase()]
    );

    if (rows.length === 0) return res.status(401).json({ error: 'Credenciales incorrectas' });
    const usuario = rows[0];

    if (usuario.estado === 'baneado') return res.status(403).json({ error: 'Tu cuenta fue suspendida permanentemente' });
    if (usuario.estado === 'suspendido') return res.status(403).json({ error: 'Tu cuenta está suspendida temporalmente' });

    const valido = await bcrypt.compare(password, usuario.password_hash);
    if (!valido) return res.status(401).json({ error: 'Credenciales incorrectas' });

    await pool.query('UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = $1', [usuario.id]);

    const { password_hash, ...datos } = usuario;
    const token = generarToken({ id: usuario.id, username: usuario.username, esAdmin: false });
    res.json({ token, usuario: datos });
  } catch (err) { next(err); }
}

// POST /api/auth/admin/login
async function loginAdmin(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email y contraseña requeridos' });

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
  } catch (err) { next(err); }
}

// GET /api/auth/me
async function me(req, res, next) {
  try {
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
  } catch (err) { next(err); }
}

module.exports = { registro, login, loginAdmin, me };
