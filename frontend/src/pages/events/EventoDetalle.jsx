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

function ModalConfirmarAsistencia({ equipo, onConfirmar, onCancelar, cargando }) {
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-sp-card border border-sp-border rounded-2xl w-full max-w-sm p-6 space-y-4">
        <h2 className="font-impact text-xl text-center">CONFIRMAR ASISTENCIA</h2>
        <div className="text-center space-y-3">
          <div className="text-5xl">{equipo === 'A' ? '🟢' : '🔵'}</div>
          <p className="text-white font-medium">
            Te unes al <span className={`font-bold ${equipo === 'A' ? 'text-sp-green' : 'text-blue-400'}`}>
              {equipo === 'A' ? 'Equipo A' : 'Equipo B'}
            </span>
          </p>
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-left">
            <p className="text-red-400 text-sm font-semibold mb-1">⚠️ Aviso importante</p>
            <p className="text-sp-muted text-xs leading-relaxed">
              Si confirmas y <span className="text-white font-medium">no asistes</span> el día del evento,
              recibirás una <span className="text-red-400 font-semibold">sanción</span> y
              perderás <span className="text-red-400 font-semibold">15 XP</span>.
            </p>
          </div>
        </div>
        <div className="flex gap-3 pt-1">
          <button onClick={onCancelar} disabled={cargando} className="btn-ghost flex-1">Cancelar</button>
          <button onClick={onConfirmar} disabled={cargando} className="btn-primary flex-1">
            {cargando ? '...' : '¡Voy a jugar!'}
          </button>
        </div>
      </div>
    </div>
  );
}

function SlotJugador({ jugador, equipo, clickable, onClickSlot, usuarioId }) {
  const esMio  = jugador?.id === usuarioId;
  const colorA = esMio && equipo === 'A';
  const colorB = esMio && equipo === 'B';
  const esB    = equipo === 'B';

  const avatar = jugador ? (
    jugador.foto_url ? (
      <img src={jugador.foto_url} className="w-8 h-8 rounded-full object-cover shrink-0 ring-2 ring-white/10" alt={jugador.username} />
    ) : (
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ring-2 ${
        colorA ? 'bg-sp-green/30 text-sp-green ring-sp-green/30' :
        colorB ? 'bg-blue-400/20 text-blue-400 ring-blue-400/30' :
        'bg-white/15 text-white ring-white/10'
      }`}>
        {jugador.username?.[0]?.toUpperCase()}
      </div>
    )
  ) : null;

  if (jugador) {
    return (
      <div className={`flex items-center gap-2 px-2 py-1.5 rounded-xl border ${
        esB ? 'flex-row-reverse' : ''
      } ${
        colorA ? 'border-sp-green/60 bg-sp-green/15' :
        colorB ? 'border-blue-400/60 bg-blue-400/10' :
        'border-white/5 bg-white/5'
      }`}>
        {avatar}
        <div className={`flex-1 min-w-0 ${esB ? 'text-right' : ''}`}>
          <p className={`text-xs font-semibold truncate ${colorA ? 'text-sp-green' : colorB ? 'text-blue-400' : 'text-white'}`}>
            {jugador.nombre || jugador.username}
          </p>
          {esMio && <p className="text-[9px] text-white/40 uppercase tracking-wider">Tú</p>}
        </div>
      </div>
    );
  }

  if (clickable) {
    const circulo = (
      <div className={`w-8 h-8 rounded-full border border-dashed flex items-center justify-center shrink-0 transition-colors ${
        esB
          ? 'border-blue-400/30 group-hover:border-blue-400/70 group-hover:bg-blue-400/10'
          : 'border-sp-green/30 group-hover:border-sp-green/70 group-hover:bg-sp-green/10'
      }`}>
        <span className={`text-lg leading-none font-light transition-colors ${esB ? 'text-blue-400/40 group-hover:text-blue-400' : 'text-sp-green/40 group-hover:text-sp-green'}`}>+</span>
      </div>
    );
    return (
      <button
        onClick={onClickSlot}
        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-xl border border-dashed transition-all group ${
          esB ? 'flex-row-reverse' : ''
        } ${
          esB
            ? 'border-blue-400/25 hover:border-blue-400/60 hover:bg-blue-400/8'
            : 'border-sp-green/25 hover:border-sp-green/60 hover:bg-sp-green/8'
        }`}
      >
        {circulo}
        <span className="text-xs text-white/30 group-hover:text-white/60 transition-colors">Unirme aquí</span>
      </button>
    );
  }

  return (
    <div className={`flex items-center gap-2 px-2 py-1.5 ${esB ? 'flex-row-reverse' : ''}`}>
      <div className="w-8 h-8 rounded-full border border-dashed border-white/8 shrink-0" />
      <span className="text-xs text-white/15">Libre</span>
    </div>
  );
}

function MiniCanchaSVG() {
  return (
    <svg viewBox="0 0 28 160" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Outer border */}
      <rect x="2" y="4" width="24" height="152" rx="2" stroke="rgba(255,255,255,0.12)" strokeWidth="1"/>
      {/* Center line */}
      <line x1="2" y1="80" x2="26" y2="80" stroke="rgba(255,255,255,0.12)" strokeWidth="1"/>
      {/* Center circle */}
      <circle cx="14" cy="80" r="11" stroke="rgba(255,255,255,0.10)" strokeWidth="1"/>
      {/* Center dot */}
      <circle cx="14" cy="80" r="1.5" fill="rgba(255,255,255,0.2)"/>
      {/* Penalty area top */}
      <rect x="6" y="4" width="16" height="22" rx="1" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
      {/* Goal top */}
      <rect x="10" y="4" width="8" height="6" rx="0.5" stroke="rgba(255,255,255,0.12)" strokeWidth="1"/>
      {/* Penalty area bottom */}
      <rect x="6" y="134" width="16" height="22" rx="1" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
      {/* Goal bottom */}
      <rect x="10" y="150" width="8" height="6" rx="0.5" stroke="rgba(255,255,255,0.12)" strokeWidth="1"/>
      {/* Penalty dots */}
      <circle cx="14" cy="30" r="1" fill="rgba(255,255,255,0.15)"/>
      <circle cx="14" cy="130" r="1" fill="rgba(255,255,255,0.15)"/>
    </svg>
  );
}

function CanchaSlots({ evento, usuario, onUnirse, onSalir, accionando }) {
  const [modalEquipo, setModalEquipo] = useState(null);
  const formato     = evento.formato || 5;
  const participantes = evento.participantes || [];
  const teamA       = participantes.filter(p => p.equipo === 'A');
  const teamB       = participantes.filter(p => p.equipo === 'B');
  const slotsA      = Array.from({ length: formato }, (_, i) => teamA[i] || null);
  const slotsB      = Array.from({ length: formato }, (_, i) => teamB[i] || null);

  const inscripto   = participantes.some(p => p.id === usuario?.id);
  const esCreador   = evento.creador_id === usuario?.id;
  const puedeUnirse = evento.estado === 'abierto' && !inscripto && !esCreador;
  const puedeSalir  = evento.estado === 'abierto' && inscripto && !esCreador;

  const inscritos   = parseInt(evento.cupos_ocupados) || 0;
  const total       = evento.cupos_total || 10;
  const pct         = Math.min((inscritos / total) * 100, 100);

  const confirmar = async () => { await onUnirse(modalEquipo); setModalEquipo(null); };

  return (
    <>
      {modalEquipo && (
        <ModalConfirmarAsistencia
          equipo={modalEquipo}
          onConfirmar={confirmar}
          onCancelar={() => setModalEquipo(null)}
          cargando={accionando}
        />
      )}

      <div className="overflow-hidden rounded-2xl border border-sp-border">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-4 py-3 bg-sp-card">
          <div className="flex items-center gap-2">
            <span className="text-base">⚽</span>
            <span className="text-white text-sm font-bold uppercase tracking-wide">
              {formato}v{formato}
            </span>
            <span className="text-sp-muted text-xs">· Cancha</span>
          </div>
          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
            inscritos >= total ? 'bg-red-500/20 text-red-400' : 'bg-sp-green/20 text-sp-green'
          }`}>
            {inscritos}/{total}
          </span>
        </div>

        {/* ── Progress ── */}
        <div className="h-0.5 bg-white/5">
          <div
            className="h-0.5 transition-all duration-500"
            style={{ width: `${pct}%`, background: inscritos >= total ? '#f87171' : pct >= 70 ? '#fbbf24' : '#1D9E75' }}
          />
        </div>

        {/* ── Pitch area ── */}
        <div
          className="flex relative"
          style={{
            background: 'linear-gradient(180deg, #071807 0%, #0c2310 40%, #0c2310 60%, #071807 100%)',
          }}
        >
          {/* Grass stripes */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{ backgroundImage: 'repeating-linear-gradient(90deg,transparent,transparent 24px,#fff 24px,#fff 25px)' }}
          />

          {/* ── Equipo A ── */}
          <div className="flex-1 p-3 space-y-2 z-10">
            <div className="flex items-center gap-1.5 justify-center mb-3">
              <div className="w-2.5 h-2.5 rounded-full bg-sp-green shadow-[0_0_6px_#1D9E75]" />
              <span className="text-[10px] text-sp-green uppercase font-bold tracking-widest">Equipo A</span>
            </div>
            {slotsA.map((j, i) => (
              <SlotJugador key={i} jugador={j} equipo="A" clickable={puedeUnirse && !j}
                onClickSlot={() => setModalEquipo('A')} usuarioId={usuario?.id} />
            ))}
          </div>

          {/* ── Mini Cancha (center) ── */}
          <div className="w-9 shrink-0 flex items-center justify-center py-4 z-10 relative">
            <div className="absolute inset-y-0 left-1/2 w-px bg-white/8 -translate-x-px" />
            <MiniCanchaSVG />
          </div>

          {/* ── Equipo B ── */}
          <div className="flex-1 p-3 space-y-2 z-10">
            <div className="flex items-center gap-1.5 justify-center flex-row-reverse mb-3">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-400 shadow-[0_0_6px_#60a5fa]" />
              <span className="text-[10px] text-blue-400 uppercase font-bold tracking-widest">Equipo B</span>
            </div>
            {slotsB.map((j, i) => (
              <SlotJugador key={i} jugador={j} equipo="B" clickable={puedeUnirse && !j}
                onClickSlot={() => setModalEquipo('B')} usuarioId={usuario?.id} />
            ))}
          </div>
        </div>

        {/* ── Footer actions ── */}
        {(puedeSalir || (inscritos >= total && !inscripto && !esCreador)) && (
          <div className="px-4 py-3 bg-sp-card border-t border-sp-border">
            {puedeSalir ? (
              <button
                onClick={onSalir}
                disabled={accionando}
                className="w-full py-2 rounded-xl border border-sp-border text-sp-muted hover:border-red-500/50 hover:text-red-400 transition-colors text-xs font-semibold uppercase tracking-wide"
              >
                {accionando ? '...' : 'Salir del evento'}
              </button>
            ) : (
              <p className="text-center text-xs text-sp-muted font-semibold uppercase tracking-wide">Evento lleno</p>
            )}
          </div>
        )}
      </div>
    </>
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

  const esCreador    = evento?.creador_id === usuario?.id;

  const handleUnirse = async (equipo) => {
    setAccionando(true);
    setError('');
    try {
      await api.post(`/eventos/${id}/unirse`, { equipo });
      await cargar();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al unirse');
    }
    setAccionando(false);
  };

  const handleSalir = async () => {
    setAccionando(true);
    setError('');
    try {
      await api.delete(`/eventos/${id}/salir`);
      await cargar();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al salir');
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

        {/* Cancha slots */}
        <CanchaSlots
          evento={evento}
          usuario={usuario}
          onUnirse={handleUnirse}
          onSalir={handleSalir}
          accionando={accionando}
        />

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
