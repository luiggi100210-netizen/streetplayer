import { Routes, Route, Navigate, BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout        from './components/navbar/Layout';
import Landing       from './pages/Landing';
import Login         from './pages/auth/Login';
import Registro      from './pages/auth/Registro';
import Home          from './pages/home/Home';
import Eventos       from './pages/events/Eventos';
import EventoDetalle from './pages/events/EventoDetalle';
import CrearEvento   from './pages/events/CrearEvento';
import Perfil        from './pages/profile/Perfil';
import Ranking       from './pages/ranking/Ranking';
import Torneos       from './pages/tournaments/Torneos';
import Calificaciones from './pages/Calificaciones';
import Buscar         from './pages/Buscar';
import Equipos        from './pages/teams/Equipos';
import EquipoDetalle  from './pages/teams/EquipoDetalle';

function PrivateRoute({ children }) {
  const { usuario, cargando } = useAuth();
  if (cargando) return <Splash />;
  return usuario ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { usuario, cargando } = useAuth();
  if (cargando) return null;
  return !usuario ? children : <Navigate to="/home" replace />;
}

function Splash() {
  return (
    <div className="min-h-screen bg-sp-bg flex flex-col items-center justify-center gap-6">
      <div className="text-center">
        <p className="font-impact text-4xl text-sp-green tracking-widest">STREETPLAYER</p>
        <p className="text-sp-muted text-sm mt-1 uppercase tracking-widest">Cargando tu cancha...</p>
      </div>
      <div className="w-48 h-1 bg-sp-border rounded-full overflow-hidden">
        <div className="h-full bg-sp-green rounded-full animate-pulse w-2/3" />
      </div>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      {/* Landing pública */}
      <Route path="/"          element={<PublicRoute><Landing /></PublicRoute>} />
      <Route path="/login"     element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/registro"  element={<PublicRoute><Registro /></PublicRoute>} />

      {/* App autenticada */}
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route path="home"           element={<Home />} />
        <Route path="eventos"        element={<Eventos />} />
        <Route path="eventos/nuevo"  element={<CrearEvento />} />
        <Route path="eventos/:id"    element={<EventoDetalle />} />
        <Route path="perfil/:id"     element={<Perfil />} />
        <Route path="ranking"        element={<Ranking />} />
        <Route path="torneos"        element={<Torneos />} />
        <Route path="calificaciones" element={<Calificaciones />} />
        <Route path="buscar"         element={<Buscar />} />
        <Route path="equipos"        element={<Equipos />} />
        <Route path="equipos/:id"    element={<EquipoDetalle />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
