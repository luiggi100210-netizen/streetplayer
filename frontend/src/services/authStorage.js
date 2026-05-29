/**
 * authStorage — Fuente única de verdad para el almacenamiento de sesión.
 *
 * Claves:
 *   sp_token      — Access token JWT (vida corta, ~15 min)
 *   sp_refresh    — Refresh token opaco (vida larga, 30 días)
 *   sp_last_user  — Datos mínimos del último usuario (persiste entre sesiones)
 */

const KEYS = Object.freeze({
  TOKEN:     'sp_token',
  REFRESH:   'sp_refresh',
  LAST_USER: 'sp_last_user',
});

// ── Lecturas ──────────────────────────────────────────────

export const getToken    = () => localStorage.getItem(KEYS.TOKEN);
export const getRefresh  = () => localStorage.getItem(KEYS.REFRESH);
export const getLastUser = () => {
  try { return JSON.parse(localStorage.getItem(KEYS.LAST_USER)); }
  catch { return null; }
};

// ── Escrituras ────────────────────────────────────────────

/**
 * Persiste una sesión completa.
 * Se llama una sola vez al hacer login (email, Google o Facebook).
 * Actualiza también sp_last_user para el flujo "Continuar como".
 */
export const setSession = (token, refreshToken, user) => {
  localStorage.setItem(KEYS.TOKEN,   token);
  localStorage.setItem(KEYS.REFRESH, refreshToken);
  localStorage.setItem(KEYS.LAST_USER, JSON.stringify({
    id:        user.id,
    nombre:    user.nombre,
    username:  user.username,
    foto_url:  user.foto_url  || null,
    email:     user.email     || null,
    provider:  user.provider  || user.auth_provider || 'email',
  }));
};

/**
 * Actualiza únicamente los tokens tras una renovación silenciosa.
 * No modifica sp_last_user.
 */
export const setTokens = (token, refreshToken) => {
  localStorage.setItem(KEYS.TOKEN,   token);
  localStorage.setItem(KEYS.REFRESH, refreshToken);
};

// ── Limpiezas ─────────────────────────────────────────────

/**
 * Borra los tokens activos pero PRESERVA sp_last_user.
 * El usuario verá "Continuar como [nombre]" en el próximo intento.
 */
export const clearSession = () => {
  localStorage.removeItem(KEYS.TOKEN);
  localStorage.removeItem(KEYS.REFRESH);
  localStorage.removeItem('sp_user'); // clave legacy
};

/**
 * Borra absolutamente todo, incluyendo el último usuario.
 * Usar solo cuando el usuario hace "Usar otra cuenta".
 */
export const clearAll = () => {
  Object.values(KEYS).forEach(k => localStorage.removeItem(k));
  localStorage.removeItem('sp_user'); // clave legacy
};
