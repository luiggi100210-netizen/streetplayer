import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';

const ESTADO_BADGE = {
  pendiente:  { label: 'Pendiente',  cls: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  aceptado:   { label: 'Aceptado',   cls: 'bg-green-500/20  text-green-400  border-green-500/30'  },
  rechazado:  { label: 'Rechazado',  cls: 'bg-red-500/20    text-red-400    border-red-500/30'    },
  finalizado: { label: 'Finalizado', cls: 'bg-blue-500/20   text-blue-400   border-blue-500/30'   },
};

function EscudoTeam({ url, nombre }) {
  if (url) {
    return <img src={url} alt={nombre} className="w-10 h-10 rounded-full object-cover border border-[#2e2e3e]" />;
  }
  return (
    <div className="w-10 h-10 rounded-full bg-[#00e676]/20 border border-[#00e676]/30 flex items-center justify-center text-lg font-black text-[#00e676]">
      {nombre?.[0]?.toUpperCase() ?? '?'}
    </div>
  );
}

function EstadoBadge({ estado }) {
  const { label, cls } = ESTADO_BADGE[estado] ?? ESTADO_BADGE.pendiente;
  return (
    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${cls}`}>
      {label}
    </span>
  );
}

function RetoCard({ reto, miEquipoId, onResponder, respondiendo }) {
  const esRecibido = reto.retado_id === miEquipoId;
  const fecha      = new Date(reto.fecha).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-4 flex flex-col gap-3">
      {/* Equipos */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <EscudoTeam url={reto.retador_escudo} nombre={reto.retador_nombre} />
          <span className="text-white font-semibold text-sm truncate">{reto.retador_nombre}</span>
        </div>
        <span className="text-[#64748b] text-xs font-bold shrink-0">VS</span>
        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
          <span className="text-white font-semibold text-sm truncate text-right">{reto.retado_nombre}</span>
          <EscudoTeam url={reto.retado_escudo} nombre={reto.retado_nombre} />
        </div>
      </div>

      {/* Estado y fecha */}
      <div className="flex items-center justify-between">
        <EstadoBadge estado={reto.estado} />
        <span className="text-[#64748b] text-xs">{fecha}</span>
      </div>

      {/* Acciones — solo para retos recibidos pendientes */}
      {esRecibido && reto.estado === 'pendiente' && (
        <div className="flex gap-2 pt-1 border-t border-[#1e1e2e]">
          <button
            onClick={() => onResponder(reto.id, 'aceptar')}
            disabled={respondiendo === reto.id}
            className="flex-1 py-2 rounded-xl bg-[#00e676]/20 hover:bg-[#00e676]/30 text-[#00e676] text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {respondiendo === reto.id ? '...' : 'Aceptar'}
          </button>
          <button
            onClick={() => onResponder(reto.id, 'rechazar')}
            disabled={respondiendo === reto.id}
            className="flex-1 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {respondiendo === reto.id ? '...' : 'Rechazar'}
          </button>
        </div>
      )}
    </div>
  );
}

export default function Retos() {
  const [retos,       setRetos]       = useState([]);
  const [miEquipoId,  setMiEquipoId]  = useState(null);
  const [tab,         setTab]         = useState('recibidos');
  const [cargando,    setCargando]    = useState(true);
  const [error,       setError]       = useState('');
  const [respondiendo, setRespondiendo] = useState(''); // id del reto en proceso

  const cargar = useCallback(async () => {
    setCargando(true); setError('');
    try {
      const { data } = await api.get('/retos');
      setRetos(data.retos);
      setMiEquipoId(data.mi_equipo_id);
    } catch {
      setError('No se pudieron cargar los retos');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const handleResponder = async (retoId, accion) => {
    setRespondiendo(retoId);
    try {
      const { data: actualizado } = await api.put(`/retos/${retoId}/responder`, { accion });
      setRetos(prev => prev.map(r => r.id === retoId ? { ...r, estado: actualizado.estado } : r));
    } catch (err) {
      setError(err.response?.data?.error || 'Error al responder el reto');
    } finally {
      setRespondiendo('');
    }
  };

  const recibidos = retos.filter(r => r.retado_id   === miEquipoId);
  const enviados  = retos.filter(r => r.retador_id  === miEquipoId);
  const lista     = tab === 'recibidos' ? recibidos : enviados;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-black text-white">Retos</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#12121a] border border-[#1e1e2e] rounded-xl p-1">
        {[
          { key: 'recibidos', label: `Recibidos (${recibidos.length})` },
          { key: 'enviados',  label: `Enviados (${enviados.length})`   },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === key
                ? 'bg-[#00e676] text-[#0a0a0f]'
                : 'text-[#64748b] hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-900/20 border border-red-800/30 rounded-xl px-4 py-3">{error}</p>
      )}

      {cargando ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-28 bg-[#12121a] border border-[#1e1e2e] rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : !miEquipoId ? (
        <div className="text-center py-12 text-[#64748b]">
          <p className="text-4xl mb-3">🏆</p>
          <p className="font-semibold">No eres capitán de ningún equipo</p>
          <p className="text-sm mt-1">Crea o únete a un equipo para gestionar retos</p>
        </div>
      ) : lista.length === 0 ? (
        <div className="text-center py-12 text-[#64748b]">
          <p className="text-4xl mb-3">{tab === 'recibidos' ? '📭' : '📤'}</p>
          <p className="font-semibold">
            {tab === 'recibidos' ? 'Sin retos recibidos' : 'No has enviado retos'}
          </p>
          {tab === 'enviados' && (
            <p className="text-sm mt-1">Reta a otros equipos desde su página de equipo</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {lista.map(reto => (
            <RetoCard
              key={reto.id}
              reto={reto}
              miEquipoId={miEquipoId}
              onResponder={handleResponder}
              respondiendo={respondiendo}
            />
          ))}
        </div>
      )}
    </div>
  );
}
