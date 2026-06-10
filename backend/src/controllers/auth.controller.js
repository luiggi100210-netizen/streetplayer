const crypto            = require('crypto');
const pool              = require('../config/database');
const bcrypt            = require('bcryptjs');
const jwt               = require('jsonwebtoken');
const asyncHandler      = require('../middleware/asyncHandler');
const withTransaction   = require('../db/withTransaction');
const { enviarEmail }   = require('../services/mailer');
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
function generarToken(payload, expiresIn = process.env.ACCESS_TOKEN_EXPIRES || '15m') {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
}

/** Hashea un token crudo con SHA-256. */
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/** Mensaje de bloqueo si la cuenta está baneada o suspendida; null si está activa. */
function errorEstadoCuenta(estado) {
  if (estado === 'baneado')    return 'Tu cuenta fue suspendida permanentemente';
  if (estado === 'suspendido') return 'Tu cuenta está suspendida temporalmente';
  return null;
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
  const usuario = await withTransaction(async (client) => {
    const { rows } = await client.query(
      `INSERT INTO usuarios (username, email, password_hash, nombre, ciudad, departamento, deportes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, username, email, nombre, foto_url, xp, nivel_xp`,
      [username.toLowerCase(), email.toLowerCase(), hash, nombre, ciudadFinal, departamentoFinal, deportes || []]
    );
    await client.query('INSERT INTO ranking (usuario_id) VALUES ($1) ON CONFLICT DO NOTHING', [rows[0].id]);
    return rows[0];
  });

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

  const bloqueoLogin = errorEstadoCuenta(usuario.estado);
  if (bloqueoLogin) return res.status(403).json({ error: bloqueoLogin });

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

  // El panel admin no usa refresh tokens: token único de jornada laboral
  const token = generarToken(
    { id: adminUser.id, username: adminUser.username, rol: adminUser.rol, esAdmin: true },
    process.env.ADMIN_TOKEN_EXPIRES || '8h'
  );
  const { password_hash, ...datos } = adminUser;
  res.json({ token, admin: datos });
});

// ──────────────────────────────────────────────────────────
// GET /api/auth/me
// ──────────────────────────────────────────────────────────
const me = asyncHandler(async (req, res) => {
  // Los tokens de admin referencian la tabla admins, no usuarios
  if (req.usuario.esAdmin) {
    const { rows } = await pool.query(
      'SELECT * FROM admins WHERE id = $1 AND activo = true',
      [req.usuario.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Admin no encontrado' });
    const { password_hash, ...datos } = rows[0];
    return res.json({ ...datos, esAdmin: true });
  }

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
    rows = await withTransaction(async (client) => {
      const inserted = await client.query(
        `INSERT INTO usuarios
           (username, email, nombre, foto_url, firebase_uid, provider, deportes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, username, email, nombre, foto_url, xp, nivel_xp`,
        [username, email.toLowerCase(), name || username, picture || null, uid, provider, []]
      );
      await client.query(
        'INSERT INTO ranking (usuario_id) VALUES ($1) ON CONFLICT DO NOTHING',
        [inserted.rows[0].id]
      );
      return inserted.rows;
    });
  }

  const usuario = rows[0];
  const bloqueoFirebase = errorEstadoCuenta(usuario.estado);
  if (bloqueoFirebase) return res.status(403).json({ error: bloqueoFirebase });

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
  const bloqueoRefresh = errorEstadoCuenta(rt.estado);
  if (bloqueoRefresh) return res.status(403).json({ error: bloqueoRefresh });

  // Rotar: revocar el token actual antes de emitir uno nuevo
  await pool.query('UPDATE refresh_tokens SET revocado = true WHERE id = $1', [rt.id]);

  const nuevoToken        = generarToken({ id: rt.usuario_id, username: rt.username, esAdmin: false });
  const nuevoRefreshToken = await generarRefreshToken(rt.usuario_id);

  res.json({ token: nuevoToken, refreshToken: nuevoRefreshToken });
});

// ──────────────────────────────────────────────────────────
// POST /api/auth/forgot — envía código de recuperación al email
// ──────────────────────────────────────────────────────────
const RESET_EXPIRA_MIN = 15;

const olvidePassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  // Respuesta uniforme: no revelar si el email existe o no
  const respuesta = { mensaje: 'Si el email está registrado, te enviamos un código de recuperación.' };

  const { rows } = await pool.query(
    'SELECT id, nombre FROM usuarios WHERE email = $1',
    [email.toLowerCase()]
  );
  if (rows.length === 0) return res.json(respuesta);
  const usuario = rows[0];

  const codigo    = crypto.randomInt(100000, 1000000).toString();
  const expiresAt = new Date(Date.now() + RESET_EXPIRA_MIN * 60 * 1000);
  await pool.query(
    'INSERT INTO password_resets (usuario_id, codigo_hash, expires_at) VALUES ($1, $2, $3)',
    [usuario.id, hashToken(codigo), expiresAt]
  );

  await enviarEmail({
    para:   email.toLowerCase(),
    asunto: `${codigo} es tu código de recuperación — StreetPlayer`,
    texto:  `Hola ${usuario.nombre},\n\nTu código para recuperar tu contraseña es: ${codigo}\n\nVence en ${RESET_EXPIRA_MIN} minutos. Si no lo pediste, ignora este correo.\n\nStreetPlayer — Juega. Rankea. Domina.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#0a0a0a;color:#fff;padding:32px;border-radius:16px">
        <p style="font-size:22px;font-weight:900;letter-spacing:1px;margin:0 0 24px">
          Street<span style="color:#1D9E75;font-style:italic">Player</span>
        </p>
        <p style="color:#bbb">Hola ${usuario.nombre},</p>
        <p style="color:#bbb">Tu código para recuperar tu contraseña es:</p>
        <p style="font-size:36px;font-weight:900;letter-spacing:8px;color:#1D9E75;text-align:center;margin:24px 0">${codigo}</p>
        <p style="color:#888;font-size:13px">Vence en ${RESET_EXPIRA_MIN} minutos. Si no lo pediste, ignora este correo.</p>
      </div>`,
  });

  res.json(respuesta);
});

// ──────────────────────────────────────────────────────────
// POST /api/auth/reset — valida el código y cambia la contraseña
// ──────────────────────────────────────────────────────────
const resetPassword = asyncHandler(async (req, res) => {
  const { email, codigo, password } = req.body;

  const { rows } = await pool.query(
    `SELECT pr.id, pr.usuario_id
     FROM password_resets pr
     JOIN usuarios u ON u.id = pr.usuario_id
     WHERE u.email = $1 AND pr.codigo_hash = $2
       AND pr.usado = false AND pr.expires_at > NOW()
     ORDER BY pr.creado_en DESC LIMIT 1`,
    [email.toLowerCase(), hashToken(codigo)]
  );
  if (rows.length === 0) return res.status(400).json({ error: 'Código inválido o expirado' });

  const hash = await bcrypt.hash(password, 10);
  await withTransaction(async (client) => {
    await client.query('UPDATE usuarios SET password_hash = $1 WHERE id = $2', [hash, rows[0].usuario_id]);
    await client.query('UPDATE password_resets SET usado = true WHERE usuario_id = $1', [rows[0].usuario_id]);
    // Cerrar todas las sesiones abiertas: si alguien robó la cuenta, queda fuera
    await client.query('UPDATE refresh_tokens SET revocado = true WHERE usuario_id = $1', [rows[0].usuario_id]);
  });

  res.json({ mensaje: 'Contraseña actualizada. Inicia sesión con tu nueva contraseña.' });
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

module.exports = { registro, login, loginAdmin, me, loginFirebase, refresh, logout, olvidePassword, resetPassword };
