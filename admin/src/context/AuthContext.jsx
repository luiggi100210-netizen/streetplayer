import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('sp_admin_token');
    if (token) {
      api.get('/auth/me').then(({ data }) => {
        if (data.esAdmin) setAdmin(data);
        else { localStorage.removeItem('sp_admin_token'); }
      }).catch(() => {
        localStorage.removeItem('sp_admin_token');
      }).finally(() => setCargando(false));
    } else {
      setCargando(false);
    }
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/admin/login', { email, password });
    localStorage.setItem('sp_admin_token', data.token);
    setAdmin(data.admin);
  };

  const logout = () => {
    localStorage.removeItem('sp_admin_token');
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ admin, cargando, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
