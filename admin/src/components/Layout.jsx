import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/', label: 'Dashboard', icon: '📊', exact: true },
  { to: '/usuarios', label: 'Usuarios', icon: '👥' },
  { to: '/reportes', label: 'Reportes', icon: '🚨' },
  { to: '/torneos', label: 'Torneos', icon: '🏆' },
  { to: '/anuncios', label: 'Anuncios', icon: '📢' },
];

export default function Layout() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="min-h-screen bg-sp-bg flex">
      {/* Sidebar */}
      <aside className="w-56 bg-sp-card border-r border-sp-border flex flex-col shrink-0">
        <div className="p-5 border-b border-sp-border">
          <h1 className="text-sp-green font-bold text-lg">StreetPlayer</h1>
          <p className="text-gray-500 text-xs mt-0.5">Admin Panel</p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(({ to, label, icon, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-sp-green/10 text-sp-green border border-sp-green/20' : 'text-gray-400 hover:text-white hover:bg-sp-border'}`
              }
            >
              <span>{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-sp-border">
          <div className="flex items-center gap-2 px-3 py-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-sp-green/20 flex items-center justify-center text-sp-green text-xs font-bold">
              {admin?.username?.[0]?.toUpperCase()}
            </div>
            <span className="text-gray-300 text-sm truncate">{admin?.username}</span>
          </div>
          <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-red-400 text-sm hover:bg-red-500/10 rounded-lg transition-colors">
            Cerrar sesion
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
