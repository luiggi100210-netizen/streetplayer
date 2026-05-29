import { createContext, useContext, useState, useEffect } from 'react'
import { disconnectSocket } from '../services/socket'
import axios from 'axios'

const AuthContext = createContext(null)

const BASE = import.meta.env.VITE_BACKEND_URL
  ? `${import.meta.env.VITE_BACKEND_URL}/api`
  : '/api'

export function AuthProvider({ children }) {
  const [usuario,  setUsuario]  = useState(null)
  const [cargando, setCargando] = useState(true)

  // Al montar: verificar token con el backend y cargar datos frescos
  useEffect(() => {
    const token = localStorage.getItem('sp_token')
    if (!token) { setCargando(false); return }

    axios.get(`${BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(({ data }) => {
      localStorage.setItem('sp_user', JSON.stringify(data))
      setUsuario(data)
    }).catch(() => {
      // Token inválido o expirado — limpiar sesión
      localStorage.removeItem('sp_token')
      localStorage.removeItem('sp_user')
    }).finally(() => setCargando(false))
  }, [])

  const login = (token, user) => {
    localStorage.setItem('sp_token', token)
    localStorage.setItem('sp_user', JSON.stringify(user))
    setUsuario(user)
  }

  const logout = () => {
    localStorage.removeItem('sp_token')
    localStorage.removeItem('sp_user')
    disconnectSocket()
    setUsuario(null)
  }

  return (
    <AuthContext.Provider value={{ usuario, cargando, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
