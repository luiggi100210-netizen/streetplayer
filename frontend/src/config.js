/**
 * config.js — Fuente única de la URL del backend.
 * En desarrollo queda vacía: el proxy de Vite enruta /api, /uploads
 * y /socket.io hacia localhost:4000. En producción (Vercel) se define
 * VITE_BACKEND_URL con la URL de Render.
 */
export const BACKEND_ORIGIN = import.meta.env.VITE_BACKEND_URL || '';
export const API_BASE = `${BACKEND_ORIGIN}/api`;
