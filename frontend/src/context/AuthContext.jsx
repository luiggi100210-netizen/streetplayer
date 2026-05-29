import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { disconnectSocket } from '../services/socket';
import {
  getToken, getRefresh,
  setSession, setTokens, clearSession, clearAll,
} from '../services/authStorage';

const AuthContext = createContext(null);

const BASE = import.meta.env.VITE_BACKEND_URL
  ? `${import.meta.env.VITE_BACKEND_URL}/api`
  : '/api';

export function AuthProvider({ children }) {
  const [usuario,  setUsuario]  = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const iniciarSesion = async () => {
      const token        = getToken();
      const refreshToken = getRefresh();

      // ── Caso 1: hay access token — verificar con el backend ──
      if (token) {
        try {
          const { data } = await axios.get(`${BASE}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUsuario(data);
          setCargando(false);
          return;
        } catch {
          // Access token inválido o expirado — intentar renovar
        }
      }

      // ── Caso 2: hay refresh token — renovar silenciosamente ──
      if (refreshToken) {
        try {
          const { data: renewed } = await axios.post(`${BASE}/auth/refresh`, { refreshToken });
          setTokens(renewed.token, renewed.refreshToken);

          const { data: me } = await axios.get(`${BASE}/auth/me`, {
            headers: { Authorization: `Bearer ${renewed.token}` },
          });
          setUsuario(me);
          setCargando(false);
          return;
        } catch {
          // Refresh expirado o revocado — limpiar tokens (preservar last_user)
          clearSession();
        }
      }

      // ── Caso 3: sin sesión válida — Login mostrará "Continuar como" ──
      setCargando(false);
    };

    iniciarSesion();
  }, []);

  /**
   * Persiste la sesión completa.
   * Llamar tras login exitoso (email, Google, Facebook o registro).
   */
  const login = (token, refreshToken, user) => {
    setSession(token, refreshToken, user);
    setUsuario(user);
  };

  /**
   * Cierra la sesión: invalida el refresh token en el backend
   * y limpia el almacenamiento local (preserva last_user para "Continuar como").
   */
  const logout = async () => {
    const refreshToken = getRefresh();
    if (refreshToken) {
      // Fire-and-forget — no bloquear el logout si el backend falla
      axios.post(`${BASE}/auth/logout`, { refreshToken }).catch(() => {});
    }
    clearSession();
    disconnectSocket();
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, cargando, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
