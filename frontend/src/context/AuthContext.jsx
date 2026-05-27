import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sp_user')) } catch { return null }
  })

  const login = (token, user) => {
    localStorage.setItem('sp_token', token)
    localStorage.setItem('sp_user', JSON.stringify(user))
    setUsuario(user)
  }

  const logout = () => {
    localStorage.removeItem('sp_token')
    localStorage.removeItem('sp_user')
    setUsuario(null)
  }

  return (
    <AuthContext.Provider value={{ usuario, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
