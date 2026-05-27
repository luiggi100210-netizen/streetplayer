import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Usuarios from './pages/Usuarios';
import Reportes from './pages/Reportes';
import Torneos from './pages/Torneos';
import Anuncios from './pages/Anuncios';

function PrivateRoute({ children }) {
  const { admin, cargando } = useAuth();
  if (cargando) return (
    <div className="min-h-screen bg-sp-bg flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-sp-green border-t-transparent rounded-full animate-spin" />
    </div>
  );
  return admin ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { admin, cargando } = useAuth();
  if (cargando) return null;
  return admin ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="usuarios" element={<Usuarios />} />
            <Route path="reportes" element={<Reportes />} />
            <Route path="torneos" element={<Torneos />} />
            <Route path="anuncios" element={<Anuncios />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
