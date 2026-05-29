import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import MapaPicker from '../../components/MapaPicker';

const TIPO_COLOR = { pichanga: '#1D9E75', reto: '#f87171', campeonato: '#fbbf24' };
const TIPO_LABEL = { pichanga: 'Pichanga', reto: 'Reto', campeonato: 'Campeonato' };
const DEPORTE_EMOJI = { futbol: '⚽', basquet: '🏀', tenis: '🎾', padel: '🏓', voley: '🏐', running: '🏃', ciclismo: '🚴', otro: '🏅' };

function ModalFinalizar({ evento, onClose, onFinalizado }) {
  const [asistentes, setAsistentes] = useState(
    evento.participantes.map(p => p.id)
  );
  const [golesA, setGolesA] = useState(0);
  const [golesB, setGolesB] = useState(0);
  const [guardando, setGuardando] = useState(false);
  const [error, setError]         = useState('');

  const toggleAsistente = (uid) =>
    setAsistentes(prev => prev.includes(uid) ? prev.filter(x => x !== uid) : [...prev, uid]);

  const handleSubmit = async () => {
    setGuardando(true);
    setError('');
    try {
      await api.post(`/eventos/${evento.id}/finalizar`, {
        goles_a: golesA, goles_b: golesB, asistentes,
      });
      onFinalizado();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al finalizar');
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-sp-card border border-sp-border rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-sp-border flex items-center justify-between">
          <h2 className="font-impact text-lg">FINALIZAR PARTIDO</h2>
          <button onClick={onClose} className="text-sp-muted hover:text-white text-xl leading-none">×</button>
        </div>

        <div className="p-5 space-y-5">
          {/* Marcador */}
          <div>
            <p className="label mb-3">Resultado final</p>
            <div className="flex items-center gap-4 justify-center">
              <div className="text-center">
                <p className="text-xs text-sp-muted mb-1">Equipo A</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setGolesA(g => Math.max(0, g - 1))} className="w-8 h-8 rounded-lg bg-sp-border hover:bg-sp-green/20 text-white font-bold">−</button>
                  <span className="font-impact text-4xl text-sp-green w-10 text-center">{golesA}</span>
                  <button onClick={() => setGolesA(g => g + 1)} className="w-8 h-8 rounded-lg bg-sp-border hover:bg-sp-green/20 text-white font-bold">+</button>
                </div>
              </div>
              <span className="font-impact text-2xl text-sp-muted">VS</span>
              <div className="text-center">
                <p className="text-xs text-sp-muted mb-1">Equipo B</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setGolesB(g => Math.max(0, g - 1))} className="w-8 h-8 rounded-lg bg-sp-border hover:bg-sp-green/20 text-white font-bold">−</button>
                  <span className="font-impact text-4xl text-sp-green w-10 text-center">{golesB}</span>
                  <button onClick={() => setGolesB(g => g + 1)} className="w-8 h-8 rounded-lg bg-sp-border hover:bg-sp-green/20 text-white font-bold">+</button>
                </div>
              </div>
            </div>
          </div>

          {/* Asistentes */}
          <div>
            <p className="label mb-2">¿Quién asistió? ({asistentes.length}/{evento.participantes.length})</p>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {evento.participantes.map(p => (
                <label key={p.id} className="flex items-center gap-3 cursor-pointer py-1.5 px-2 rounded-lg hover:bg-white/5">
                  <input
                    type="checkbox"
                    checked={asistentes.includes(p.id)}
                    onChange={() => toggleAsistente(p.id)}
                    className="w-4 h-4 accent-sp-green"
                  />
                  {p.foto_url ? (
                    <img src={p.foto_url} className="w-7 h-7 rounded-full object-cover" alt={p.username} />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-sp-green/20 flex items-center justify-center text-sp-green text-xs font-bold">
                      {p.username?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm text-white">{p.nombre || p.username}</span>
                  <span className="text-xs text-sp-muted ml-auto">Eq. {p.equipo}</span>
                </label>
              ))}
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button onClick={handleSubmit} disabled={guardando} className="btn-primary w-full">
            {guardando ? 'GUARDANDO...' : 'CONFIRMAR RESULTADO'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EventoDetalle() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [evento, setEvento]             = useState(null);
  const [cargando, setCargando]         = useState(true);
  const [accionando, setAccionando]     = useState(false);
  const [error, setError]               = useState('');
  const [modalFinal, setModalFinal]     = useState(false);
  const [finalizado, setFinalizado]     = useState(false);

  const cargar = async () => {
    try {
      const { data } = await api.get(`/eventos/${id}`);
      setEvento(data);
    } catch {
      navigate('/eventos');
    }
    setCargando(false);
  };

  useEffect(() => { cargar(); }, [id]);

  const inscripto    = evento?.yo_inscrito || evento?.participantes?.some(p => p.id === usuario?.id);
  const esCreador    = evento?.creador_id === usuario?.id;
  const lleno        = parseInt(evento?.cupos_ocupados) >= (evento?.cupos_total || 10);
  const puedeUnirse  = evento?.estado === 'abierto' && !inscripto && !esCreador && !lleno;
  const puedeSalir   = evento?.estado === 'abierto' && inscripto && !esCreador;

  const handleInscripcion = async () => {
    setAccionando(true);
    setError('');
    try {
      if (inscripto) {
        await api.delete(`/eventos/${id}/salir`);
      } else {
        await api.post(`/eventos/${id}/unirse`, {});
      }
      await cargar();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al procesar');
    }
    setAccionando(false);
  };

  const onFinalizado = () => {
    setModalFinal(false);
    setFinalizado(true);
    cargar();
  };

  if (cargando) return (
    <div className="max-w-3xl mx-auto px-4 py-6 animate-pulse space-y-4">
      <div className="h-48 bg-sp-card rounded-2xl" />
      <div className="h-8 bg-sp-card rounded w-1/2" />
      <div className="h-32 bg-sp-card rounded-xl" />
    </div>
  );

  if (!evento) return null;

  const inscritos  = parseInt(evento.cupos_ocupados) || 0;
  const total      = evento.cupos_total || 10;
  const porcentaje = Math.min((inscritos / total) * 100, 100);
  const fechaEvento = evento.fecha_evento ? new Date(evento.fecha_evento) : null;
  const tipoColor  = TIPO_COLOR[evento.tipo] ?? '#888';

  return (
    <>
      {modalFinal && (
        <ModalFinalizar evento={evento} onClose={() => setModalFinal(false)} onFinalizado={onFinalizado} />
      )}

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">

        {/* Banner */}
        {evento.foto_url ? (
          <img src={evento.foto_url} alt={evento.titulo} className="w-full h-52 object-cover rounded-2xl" />
        ) : (
          <div className="w-full h-40 rounded-2xl bg-sp-card border border-sp-border flex items-center justify-center text-6xl">
            {DEPORTE_EMOJI[evento.deporte] ?? '🏅'}
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="badge text-xs font-bold px-2 py-0.5 rounded-full border" style={{ color: tipoColor, borderColor: tipoColor + '55', background: tipoColor + '15' }}>
                {TIPO_LABEL[evento.tipo] ?? evento.tipo}
              </span>
              {evento.formato && (
                <span className="badge-white text-xs">{evento.formato}v{evento.formato}</span>
              )}
              <span className="badge-green text-xs capitalize">{evento.deporte}</span>
            </div>
            <h1 className="font-impact text-2xl leading-tight">{evento.titulo}</h1>
          </div>
          {evento.precio > 0 && (
            <div className="text-right shrink-0">
              <p className="font-impact text-2xl text-sp-green">S/ {evento.precio}</p>
              <p className="text-sp-muted text-xs">por persona</p>
            </div>
          )}
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card">
            <p className="text-sp-muted text-xs mb-1">Fecha y hora</p>
            {fechaEvento ? (
              <>
                <p className="text-white font-medium text-sm capitalize">
                  {format(fechaEvento, "EEEE d 'de' MMMM", { locale: es })}
                </p>
                <p className="text-sp-muted text-xs">{format(fechaEvento, 'HH:mm')} hs</p>
              </>
            ) : <p className="text-sp-muted text-sm">Sin fecha</p>}
          </div>
          <div className="card">
            <p className="text-sp-muted text-xs mb-1">Lugar</p>
            <p className="text-white font-medium text-sm truncate">{evento.nombre_cancha || 'Sin cancha definida'}</p>
            {evento.direccion && <p className="text-sp-muted text-xs truncate">{evento.direccion}</p>}
          </div>
        </div>

        {/* Mapa + acciones de ubicación */}
        {(evento.latitud || evento.direccion || evento.nombre_cancha) && (() => {
          const tieneCoords = evento.latitud && evento.longitud;
          const mapsUrl = tieneCoords
            ? `https://www.google.com/maps/dir/?api=1&destination=${evento.latitud},${evento.longitud}`
            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${evento.nombre_cancha || ''} ${evento.direccion || ''}`.trim())}`;
          const waTexto = encodeURIComponent(
            `⚽ ¡Te invito al evento "${evento.titulo}" en StreetPlayer!\n📍 ${evento.nombre_cancha || evento.direccion || ''}\n🔗 ${window.location.href}`
          );
          return (
            <div className="card space-y-3">
              <p className="text-sp-muted text-xs uppercase tracking-wider">Cancha</p>

              {tieneCoords ? (
                <MapaPicker
                  value={{ lat: parseFloat(evento.latitud), lng: parseFloat(evento.longitud) }}
                  readOnly
                  height="200px"
                />
              ) : (
                <p className="text-sm text-white">
                  {evento.nombre_cancha && <span className="font-medium">{evento.nombre_cancha}</span>}
                  {evento.direccion && <span className="text-sp-muted"> — {evento.direccion}</span>}
                </p>
              )}

              <div className="flex gap-2">
                <a href={mapsUrl} target="_blank" rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border border-sp-border hover:border-sp-green text-sm font-semibold text-white transition-colors">
                  <svg className="w-4 h-4 text-sp-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Cómo llegar
                </a>
                <a href={`https://wa.me/?text=${waTexto}`} target="_blank" rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border border-[#25D366]/40 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-sm font-semibold text-[#25D366] transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Compartir por WhatsApp
                </a>
              </div>
            </div>
          );
        })()}

        {/* Descripción */}
        {evento.descripcion && (
          <div className="card">
            <p className="text-sp-muted text-xs uppercase tracking-wider mb-2">Descripción</p>
            <p className="text-white/80 text-sm leading-relaxed">{evento.descripcion}</p>
          </div>
        )}

        {/* Cupos */}
        <div className="card">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-sp-muted">Jugadores inscritos</span>
            <span className={inscritos >= total ? 'text-red-400 font-bold' : 'text-sp-green font-bold'}>{inscritos}/{total}</span>
          </div>
          <div className="w-full bg-sp-border rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full transition-all"
              style={{ width: `${porcentaje}%`, background: porcentaje >= 100 ? '#f87171' : porcentaje >= 70 ? '#fbbf24' : '#1D9E75' }}
            />
          </div>
        </div>

        {/* Organizador */}
        <div className="card">
          <p className="text-sp-muted text-xs uppercase tracking-wider mb-3">Organizado por</p>
          <Link to={`/perfil/${evento.creador_id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            {evento.creador_foto ? (
              <img src={evento.creador_foto} className="w-10 h-10 rounded-full object-cover" alt={evento.creador_username} />
            ) : (
              <div className="w-10 h-10 rounded-full bg-sp-green/20 flex items-center justify-center text-sp-green font-bold">
                {evento.creador_username?.[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-white font-medium text-sm">{evento.creador_nombre || evento.creador_username}</p>
              <p className="text-sp-muted text-xs">@{evento.creador_username}</p>
            </div>
          </Link>
        </div>

        {/* Participantes */}
        {evento.participantes?.length > 0 && (
          <div className="card">
            <p className="text-sp-muted text-xs uppercase tracking-wider mb-3">
              Participantes ({evento.participantes.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {evento.participantes.map(p => (
                <Link key={p.id} to={`/perfil/${p.id}`} title={`${p.nombre || p.username} — Eq. ${p.equipo}`}>
                  {p.foto_url ? (
                    <img src={p.foto_url} className="w-9 h-9 rounded-full object-cover border-2 border-sp-border hover:border-sp-green transition-colors" alt={p.username} />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-sp-green/20 border-2 border-sp-border hover:border-sp-green transition-colors flex items-center justify-center text-sp-green text-xs font-bold">
                      {p.username?.[0]?.toUpperCase()}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Código de invitación + WhatsApp */}
        {(evento.codigo_invitacion || evento.link_whatsapp) && (
          <div className="card space-y-3">
            {evento.codigo_invitacion && (
              <div>
                <p className="text-sp-muted text-xs uppercase tracking-wider mb-1">Código de invitación</p>
                <div className="flex items-center gap-2">
                  <code className="font-mono text-sp-green text-lg font-bold tracking-widest">{evento.codigo_invitacion}</code>
                  <button
                    onClick={() => navigator.clipboard.writeText(evento.codigo_invitacion)}
                    className="text-xs text-sp-muted hover:text-white border border-sp-border rounded-lg px-2 py-1"
                  >
                    Copiar
                  </button>
                </div>
              </div>
            )}
            {evento.link_whatsapp && (
              <a
                href={evento.link_whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 justify-center w-full py-2.5 rounded-xl border border-green-500/40 bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors text-sm font-semibold"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.557 4.126 1.532 5.863L0 24l6.335-1.54A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.028-1.385l-.36-.214-3.762.914.947-3.659-.234-.376A9.818 9.818 0 1112 21.818z"/>
                </svg>
                Compartir por WhatsApp
              </a>
            )}
          </div>
        )}

        {/* Acciones */}
        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

        {finalizado && (
          <div className="card border-sp-green/30 text-center">
            <p className="text-sp-green font-bold text-sm">Partido finalizado. Se activaron las calificaciones para los participantes.</p>
          </div>
        )}

        {/* Botón unirse/salir */}
        {(puedeUnirse || puedeSalir) && (
          <button
            onClick={handleInscripcion}
            disabled={accionando}
            className={`w-full py-3 rounded-xl font-bold text-sm transition-all uppercase tracking-wide ${
              puedeSalir
                ? 'border border-sp-border text-sp-muted hover:border-red-500/50 hover:text-red-400'
                : 'btn-primary'
            }`}
          >
            {accionando ? '...' : puedeSalir ? 'Salir del evento' : 'Unirse al evento'}
          </button>
        )}

        {lleno && !inscripto && !esCreador && (
          <div className="w-full py-3 rounded-xl text-center text-sp-muted text-sm border border-sp-border">
            Evento lleno
          </div>
        )}

        {/* Panel organizador */}
        {esCreador && (
          <div className="card border-sp-green/20 space-y-3">
            <p className="text-xs text-sp-muted uppercase tracking-wider font-bold">Panel del organizador</p>
            <p className="text-xs text-sp-green">Eres el creador de este evento</p>
            {evento.estado !== 'finalizado' && !finalizado && (
              <button
                onClick={() => setModalFinal(true)}
                className="btn-primary w-full"
              >
                REGISTRAR RESULTADO Y FINALIZAR
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
