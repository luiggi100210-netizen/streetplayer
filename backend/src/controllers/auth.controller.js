const crypto            = require('crypto');
const pool              = require('../config/database');
const bcrypt            = require('bcryptjs');
const jwt               = require('jsonwebtoken');
const asyncHandler      = require('../middleware/asyncHandler');
const { reverseGeocode } = require('../utils/geocoding');
const admin             = require('../services/firebase');

// ──────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────

function generarUsername(nombre, email) {
  const base = (nombre || email.split('@')[0])
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')
    .substring(0, 14);
  const sufijo = Math.random().toString(36).substring(2, 6);
  return `${base || 'player'}_${sufijo}`;
}

/** Genera un JWT de corta duración para uso como access token. */
function generarToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES || '15m',
  });
}

/** Hashea un token crudo con SHA-256. */
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Genera un refresh token opaco (UUID), lo almacena en BD como hash
 * y devuelve el token crudo al llamador para enviarlo al cliente.
 */
async function generarRefreshToken(usuarioId) {
  const rawToken  = crypto.randomUUID();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 días

  await pool.query(
    'INSERT INTO refresh_tokens (usuario_id, token_hash, expires_at) VALUES ($1, $2, $3)',
    [usuarioId, tokenHash, expiresAt]
  );

  return rawToken;
}

// ──────────────────────────────────────────────────────────
// POST /api/auth/registro
// ──────────────────────────────────────────────────────────
const registro = asyncHandler(async (req, res) => {
  const { username, email, password, nombre, ciudad, deportes, lat, lng } = req.body;

  let ciudadFinal      = ciudad || null;
  let departamentoFinal = null;
  if (!ciudadFinal && lat != null && lng != null) {
    const geo = await reverseGeocode(lat, lng);
    ciudadFinal       = geo.ciudad      || null;
    departamentoFinal = geo.departamento || null;
  }

  const hash = await bcrypt.hash(password, 10);
  const { rows } = await pool.query(
    `INSERT INTO usuarios (username, email, password_hash, nombre, ciudad, departamento, deportes)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, username, email, nombre, foto_url, xp, nivel_xp`,
    [username.toLowerCase(), email.toLowerCase(), hash, nombre, ciudadFinal, departamentoFinal, deportes || []]
  );

  const usuario = rows[0];
  await pool.query('INSERT INTO ranking (usuario_id) VALUES ($1) ON CONFLICT DO NOTHING', [usuario.id]);

  const token        = generarToken({ id: usuario.id, username: usuario.username, esAdmin: false });
  const refreshToken = await generarRefreshToken(usuario.id);

  res.status(201).json({ token, refreshToken, usuario: { ...usuario, provider: 'email' } });
});

// ──────────────────────────────────────────────────────────
// POST /api/auth/login
// ──────────────────────────────────────────────────────────
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { rows } = await pool.query(
    `SELECT id, username, email, nombre, foto_url, password_hash, xp, nivel_xp, estado
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
  const token        = generarToken({ id: usuario.id, username: usuario.username, esAdmin: false });
  const refreshToken = await generarRefreshToken(usuario.id);

  res.json({ token, refreshToken, usuario: { ...datos, provider: 'email' } });
});

// ──────────────────────────────────────────────────────────
// POST /api/auth/admin/login
// ──────────────────────────────────────────────────────────
const loginAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { rows } = await pool.query(
    'SELECT * FROM admins WHERE email = $1 AND activo = true', [email.toLowerCase()]
  );
  if (rows.length === 0) return res.status(401).json({ error: 'Credenciales incorrectas' });

  const adminUser = rows[0];
  const valido = await bcrypt.compare(password, adminUser.password_hash);
  if (!valido) return res.status(401).json({ error: 'Credenciales incorrectas' });

  const token = generarToken({ id: adminUser.id, username: adminUser.username, rol: adminUser.rol, esAdmin: true });
  const { password_hash, ...datos } = adminUser;
  res.json({ token, admin: datos });
});

// ──────────────────────────────────────────────────────────
// GET /api/auth/me
// ──────────────────────────────────────────────────────────
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

// ──────────────────────────────────────────────────────────
// POST /api/auth/firebase — login con Google o Facebook
// ──────────────────────────────────────────────────────────
const loginFirebase = asyncHandler(async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) return res.status(400).json({ error: 'idToken requerido' });

  let decoded;
  try {
    decoded = await admin.auth().verifyIdToken(idToken);
  } catch {
    return res.status(401).json({ error: 'Token de Firebase inválido' });
  }

  const { uid, email, name, picture } = decoded;
  if (!email) return res.status(400).json({ error: 'La cuenta no tiene email asociado' });

  const provider = decoded.firebase?.sign_in_provider?.split('.')[0] || 'google';

  // 1. Buscar por firebase_uid
  let { rows } = await pool.query(
    `SELECT id, username, email, nombre, foto_url, xp, nivel_xp, estado
     FROM usuarios WHERE firebase_uid = $1`,
    [uid]
  );

  // 2. Buscar por email y vincular firebase_uid
  if (rows.length === 0) {
    const byEmail = await pool.query(
      `SELECT id, username, email, nombre, foto_url, xp, nivel_xp, estado
       FROM usuarios WHERE email = $1`,
      [email.toLowerCase()]
    );
    if (byEmail.rows.length > 0) {
      await pool.query(
        'UPDATE usuarios SET firebase_uid = $1, provider = $2 WHERE id = $3',
        [uid, provider, byEmail.rows[0].id]
      );
      rows = byEmail.rows;
    }
  }

  // 3. Crear usuario nuevo
  if (rows.length === 0) {
    const username = generarUsername(name, email);
    const inserted = await pool.query(
      `INSERT INTO usuarios
         (username, email, nombre, foto_url, firebase_uid, provider, deportes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, username, email, nombre, foto_url, xp, nivel_xp`,
      [username, email.toLowerCase(), name || username, picture || null, uid, provider, []]
    );
    await pool.query(
      'INSERT INTO ranking (usuario_id) VALUES ($1) ON CONFLICT DO NOTHING',
      [inserted.rows[0].id]
    );
    rows = inserted.rows;
  }

  const usuario = rows[0];
  if (usuario.estado === 'baneado')    return res.status(403).json({ error: 'Tu cuenta fue suspendida permanentemente' });
  if (usuario.estado === 'suspendido') return res.status(403).json({ error: 'Tu cuenta está suspendida temporalmente' });

  await pool.query('UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = $1', [usuario.id]);

  const token        = generarToken({ id: usuario.id, username: usuario.username, esAdmin: false });
  const refreshToken = await generarRefreshToken(usuario.id);

  res.json({ token, refreshToken, usuario: { ...usuario, provider } });
});

// ──────────────────────────────────────────────────────────
// POST /api/auth/refresh
// Rota el refresh token: invalida el recibido, emite uno nuevo.
// ──────────────────────────────────────────────────────────
const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'refreshToken requerido' });

  const tokenHash = hashToken(refreshToken);
  const { rows } = await pool.query(
    `SELECT rt.id, rt.usuario_id, rt.expires_at, rt.revocado,
            u.username, u.estado
     FROM refresh_tokens rt
     JOIN usuarios u ON u.id = rt.usuario_id
     WHERE rt.token_hash = $1`,
    [tokenHash]
  );

  if (rows.length === 0)            return res.status(401).json({ error: 'Sesión inválida' });
  const rt = rows[0];
  if (rt.revocado)                  return res.status(401).json({ error: 'Sesión revocada' });
  if (new Date() > rt.expires_at)   return res.status(401).json({ error: 'Sesión expirada' });
  if (rt.estado === 'baneado')      return res.status(403).json({ error: 'Tu cuenta fue suspendida permanentemente' });
  if (rt.estado === 'suspendido')   return res.status(403).json({ error: 'Tu cuenta está suspendida temporalmente' });

  // Rotar: revocar el token actual antes de emitir uno nuevo
  await pool.query('UPDATE refresh_tokens SET revocado = true WHERE id = $1', [rt.id]);

  const nuevoToken        = generarToken({ id: rt.usuario_id, username: rt.username, esAdmin: false });
  const nuevoRefreshToken = await generarRefreshToken(rt.usuario_id);

  res.json({ token: nuevoToken, refreshToken: nuevoRefreshToken });
});

// ──────────────────────────────────────────────────────────
// POST /api/auth/logout
// ──────────────────────────────────────────────────────────
const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    const tokenHash = hashToken(refreshToken);
    await pool.query(
      'UPDATE refresh_tokens SET revocado = true WHERE token_hash = $1',
      [tokenHash]
    );
  }
  res.json({ mensaje: 'Sesión cerrada' });
});

module.exports = { registro, login, loginAdmin, me, loginFirebase, refresh, logout };
