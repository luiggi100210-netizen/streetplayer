import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function EventoDetalle() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [evento, setEvento] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [accionando, setAccionando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const cargar = async () => {
      try {
        const { data } = await api.get(`/eventos/${id}`);
        setEvento(data);
      } catch {
        navigate('/eventos');
      }
      setCargando(false);
    };
    cargar();
  }, [id]);

  const inscripto = evento?.participantes?.some(p => p.usuario_id === usuario?.id);
  const esOrganizador = evento?.organizador_id === usuario?.id;
  const lleno = parseInt(evento?.inscritos) >= (evento?.cupos || 10);

  const handleInscripcion = async () => {
    setAccionando(true);
    setError('');
    try {
      if (inscripto) {
        await api.delete(`/eventos/${id}/salir`);
      } else {
        await api.post(`/eventos/${id}/inscribirse`);
      }
      const { data } = await api.get(`/eventos/${id}`);
      setEvento(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al procesar');
    }
    setAccionando(false);
  };

  if (cargando) return (
    <div className="max-w-3xl mx-auto px-4 py-6 animate-pulse">
      <div className="h-64 bg-sp-card rounded-2xl mb-6" />
      <div className="h-8 bg-sp-card rounded w-1/2 mb-3" />
      <div className="h-4 bg-sp-card rounded w-1/3" />
    </div>
  );

  if (!evento) return null;

  const inscritos = parseInt(evento.inscritos) || 0;
  const cupos = evento.cupos || 10;
  const porcentaje = Math.min((inscritos / cupos) * 100, 100);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {evento.foto_url ? (
        <img src={evento.foto_url} alt={evento.nombre} className="w-full h-64 object-cover rounded-2xl mb-6" />
      ) : (
        <div className="w-full h-40 rounded-2xl mb-6 bg-sp-card border border-sp-border flex items-center justify-center text-6xl">
          {evento.deporte === 'futbol' ? '⚽' : evento.deporte === 'basquet' ? '🏀' : '🏃'}
        </div>
      )}

      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">{evento.nombre}</h1>
          <span className="badge-green text-sm capitalize">{evento.deporte}</span>
        </div>
        {evento.precio > 0 && (
          <div className="text-right">
            <p className="text-sp-orange text-2xl font-bold">${evento.precio}</p>
            <p className="text-gray-500 text-xs">por persona</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card">
          <p className="text-gray-500 text-xs mb-1">Fecha y hora</p>
          <p className="text-white font-medium">
            {evento.fecha ? new Date(evento.fecha).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }) : '-'}
          </p>
          <p className="text-gray-400 text-sm">
            {evento.fecha ? new Date(evento.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : ''}
          </p>
        </div>
        <div className="card">
          <p className="text-gray-500 text-xs mb-1">Ubicacion</p>
          <p className="text-white font-medium">{evento.ciudad}</p>
          <p className="text-gray-400 text-sm text-sm truncate">{evento.direccion || 'Ver en mapa'}</p>
        </div>
      </div>

      {evento.descripcion && (
        <div className="card mb-6">
          <h2 className="font-semibold text-white mb-2">Descripcion</h2>
          <p className="text-gray-300 leading-relaxed">{evento.descripcion}</p>
        </div>
      )}

      {/* Cupos */}
      <div className="card mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-400">Jugadores inscritos</span>
          <span className={inscritos >= cupos ? 'text-red-400' : 'text-sp-green'}>{inscritos}/{cupos}</span>
        </div>
        <div className="w-full bg-sp-border rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${porcentaje >= 100 ? 'bg-red-500' : porcentaje >= 70 ? 'bg-sp-orange' : 'bg-sp-green'}`}
            style={{ width: `${porcentaje}%` }}
          />
        </div>
      </div>

      {/* Organizador */}
      <div className="card mb-6">
        <p className="text-gray-500 text-xs mb-3">Organizado por</p>
        <Link to={`/perfil/${evento.organizador_id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          {evento.organizador_foto ? (
            <img src={evento.organizador_foto} className="w-10 h-10 rounded-full object-cover" alt={evento.organizador_username} />
          ) : (
            <div className="w-10 h-10 rounded-full bg-sp-green/20 flex items-center justify-center text-sp-green font-bold">
              {evento.organizador_username?.[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-white font-medium">{evento.organizador_nombre || evento.organizador_username}</p>
            <p className="text-gray-400 text-sm">@{evento.organizador_username}</p>
          </div>
        </Link>
      </div>

      {/* Participantes */}
      {evento.participantes?.length > 0 && (
        <div className="card mb-6">
          <h2 className="font-semibold text-white mb-3">Participantes ({evento.participantes.length})</h2>
          <div className="flex flex-wrap gap-2">
            {evento.participantes.map(p => (
              <Link key={p.usuario_id} to={`/perfil/${p.usuario_id}`} title={p.username}>
                {p.foto_url ? (
                  <img src={p.foto_url} className="w-9 h-9 rounded-full object-cover border-2 border-sp-border hover:border-sp-green transition-colors" alt={p.username} />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-sp-green/20 flex items-center justify-center text-sp-green text-sm font-bold border-2 border-sp-border hover:border-sp-green transition-colors">
                    {p.username?.[0]?.toUpperCase()}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Accion */}
      {error && <p className="text-red-400 text-sm mb-3 text-center">{error}</p>}

      {!esOrganizador && evento.estado === 'abierto' && (
        <button
          onClick={handleInscripcion}
          disabled={accionando || (lleno && !inscripto)}
          className={`w-full py-3 rounded-xl font-semibold text-base transition-all ${inscripto ? 'bg-sp-border text-gray-300 hover:bg-red-500/20 hover:text-red-400' : lleno ? 'bg-sp-border text-gray-500 cursor-not-allowed' : 'btn-green'}`}
        >
          {accionando ? 'Procesando...' : inscripto ? 'Salir del evento' : lleno ? 'Evento lleno' : 'Unirse al evento'}
        </button>
      )}

      {esOrganizador && (
        <div className="text-center">
          <span className="text-sp-green text-sm font-medium">Eres el organizador de este evento</span>
        </div>
      )}
    </div>
  );
}
