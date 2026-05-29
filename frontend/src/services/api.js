import axios from 'axios';
import { getToken, getRefresh, setTokens, clearSession } from './authStorage';

const BASE = import.meta.env.VITE_BACKEND_URL
  ? `${import.meta.env.VITE_BACKEND_URL}/api`
  : '/api';

const api = axios.create({ baseURL: BASE, timeout: 15000 });

// ── Request: adjunta el access token a cada petición ──────
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response: renovación silenciosa ante 401 ──────────────
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;

    // Solo actuar sobre 401 no reintentados que no vengan de /auth/
    const esRutaAuth = original.url?.includes('/auth/');
    if (err.response?.status === 401 && !original._retry && !esRutaAuth) {
      original._retry = true;
      const refreshToken = getRefresh();

      if (refreshToken) {
        try {
          const { data } = await axios.post(`${BASE}/auth/refresh`, { refreshToken });
          setTokens(data.token, data.refreshToken);
          original.headers.Authorization = `Bearer ${data.token}`;
          return api(original); // reintentar la petición original
        } catch {
          // El refresh falló — sesión expirada definitivamente
        }
      }

      // Sin refresh o renovación fallida: limpiar tokens y redirigir
      clearSession();
      window.location.href = '/login';
    }

    return Promise.reject(err);
  }
);

export default api;
