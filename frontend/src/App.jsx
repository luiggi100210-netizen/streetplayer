import { Routes, Route, Navigate, BrowserRouter } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout        from './components/navbar/Layout'
import Login         from './pages/auth/Login'
import Registro      from './pages/auth/Registro'
import Home          from './pages/home/Home'
import Eventos       from './pages/events/Eventos'
import EventoDetalle from './pages/events/EventoDetalle'
import CrearEvento   from './pages/events/CrearEvento'
import Perfil        from './pages/profile/Perfil'
import Ranking       from './pages/ranking/Ranking'
import Torneos       from './pages/tournaments/Torneos'

function PrivateRoute({ children }) {
  const { usuario } = useAuth()
  return usuario ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { usuario } = useAuth()
  return !usuario ? children : <Navigate to="/" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/registro" element={<PublicRoute><Registro /></PublicRoute>} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index                element={<Home />} />
        <Route path="eventos"       element={<Eventos />} />
        <Route path="eventos/nuevo" element={<CrearEvento />} />
        <Route path="eventos/:id"   element={<EventoDetalle />} />
        <Route path="perfil/:id"    element={<Perfil />} />
        <Route path="ranking"       element={<Ranking />} />
        <Route path="torneos"       element={<Torneos />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
