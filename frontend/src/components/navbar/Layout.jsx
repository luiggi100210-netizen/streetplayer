import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useState, useEffect } from 'react'
import api from '../../services/api'

const DEPORTES_EMOJIS = {
  fútbol: '⚽', basquet: '🏀', voley: '🏐', tenis: '🎾',
  natacion: '🏊', ciclismo: '🚴', running: '🏃', boxeo: '🥊',
}

export default function Layout() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()
  const [notifs, setNotifs] = useState(0)
  const [menuAbierto, setMenuAbierto] = useState(false)

  useEffect(() => {
    api.get('/notificaciones/conteo').then(({ data }) => setNotifs(data.total)).catch(() => {})
    const interval = setInterval(() => {
      api.get('/notificaciones/conteo').then(({ data }) => setNotifs(data.total)).catch(() => {})
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const navItem = 'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-[#64748b] hover:text-white hover:bg-[#1e1e2e] transition-all'
  const navActive = 'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold text-white bg-[#1e1e2e]'

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Navbar top */}
      <nav className="sticky top-0 z-50 bg-[#0a0a0f]/95 backdrop-blur border-b border-[#1e1e2e] px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          {/* Logo */}
          <NavLink to="/" className="text-xl font-black text-[#00e676] tracking-tight shrink-0">
            Street<span className="text-white">Player</span>
          </NavLink>

          {/* Nav links — desktop */}
          <div className="hidden md:flex items-center gap-1">
            <NavLink to="/"         end className={({isActive}) => isActive ? navActive : navItem}>🏠 Inicio</NavLink>
            <NavLink to="/eventos"  className={({isActive}) => isActive ? navActive : navItem}>📍 Eventos</NavLink>
            <NavLink to="/ranking"  className={({isActive}) => isActive ? navActive : navItem}>🏆 Ranking</NavLink>
            <NavLink to="/torneos"  className={({isActive}) => isActive ? navActive : navItem}>🎯 Torneos</NavLink>
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/eventos/nuevo')}
              className="hidden sm:flex items-center gap-1.5 bg-[#00e676] hover:bg-[#00c853] text-black text-sm font-bold px-3 py-1.5 rounded-xl transition-all"
            >
              + Evento
            </button>

            {/* Notificaciones */}
            <button className="relative p-2 rounded-xl hover:bg-[#1e1e2e] transition-all" onClick={() => navigate('/')}>
              <span className="text-lg">🔔</span>
              {notifs > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#ff6b2b] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {notifs > 9 ? '9+' : notifs}
                </span>
              )}
            </button>

            {/* Avatar */}
            <button
              onClick={() => setMenuAbierto(!menuAbierto)}
              className="relative w-9 h-9 rounded-full bg-[#1e1e2e] border-2 border-[#00e676]/30 overflow-hidden flex items-center justify-center"
            >
              {usuario?.foto_url
                ? <img src={usuario.foto_url} alt="" className="w-full h-full object-cover" />
                : <span className="text-sm font-bold text-[#00e676]">{usuario?.username?.[0]?.toUpperCase()}</span>
              }
            </button>

            {/* Dropdown */}
            {menuAbierto && (
              <div className="absolute right-4 top-14 w-48 bg-[#12121a] border border-[#1e1e2e] rounded-2xl shadow-2xl overflow-hidden z-50">
                <button
                  onClick={() => { navigate(`/perfil/${usuario.id}`); setMenuAbierto(false) }}
                  className="w-full text-left px-4 py-3 text-sm text-[#e2e8f0] hover:bg-[#1e1e2e] transition-colors"
                >
                  👤 Mi perfil
                </button>
                <div className="h-px bg-[#1e1e2e]" />
                <button
                  onClick={() => { logout(); navigate('/login') }}
                  className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-[#1e1e2e] transition-colors"
                >
                  🚪 Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Contenido */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        <Outlet />
      </main>

      {/* Nav bottom — móvil */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0a0a0f]/95 backdrop-blur border-t border-[#1e1e2e] px-2 py-2 z-50">
        <div className="flex justify-around">
          {[
            { to: '/',        label: 'Inicio',  icon: '🏠' },
            { to: '/eventos', label: 'Eventos', icon: '📍' },
            { to: '/eventos/nuevo', label: 'Crear', icon: '➕', highlight: true },
            { to: '/ranking', label: 'Ranking', icon: '🏆' },
            { to: '/torneos', label: 'Torneos', icon: '🎯' },
          ].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-xs transition-all ${
                  item.highlight
                    ? 'bg-[#00e676] text-black font-bold'
                    : isActive
                    ? 'text-[#00e676] font-bold'
                    : 'text-[#64748b]'
                }`
              }
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
