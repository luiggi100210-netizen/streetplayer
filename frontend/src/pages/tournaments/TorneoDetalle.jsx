import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { formatFechaCorta as formatFecha } from '../../utils/date';

const ESTADO_CFG = {
  pendiente:  { color: '#888',    label: 'Pendiente de aprobación' },
  aprobado:   { color: '#60a5fa', label: 'Inscripciones abiertas' },
  activo:     { color: '#fbbf24', label: 'En curso' },
  finalizado: { color: '#1D9E75', label: 'Finalizado' },
  cancelado:  { color: '#f87171', label: 'Cancelado' },
};

const FORMATO_LABEL = { eliminacion: 'Eliminación directa', grupos: 'Fase de grupos', liga: 'Liga' };
const RESULTADO_COLOR = { pendiente: '#888', en_curso: '#fbbf24', finalizado: '#1D9E75' };

function SeccionPartidos({ partidos }) {
  if (!partidos?.length) return null;

  const rondas = partidos.reduce((acc, p) => {
    const r = p.ronda || 'Sin ronda';
    if (!acc[r]) acc[r] = [];
    acc[r].push(p);
    return acc;
  }, {});

  return (
    <div className="card space-y-4">
      <h2 className="font-impact text-base uppercase tracking-wide">Fixture</h2>
      {Object.entries(rondas).map(([ronda, ps]) => (
        <div key={ronda}>
          <p className="text-[10px] font-bold uppercase tracking-widest text-sp-muted mb-2">{ronda}</p>
          <div className="space-y-2">
            {ps.map(p => (
              <div key={p.id} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-sp-card border border-sp-border">
                <span className="flex-1 text-sm text-white font-semibold text-right truncate">{p.equipo_local_nombre}</span>
                <div className="shrink-0 text-center min-w-[56px]">
                  {p.estado === 'finalizado' ? (
                    <span className="font-impact text-lg" style={{ color: '#1D9E75' }}>
                      {p.goles_local} - {p.goles_visita}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: RESULTADO_COLOR[p.estado] || '#888' }}>
                      {p.estado === 'en_curso' ? 'EN VIVO' : 'VS'}
                    </span>
                  )}
                </div>
                <span className="flex-1 text-sm text-white font-semibold truncate">{p.equipo_visita_nombre}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SeccionEquipos({ equipos, torneo, miEquipoId, onInscribir, onDesinscribir, accion }) {
  if (!equipos?.length && torneo?.estado !== 'aprobado') return null;
  const equipoInscrito = miEquipoId ? equipos.find(e => e.id === miEquipoId) : null;
  const puedeInscribir = torneo?.estado === 'aprobado' && miEquipoId && !equipoInscrito;
  const puedeRetirar   = torneo?.estado === 'aprobado' && equipoInscrito;
  const inscritos      = parseInt(torneo?.equipos_inscritos || equipos.length);
  const max            = torneo?.max_equipos || 8;

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-impact text-base uppercase tracking-wide">
          Equipos ({inscritos}/{max})
        </h2>
        {puedeInscribir && (
          <button onClick={onInscribir} disabled={accion} className="btn-primary text-xs px-4">
            {accion ? '...' : 'Inscribir mi equipo'}
          </button>
        )}
        {puedeRetirar && (
          <button onClick={onDesinscribir} disabled={accion} className="btn-ghost text-xs px-4 text-red-400 border-red-400/30">
            {accion ? '...' : 'Retirar equipo'}
          </button>
        )}
      </div>

      {/* Barra de ocupación */}
      <div>
        <div className="h-1.5 bg-sp-border rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-sp-green"
            style={{ width: `${Math.min((inscritos / max) * 100, 100)}%`, transition: 'width .5s' }} />
        </div>
        <p className="text-[10px] text-sp-muted mt-1">{max - inscritos} cupos disponibles</p>
      </div>

      {equipos.length === 0 ? (
        <p className="text-sp-muted text-sm text-center py-4">Sé el primero en inscribir tu equipo.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {equipos.map(eq => (
            <Link key={eq.id} to={`/equipos/${eq.id}`}
              className="flex flex-col items-center gap-2 py-3 px-2 rounded-xl bg-sp-card border border-sp-border hover:border-sp-green transition-colors text-center">
              <div className="w-12 h-12 rounded-lg bg-sp-border flex items-center justify-center overflow-hidden">
                {eq.escudo_url
                  ? <img src={eq.escudo_url} alt="" className="w-full h-full object-cover" />
                  : <span className="text-2xl">🛡️</span>
                }
              </div>
              <p className="text-xs font-bold text-white truncate w-full">{eq.nombre}</p>
              <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                eq.estado_inscripcion === 'campeon'
                  ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/30'
                  : 'bg-sp-green/10 text-sp-green border border-sp-green/30'
              }`}>
                {eq.estado_inscripcion === 'campeon' ? 'Campeón' : 'Inscrito'}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TorneoDetalle() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const { usuario }  = useAuth();

  const [torneo,    setTorneo]    = useState(null);
  const [cargando,  setCargando]  = useState(true);
  const [miEquipoId, setMiEquipoId] = useState(null);
  const [accion,    setAccion]    = useState(false);
  const [error,     setError]     = useState('');

  const cargar = async () => {
    setCargando(true);
    try {
      const [torneoRes, retosRes] = await Promise.allSettled([
        api.get(`/torneos/${id}`),
        api.get('/retos'),
      ]);
      if (torneoRes.status === 'fulfilled') setTorneo(torneoRes.value.data);
      else navigate('/torneos');

      if (retosRes.status === 'fulfilled') {
        const { mi_equipo_id } = retosRes.value.data;
        setMiEquipoId(mi_equipo_id || null);
      }
    } catch { navigate('/torneos'); }
    setCargando(false);
  };

  useEffect(() => { cargar(); }, [id]);

  const inscribir = async () => {
    if (!miEquipoId) return;
    setAccion(true);
    setError('');
    try {
      await api.post(`/torneos/${id}/inscribir`, { equipo_id: miEquipoId });
      await cargar();
    } catch (e) {
      setError(e.response?.data?.error || 'Error al inscribir');
    }
    setAccion(false);
  };

  const desinscribir = async () => {
    if (!miEquipoId) return;
    setAccion(true);
    setError('');
    try {
      await api.delete(`/torneos/${id}/inscribir`, { data: { equipo_id: miEquipoId } });
      await cargar();
    } catch (e) {
      setError(e.response?.data?.error || 'Error al retirar');
    }
    setAccion(false);
  };

  if (cargando) return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-4 animate-pulse">
      <div className="h-48 bg-sp-card rounded-2xl" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 h-64 bg-sp-card rounded-xl" />
        <div className="h-64 bg-sp-card rounded-xl" />
      </div>
    </div>
  );

  if (!torneo) return null;

  const cfg        = ESTADO_CFG[torneo.estado] || ESTADO_CFG.pendiente;
  const inscritos  = parseInt(torneo.equipos_inscritos || torneo.equipos?.length || 0);
  const pct        = Math.min((inscritos / (torneo.max_equipos || 8)) * 100, 100);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-sp-muted">
        <Link to="/torneos" className="hover:text-white transition-colors">Torneos</Link>
        <span>/</span>
        <span className="text-white">{torneo.nombre}</span>
      </div>

      {/* Header */}
      <div className="rounded-2xl overflow-hidden border border-sp-border"
        style={{ background: 'linear-gradient(145deg, #111 0%, #161616 60%, #0f0f0f 100%)' }}>
        <div style={{ height: 4, background: 'linear-gradient(to right, #fbbf24, #d97706)' }} />

        {torneo.foto_url && (
          <img src={torneo.foto_url} alt={torneo.nombre}
            style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }} />
        )}

        <div className="p-5 sm:p-6">
          {/* Badges estado + formato */}
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
              style={{ color: cfg.color, background: cfg.color + '18', border: `1px solid ${cfg.color}44` }}>
              {cfg.label}
            </span>
            {torneo.formato && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/40">
                {FORMATO_LABEL[torneo.formato] || torneo.formato}
              </span>
            )}
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/40 capitalize">
              {torneo.deporte}
            </span>
          </div>

          <h1 className="font-impact text-3xl sm:text-4xl text-white tracking-wide mb-1">{torneo.nombre}</h1>

          {torneo.descripcion && (
            <p className="text-white/60 text-sm leading-relaxed mt-2 mb-4">{torneo.descripcion}</p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            {torneo.ciudad && (
              <div>
                <p className="text-[9px] text-sp-muted uppercase tracking-wider mb-0.5">Ciudad</p>
                <p className="text-sm text-white font-semibold">{torneo.ciudad}</p>
              </div>
            )}
            {torneo.fecha_inicio && (
              <div>
                <p className="text-[9px] text-sp-muted uppercase tracking-wider mb-0.5">Inicio</p>
                <p className="text-sm text-white font-semibold">{formatFecha(torneo.fecha_inicio)}</p>
              </div>
            )}
            {torneo.fecha_fin && (
              <div>
                <p className="text-[9px] text-sp-muted uppercase tracking-wider mb-0.5">Fin</p>
                <p className="text-sm text-white font-semibold">{formatFecha(torneo.fecha_fin)}</p>
              </div>
            )}
            <div>
              <p className="text-[9px] text-sp-muted uppercase tracking-wider mb-0.5">Equipos</p>
              <p className="text-sm text-white font-semibold">{inscritos}/{torneo.max_equipos || 8}</p>
            </div>
          </div>

          {/* Premio */}
          {torneo.premio && (
            <div className="flex items-center gap-2 mt-4 px-3 py-2 rounded-lg bg-yellow-400/8 border border-yellow-400/20">
              <span>🏆</span>
              <span className="text-yellow-400 text-sm font-bold">{torneo.premio}</span>
            </div>
          )}

          {/* Precio inscripción */}
          {torneo.precio_inscripcion > 0 && (
            <p className="mt-3 text-sm text-sp-muted">
              Precio de inscripción: <span className="font-impact text-yellow-400">S/ {torneo.precio_inscripcion}</span>
            </p>
          )}

          {/* Barra ocupación */}
          <div className="mt-4">
            <div className="h-1.5 bg-sp-border rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{
                width: `${pct}%`,
                background: pct >= 100 ? '#f87171' : 'linear-gradient(to right, #fbbf24, #d97706)',
              }} />
            </div>
          </div>

          {/* Organizador */}
          {torneo.organizador_username && (
            <Link to={`/perfil/${torneo.organizador_id}`}
              className="flex items-center gap-2 mt-4 text-sp-muted hover:text-white transition-colors">
              {torneo.organizador_foto
                ? <img src={torneo.organizador_foto} alt="" className="w-6 h-6 rounded-full object-cover border border-sp-border" />
                : <div className="w-6 h-6 rounded-full bg-sp-green flex items-center justify-center text-[10px] font-bold text-white">
                    {torneo.organizador_username?.[0]?.toUpperCase()}
                  </div>
              }
              <span className="text-xs">Organizado por <span className="font-semibold text-white">@{torneo.organizador_username}</span></span>
            </Link>
          )}
        </div>
      </div>

      {/* Error de inscripción */}
      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-900/20 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Grid: fixture + equipos */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-5 items-start">
        <div className="md:col-span-3">
          <SeccionPartidos partidos={torneo.partidos} />
          {!torneo.partidos?.length && (
            <div className="card text-center py-8">
              <p className="text-sp-muted text-sm">El fixture se publicará cuando inicie el torneo.</p>
            </div>
          )}
        </div>
        <div className="md:col-span-2">
          <SeccionEquipos
            equipos={torneo.equipos || []}
            torneo={torneo}
            miEquipoId={miEquipoId}
            onInscribir={inscribir}
            onDesinscribir={desinscribir}
            accion={accion}
          />
        </div>
      </div>

    </div>
  );
}
