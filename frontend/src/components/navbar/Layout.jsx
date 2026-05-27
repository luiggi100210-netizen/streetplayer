import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';
import api from '../../services/api';

const COLORES_NIVEL = {
  rookie: '#888', amateur: '#9FE1CB', intermedio: '#60a5fa',
  avanzado: '#a78bfa', pro: '#fbbf24', elite: '#f87171', leyenda: '#fde68a',
};

function NivelBadge({ nivel }) {
  return (
    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: COLORES_NIVEL[nivel] ?? '#888' }}>
      {nivel}
    </span>
  );
}

const NAV = [
  { to: '/home',    label: 'Inicio',   icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { to: '/eventos', label: 'Eventos',  icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' },
  { to: '/ranking', label: 'Ranking',  icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { to: '/torneos', label: 'Torneos',  icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z' },
];

export default function Layout() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [notifs, setNotifs]         = useState(0);
  const [pendientes, setPendientes] = useState(0);
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      try {
        const [nRes, pRes] = await Promise.all([
          api.get('/notificaciones/conteo'),
          api.get('/calificaciones/pendientes'),
        ]);
        setNotifs(nRes.data.total);
        setPendientes(pRes.data.length);
      } catch {}
    };
    cargar();
    const t = setInterval(cargar, 60_000);
    return () => clearInterval(t);
  }, []);

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div className="min-h-screen bg-sp-bg flex flex-col">
      {/* Top navbar */}
      <header className="sticky top-0 z-40 bg-sp-bg/95 backdrop-blur border-b border-sp-border">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Link to="/home" className="font-impact text-lg tracking-wider shrink-0">
            <span className="text-white">STREET</span><span className="text-sp-green">PLAYER</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {NAV.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${isActive ? 'bg-sp-green text-white' : 'text-sp-muted hover:text-white'}`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {/* Calificaciones pendientes */}
            {pendientes > 0 && (
              <NavLink to="/calificaciones" className="relative">
                <div className="w-8 h-8 bg-yellow-500/20 border border-yellow-500/40 rounded-lg flex items-center justify-center hover:border-yellow-400 transition-colors">
                  <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 text-black text-[10px] font-bold rounded-full flex items-center justify-center">
                  {pendientes}
                </span>
              </NavLink>
            )}

            {/* Notificaciones */}
            <button className="relative w-8 h-8 bg-sp-card border border-sp-border rounded-lg flex items-center justify-center hover:border-sp-green transition-colors">
              <svg className="w-4 h-4 text-sp-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {notifs > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-sp-green text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {notifs}
                </span>
              )}
            </button>

            {/* Crear evento */}
            <Link to="/eventos/nuevo" className="hidden md:block btn-primary text-xs py-2 px-3">
              + EVENTO
            </Link>

            {/* Avatar */}
            <div className="relative">
              <button
                onClick={() => setMenuAbierto(p => !p)}
                className="flex items-center gap-2"
              >
                {usuario?.foto_url ? (
                  <img src={usuario.foto_url} className="w-8 h-8 rounded-full object-cover border border-sp-border" alt="" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-sp-green flex items-center justify-center text-white text-sm font-bold">
                    {usuario?.username?.[0]?.toUpperCase()}
                  </div>
                )}
                <NivelBadge nivel={usuario?.nivel_xp ?? 'rookie'} />
              </button>

              {menuAbierto && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuAbierto(false)} />
                  <div className="absolute right-0 top-10 w-48 bg-sp-card border border-sp-border rounded-xl shadow-2xl overflow-hidden z-50">
                    <Link to={`/perfil/${usuario?.id}`} onClick={() => setMenuAbierto(false)} className="flex items-center gap-2 px-4 py-3 hover:bg-sp-border transition-colors text-sm">
                      Mi perfil
                    </Link>
                    <Link to="/eventos/nuevo" onClick={() => setMenuAbierto(false)} className="flex items-center gap-2 px-4 py-3 hover:bg-sp-border transition-colors text-sm text-sp-green font-semibold">
                      + Crear evento
                    </Link>
                    <hr className="border-sp-border" />
                    <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-red-400 hover:bg-sp-border transition-colors text-sm">
                      Cerrar sesión
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 pb-16 md:pb-0">
        <Outlet />
      </main>

      {/* Bottom nav móvil */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-sp-card border-t border-sp-border z-40 safe-area-bottom">
        <div className="grid grid-cols-4 h-14">
          {NAV.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 transition-colors ${isActive ? 'text-sp-green' : 'text-sp-muted'}`
              }
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
              </svg>
              <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
