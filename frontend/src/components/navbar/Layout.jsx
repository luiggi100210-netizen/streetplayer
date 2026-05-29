import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { COLORES_NIVEL } from '../../constants';

const TIPO_NOTIF_ICON = {
  seguidor: '👤', evento: '⚽', calificacion: '⭐', xp: '🔥',
  torneo: '🏆', sancion: '⚠️', sistema: '📣',
};

const NAV = [
  { to: '/',         label: 'Inicio',    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { to: '/eventos',  label: 'Eventos',   icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { to: '/ranking',  label: 'Ranking',   icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { to: '/torneos',  label: 'Torneos',   icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z' },
  { to: '/equipos',  label: 'Equipos',   icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { to: '/buscar',   label: 'Buscar',    icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
  { to: '/mensajes', label: 'Mensajes',  icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
];

export default function Layout() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [notifs, setNotifs]             = useState([]);
  const [pendientes, setPendientes]     = useState(0);
  const [msgsNoLeidos, setMsgsNoLeidos] = useState(0);
  const [menuAbierto, setMenuAbierto]   = useState(false);
  const [notifAbierto, setNotifAbierto] = useState(false);
  const notifRef = useRef(null);

  const noLeidas = notifs.filter(n => !n.leida).length;

  const cargarNotifs = async () => {
    try {
      const [nRes, pRes, mRes] = await Promise.all([
        api.get('/notificaciones'),
        api.get('/calificaciones/pendientes'),
        api.get('/mensajes/no-leidos'),
      ]);
      setNotifs(nRes.data);
      setPendientes(pRes.data.length);
      setMsgsNoLeidos(mRes.data.total || 0);
    } catch {}
  };

  useEffect(() => {
    cargarNotifs();
    const t = setInterval(cargarNotifs, 60_000);
    return () => clearInterval(t);
  }, []);

  // Socket: actualizar badge de mensajes en tiempo real
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handler = () => setMsgsNoLeidos(n => n + 1);
    socket.on('nuevo_mensaje', handler);
    return () => socket.off('nuevo_mensaje', handler);
  }, []);

  const marcarLeidas = async () => {
    if (noLeidas === 0) return;
    try {
      await api.put('/notificaciones/leer');
      setNotifs(prev => prev.map(n => ({ ...n, leida: true })));
    } catch {}
  };

  const abrirNotifs = () => {
    setNotifAbierto(p => !p);
    setMenuAbierto(false);
    if (!notifAbierto) marcarLeidas();
  };

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div className="min-h-screen bg-sp-bg flex flex-col">
      <header className="sticky top-0 z-40 bg-sp-bg/95 backdrop-blur border-b border-sp-border">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Link to="/" className="font-impact text-lg tracking-wider shrink-0">
            <span className="text-white">STREET</span><span className="text-sp-green">PLAYER</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {NAV.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `relative px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${isActive ? 'bg-sp-green text-white' : 'text-sp-muted hover:text-white'}`
                }
              >
                {label}
                {to === '/mensajes' && msgsNoLeidos > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-sp-green text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {msgsNoLeidos > 9 ? '9+' : msgsNoLeidos}
                  </span>
                )}
              </NavLink>
            ))}
            <NavLink
              to="/mi-perfil"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${isActive ? 'bg-sp-green text-white' : 'text-sp-muted hover:text-white'}`
              }
            >
              Mi Perfil
            </NavLink>
          </nav>

          <div className="flex items-center gap-2">
            {/* Calificaciones pendientes */}
            {pendientes > 0 && (
              <NavLink to="/calificaciones" className="relative">
                <div className="w-10 h-10 bg-yellow-500/20 border border-yellow-500/40 rounded-lg flex items-center justify-center hover:border-yellow-400 transition-colors">
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
            <div className="relative" ref={notifRef}>
              <button
                onClick={abrirNotifs}
                className={`relative w-10 h-10 rounded-lg flex items-center justify-center transition-colors border ${notifAbierto ? 'bg-sp-green/20 border-sp-green text-sp-green' : 'bg-sp-card border-sp-border text-sp-muted hover:border-sp-green hover:text-white'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {noLeidas > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-sp-green text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {noLeidas > 9 ? '9+' : noLeidas}
                  </span>
                )}
              </button>

              {notifAbierto && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotifAbierto(false)} />
                  <div className="absolute right-0 top-10 w-80 bg-sp-card border border-sp-border rounded-xl shadow-2xl overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-sp-border flex items-center justify-between">
                      <p className="text-sm font-bold text-white">Notificaciones</p>
                      {noLeidas > 0 && (
                        <span className="text-xs text-sp-green">{noLeidas} nueva{noLeidas !== 1 ? 's' : ''}</span>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifs.length === 0 ? (
                        <p className="text-center text-sp-muted text-sm py-8">Sin notificaciones</p>
                      ) : (
                        notifs.map(n => (
                          <div
                            key={n.id}
                            className={`flex gap-3 px-4 py-3 border-b border-sp-border/50 last:border-0 transition-colors ${n.leida ? '' : 'bg-sp-green/5'}`}
                          >
                            <span className="text-lg shrink-0 mt-0.5">{TIPO_NOTIF_ICON[n.tipo] ?? '📣'}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white leading-snug">{n.mensaje}</p>
                              <p className="text-xs text-sp-muted mt-0.5">
                                {formatDistanceToNow(new Date(n.fecha), { addSuffix: true, locale: es })}
                              </p>
                            </div>
                            {!n.leida && <div className="w-1.5 h-1.5 rounded-full bg-sp-green mt-2 shrink-0" />}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Crear evento */}
            <Link to="/eventos/nuevo" className="hidden md:block btn-primary text-xs py-2 px-3">
              + EVENTO
            </Link>

            {/* Avatar + menu */}
            <div className="relative">
              <button
                onClick={() => { setMenuAbierto(p => !p); setNotifAbierto(false); }}
                className="flex items-center gap-2"
              >
                {usuario?.foto_url ? (
                  <img src={usuario.foto_url} className="w-8 h-8 rounded-full object-cover border border-sp-border" alt="" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-sp-green flex items-center justify-center text-white text-sm font-bold">
                    {usuario?.username?.[0]?.toUpperCase()}
                  </div>
                )}
                <span className="hidden md:block text-xs font-bold uppercase tracking-wider" style={{ color: COLORES_NIVEL[usuario?.nivel_xp] ?? '#888' }}>
                  {usuario?.nivel_xp ?? 'rookie'}
                </span>
              </button>

              {menuAbierto && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuAbierto(false)} />
                  <div className="absolute right-0 top-10 w-52 bg-sp-card border border-sp-border rounded-xl shadow-2xl overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-sp-border">
                      <p className="text-sm font-semibold text-white truncate">{usuario?.nombre || usuario?.username}</p>
                      <p className="text-xs text-sp-muted">@{usuario?.username}</p>
                    </div>
                    <Link to="/mi-perfil" onClick={() => setMenuAbierto(false)} className="flex items-center gap-2 px-4 py-3 hover:bg-white/5 transition-colors text-sm text-white">
                      Mi perfil
                    </Link>
                    <Link to="/buscar" onClick={() => setMenuAbierto(false)} className="flex items-center gap-2 px-4 py-3 hover:bg-white/5 transition-colors text-sm text-white">
                      Buscar jugadores
                    </Link>
                    <Link to="/mensajes" onClick={() => { setMenuAbierto(false); setMsgsNoLeidos(0); }} className="flex items-center gap-2 px-4 py-3 hover:bg-white/5 transition-colors text-sm text-white">
                      Mensajes
                      {msgsNoLeidos > 0 && <span className="ml-auto bg-sp-green text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{msgsNoLeidos}</span>}
                    </Link>
                    <Link to="/calificaciones" onClick={() => setMenuAbierto(false)} className="flex items-center gap-2 px-4 py-3 hover:bg-white/5 transition-colors text-sm">
                      <span className="text-yellow-400">Calificar</span>
                      {pendientes > 0 && <span className="ml-auto bg-yellow-400 text-black text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{pendientes}</span>}
                    </Link>
                    <Link to="/eventos/nuevo" onClick={() => setMenuAbierto(false)} className="flex items-center gap-2 px-4 py-3 hover:bg-white/5 transition-colors text-sm text-sp-green font-semibold">
                      + Crear evento
                    </Link>
                    <hr className="border-sp-border" />
                    <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-red-400 hover:bg-white/5 transition-colors text-sm">
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-sp-card border-t border-sp-border z-40">
        <div className="grid grid-cols-8 h-14">
          {NAV.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center gap-0.5 transition-colors ${isActive ? 'text-sp-green' : 'text-sp-muted'}`
              }
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
              </svg>
              <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>
              {to === '/mensajes' && msgsNoLeidos > 0 && (
                <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-sp-green text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                  {msgsNoLeidos > 9 ? '9+' : msgsNoLeidos}
                </span>
              )}
            </NavLink>
          ))}
          <NavLink
            to="/mi-perfil"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 transition-colors ${isActive ? 'text-sp-green' : 'text-sp-muted'}`
            }
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-[9px] font-bold uppercase tracking-wider">Perfil</span>
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
