import axios from 'axios';
import { getToken, getRefresh, setTokens, clearSession } from './authStorage';
import { API_BASE } from '../config';

const api = axios.create({ baseURL: API_BASE, timeout: 15000 });

// ── Request: adjunta el access token a cada petición ──────
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response: renovación silenciosa ante 401 ──────────────
// El backend rota el refresh token (invalida el recibido, emite uno nuevo),
// así que si dos peticiones expiran casi al mismo tiempo (p.ej. el Home
// dispara varias llamadas en paralelo con Promise.all) NO pueden llamar a
// /auth/refresh cada una por su cuenta: la segunda llegaría con un
// refreshToken ya revocado por la primera y forzaría un logout aunque la
// sesión siga siendo válida. Por eso compartimos una única promesa de
// renovación en curso entre todas las peticiones que caen en 401 a la vez.
let refrescoEnCurso = null;

const renovarSesion = () => {
  if (!refrescoEnCurso) {
    const refreshToken = getRefresh();
    if (!refreshToken) return Promise.reject(new Error('sin refresh token'));

    refrescoEnCurso = axios
      .post(`${API_BASE}/auth/refresh`, { refreshToken })
      .then(({ data }) => {
        setTokens(data.token, data.refreshToken);
        return data.token;
      })
      .finally(() => { refrescoEnCurso = null; });
  }
  return refrescoEnCurso;
};

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;

    // Solo actuar sobre 401 no reintentados que no vengan de /auth/
    const esRutaAuth = original.url?.includes('/auth/');
    if (err.response?.status === 401 && !original._retry && !esRutaAuth) {
      original._retry = true;

      try {
        const nuevoToken = await renovarSesion();
        original.headers.Authorization = `Bearer ${nuevoToken}`;
        return api(original); // reintentar la petición original
      } catch {
        // Sin refresh o renovación fallida: sesión expirada definitivamente
        clearSession();
        window.location.href = '/login';
      }
    }

    return Promise.reject(err);
  }
);

export default api;
