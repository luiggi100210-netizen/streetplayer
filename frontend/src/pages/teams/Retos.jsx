import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ESTADO_COLOR = {
  pendiente:  '#fbbf24',
  aceptado:   '#1D9E75',
  rechazado:  '#f87171',
  finalizado: '#6b7280',
};

function Escudo({ url, nombre, size = 40 }) {
  if (url) return <img src={url} alt={nombre} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.1)' }} />;
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'rgba(29,158,117,0.2)', border: '2px solid rgba(29,158,117,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Anton,Impact,sans-serif', fontSize: size * 0.45, color: '#1D9E75' }}>
      {nombre?.[0]?.toUpperCase() ?? '?'}
    </div>
  );
}

function FormatoLabel({ reto }) {
  if (!reto.hora_propuesta && !reto.cancha && !reto.monto_apuesta) return null;
  const fecha = reto.hora_propuesta
    ? format(new Date(reto.hora_propuesta), "dd MMM, HH:mm", { locale: es })
    : null;
  const tipo = reto.formato_reto === 'goles'
    ? `${reto.valor_formato} goles` : `${reto.valor_formato} min`;
  return (
    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', display: 'flex', flexWrap: 'wrap', gap: '6px 12px' }}>
      {reto.cancha && <span>📍 {reto.cancha}</span>}
      {fecha && <span>🕐 {fecha}</span>}
      {reto.monto_apuesta > 0 && <span>💰 {tipo} → S/{reto.monto_apuesta}</span>}
    </div>
  );
}

// ── Modal lanzar reto ─────────────────────────────────────────
function ModalLanzarReto({ miEquipoId, onClose, onCreado }) {
  const [paso, setPaso] = useState(1); // 1=elegir equipo, 2=detalles
  const [equiposCercanos, setEquiposCercanos] = useState([]);
  const [equipoElegido, setEquipoElegido] = useState(null);
  const [cargandoEquipos, setCargandoEquipos] = useState(true);
  const [form, setForm] = useState({
    cancha: '', hora_propuesta: '', formato_reto: 'tiempo',
    valor_formato: 15, monto_apuesta: 0, moneda: 'PEN',
  });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const cargar = async () => {
      setCargandoEquipos(true);
      try {
        let lat, lng;
        if (navigator.geolocation) {
          await new Promise(res => navigator.geolocation.getCurrentPosition(
            p => { lat = p.coords.latitude; lng = p.coords.longitude; res(); },
            () => res(), { timeout: 4000 }
          ));
        }
        const params = lat ? `?lat=${lat}&lng=${lng}&radio=20` : '';
        const { data } = await api.get(`/retos/cercanos${params}`);
        setEquiposCercanos(data);
      } catch {}
      setCargandoEquipos(false);
    };
    cargar();
  }, []);

  const enviar = async () => {
    if (!equipoElegido) return;
    setEnviando(true); setError('');
    try {
      const payload = {
        equipo_retado_id: equipoElegido.id,
        cancha: form.cancha || undefined,
        hora_propuesta: form.hora_propuesta || undefined,
        formato_reto: form.formato_reto,
        valor_formato: parseInt(form.valor_formato),
        monto_apuesta: parseFloat(form.monto_apuesta) || 0,
        moneda: form.moneda,
      };
      const { data } = await api.post('/retos', payload);
      onCreado(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al enviar reto');
    }
    setEnviando(false);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, width: '100%', maxWidth: 480, maxHeight: '85vh', overflow: 'auto' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontFamily: 'Anton,Impact,sans-serif', fontSize: 18, color: '#fff', letterSpacing: '0.04em' }}>
            {paso === 1 ? 'ELEGIR RIVAL' : 'DETALLES DEL RETO'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>

        {/* Paso 1: Equipos cercanos */}
        {paso === 1 && (
          <div style={{ padding: 20 }}>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 14 }}>Equipos cercanos a tu ubicación</p>
            {cargandoEquipos ? (
              <div className="space-y-2">
                {[1,2,3].map(i => <div key={i} style={{ height: 60, borderRadius: 10, background: 'rgba(255,255,255,0.03)', animation: 'pulse 1.5s infinite' }} />)}
              </div>
            ) : equiposCercanos.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: '24px 0' }}>No se encontraron equipos cercanos</p>
            ) : (
              <div className="space-y-2">
                {equiposCercanos.map(eq => (
                  <button key={eq.id} onClick={() => setEquipoElegido(eq)} style={{
                    width: '100%', background: equipoElegido?.id === eq.id ? 'rgba(29,158,117,0.15)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${equipoElegido?.id === eq.id ? 'rgba(29,158,117,0.5)' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: 10, padding: '10px 14px', cursor: 'pointer', textAlign: 'left', transition: 'all .15s',
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                    <Escudo url={eq.escudo_url} nombre={eq.nombre} size={38} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily: 'Anton,Impact,sans-serif', fontSize: 14, color: '#fff', letterSpacing: '0.02em', marginBottom: 1 }}>{eq.nombre}</p>
                      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{eq.deporte} · {eq.total_miembros} jugadores · {eq.wins}V {eq.draws}E {eq.losses}D</p>
                    </div>
                    {eq.distancia_km != null && (
                      <span style={{ fontSize: 10, color: '#1D9E75', fontWeight: 700, flexShrink: 0 }}>{eq.distancia_km} km</span>
                    )}
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => equipoElegido && setPaso(2)}
              disabled={!equipoElegido}
              style={{
                marginTop: 16, width: '100%', padding: '11px', borderRadius: 10, border: 'none', cursor: equipoElegido ? 'pointer' : 'not-allowed',
                background: equipoElegido ? '#1D9E75' : 'rgba(255,255,255,0.05)', color: equipoElegido ? '#fff' : 'rgba(255,255,255,0.2)',
                fontFamily: 'Anton,Impact,sans-serif', fontSize: 14, letterSpacing: '0.1em', transition: 'all .15s',
              }}>
              {equipoElegido ? `CONTINUAR → ${equipoElegido.nombre}` : 'SELECCIONA UN EQUIPO'}
            </button>
          </div>
        )}

        {/* Paso 2: Detalles */}
        {paso === 2 && (
          <div style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, padding: '10px 14px', background: 'rgba(29,158,117,0.08)', border: '1px solid rgba(29,158,117,0.2)', borderRadius: 10 }}>
              <Escudo url={equipoElegido.escudo_url} nombre={equipoElegido.nombre} size={34} />
              <div>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Retando a</p>
                <p style={{ fontFamily: 'Anton,Impact,sans-serif', fontSize: 15, color: '#fff' }}>{equipoElegido.nombre}</p>
              </div>
              <button onClick={() => setPaso(1)} style={{ marginLeft: 'auto', background: 'none', border: 'none', fontSize: 10, color: '#1D9E75', cursor: 'pointer', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Cambiar</button>
            </div>

            <div className="space-y-4">
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>Cancha / Lugar</label>
                <input value={form.cancha} onChange={e => setForm(p => ({ ...p, cancha: e.target.value }))}
                  className="input w-full" placeholder="Ej: Cancha del parque norte, Jirón Manco Inca 340" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>Fecha y hora propuesta</label>
                <input type="datetime-local" value={form.hora_propuesta}
                  onChange={e => setForm(p => ({ ...p, hora_propuesta: e.target.value }))}
                  className="input w-full" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>Formato del reto</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[{ v: 'tiempo', label: 'Por tiempo (min)' }, { v: 'goles', label: 'Por goles' }].map(({ v, label }) => (
                    <button key={v} onClick={() => setForm(p => ({ ...p, formato_reto: v }))} style={{
                      flex: 1, padding: '8px', borderRadius: 8, border: `1px solid ${form.formato_reto === v ? '#1D9E75' : 'rgba(255,255,255,0.1)'}`,
                      background: form.formato_reto === v ? 'rgba(29,158,117,0.15)' : 'transparent',
                      color: form.formato_reto === v ? '#1D9E75' : 'rgba(255,255,255,0.35)', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    }}>{label}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>
                    {form.formato_reto === 'goles' ? 'Cantidad de goles' : 'Minutos de juego'}
                  </label>
                  <input type="number" min="1" max="200" value={form.valor_formato}
                    onChange={e => setForm(p => ({ ...p, valor_formato: e.target.value }))}
                    className="input w-full" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>Apuesta (S/)</label>
                  <input type="number" min="0" step="0.50" value={form.monto_apuesta}
                    onChange={e => setForm(p => ({ ...p, monto_apuesta: e.target.value }))}
                    className="input w-full" placeholder="0" />
                </div>
              </div>
            </div>

            {error && <p style={{ marginTop: 12, fontSize: 12, color: '#f87171', background: 'rgba(248,113,113,0.1)', padding: '8px 12px', borderRadius: 8 }}>{error}</p>}

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setPaso(1)} style={{ padding: '11px 20px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.4)', fontSize: 13, cursor: 'pointer' }}>← Volver</button>
              <button onClick={enviar} disabled={enviando} style={{
                flex: 1, padding: '11px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: '#1D9E75', color: '#fff',
                fontFamily: 'Anton,Impact,sans-serif', fontSize: 14, letterSpacing: '0.1em', opacity: enviando ? 0.6 : 1,
              }}>
                {enviando ? '...' : '⚔️ ENVIAR RETO'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Modal contraoferta ────────────────────────────────────────
function ModalContraoferta({ reto, onClose, onHecha }) {
  const [form, setForm] = useState({
    cancha: reto.cancha || '',
    hora_propuesta: reto.hora_propuesta ? reto.hora_propuesta.slice(0, 16) : '',
    monto_apuesta: reto.monto_apuesta || 0,
    valor_formato: reto.valor_formato || 15,
  });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  const enviar = async () => {
    setEnviando(true); setError('');
    try {
      const { data } = await api.put(`/retos/${reto.id}/contraoferta`, {
        cancha: form.cancha || undefined,
        hora_propuesta: form.hora_propuesta || undefined,
        monto_apuesta: parseFloat(form.monto_apuesta),
        valor_formato: parseInt(form.valor_formato),
      });
      onHecha(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al enviar contraoferta');
    }
    setEnviando(false);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#111', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 16, width: '100%', maxWidth: 420 }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontFamily: 'Anton,Impact,sans-serif', fontSize: 16, color: '#fbbf24' }}>CONTRAOFERTA</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ padding: 18 }}>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>
            Ronda {reto.rondas_contraoferta + 1}/3 — Modifica lo que no te convence
          </p>
          <div className="space-y-3">
            <div>
              <label className="label">Cancha / Lugar</label>
              <input value={form.cancha} onChange={e => setForm(p => ({ ...p, cancha: e.target.value }))} className="input w-full" />
            </div>
            <div>
              <label className="label">Fecha y hora</label>
              <input type="datetime-local" value={form.hora_propuesta}
                onChange={e => setForm(p => ({ ...p, hora_propuesta: e.target.value }))} className="input w-full" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label className="label">{reto.formato_reto === 'goles' ? 'Goles' : 'Minutos'}</label>
                <input type="number" min="1" value={form.valor_formato}
                  onChange={e => setForm(p => ({ ...p, valor_formato: e.target.value }))} className="input w-full" />
              </div>
              <div>
                <label className="label">Apuesta (S/)</label>
                <input type="number" min="0" step="0.50" value={form.monto_apuesta}
                  onChange={e => setForm(p => ({ ...p, monto_apuesta: e.target.value }))} className="input w-full" />
              </div>
            </div>
          </div>
          {error && <p style={{ marginTop: 10, fontSize: 12, color: '#f87171' }}>{error}</p>}
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button onClick={onClose} style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.4)', fontSize: 12, cursor: 'pointer' }}>Cancelar</button>
            <button onClick={enviar} disabled={enviando} style={{
              flex: 1, padding: '9px', borderRadius: 8, border: 'none', background: '#fbbf24', color: '#000',
              fontFamily: 'Anton,Impact,sans-serif', fontSize: 13, letterSpacing: '0.1em', cursor: 'pointer', opacity: enviando ? 0.6 : 1,
            }}>
              {enviando ? '...' : 'ENVIAR CONTRAOFERTA'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Modal chat entre capitanes ────────────────────────────────
function ModalChat({ reto, usuario, onClose }) {
  const [mensajes, setMensajes] = useState([]);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const bottomRef = useRef(null);

  const cargar = useCallback(async () => {
    try {
      const { data } = await api.get(`/retos/${reto.id}/chat`);
      setMensajes(data);
    } catch {}
  }, [reto.id]);

  useEffect(() => {
    cargar();
    const interval = setInterval(cargar, 4000);
    return () => clearInterval(interval);
  }, [cargar]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  const enviar = async e => {
    e.preventDefault();
    if (!texto.trim()) return;
    setEnviando(true);
    try {
      const { data } = await api.post(`/retos/${reto.id}/chat`, { contenido: texto });
      setMensajes(p => [...p, data]);
      setTexto('');
    } catch {}
    setEnviando(false);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#111', border: '1px solid rgba(29,158,117,0.3)', borderRadius: 16, width: '100%', maxWidth: 440, display: 'flex', flexDirection: 'column', maxHeight: '80vh' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <p style={{ fontFamily: 'Anton,Impact,sans-serif', fontSize: 14, color: '#fff' }}>CHAT DE CAPITANES</p>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{reto.retador_nombre} vs {reto.retado_nombre}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {mensajes.length === 0 && (
            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 12, marginTop: 20 }}>Ningún mensaje aún. ¡Coordinen los detalles!</p>
          )}
          {mensajes.map(m => {
            const esMio = m.usuario_id === usuario.id;
            return (
              <div key={m.id} style={{ display: 'flex', flexDirection: esMio ? 'row-reverse' : 'row', gap: 8, alignItems: 'flex-end' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#1D9E75' }}>
                  {m.foto_url ? <img src={m.foto_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : m.username?.[0]?.toUpperCase()}
                </div>
                <div style={{
                  maxWidth: '70%', padding: '8px 12px', borderRadius: esMio ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  background: esMio ? 'rgba(29,158,117,0.2)' : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${esMio ? 'rgba(29,158,117,0.3)' : 'rgba(255,255,255,0.08)'}`,
                }}>
                  <p style={{ fontSize: 13, color: '#fff', lineHeight: 1.4 }}>{m.contenido}</p>
                  <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>
                    {format(new Date(m.fecha), 'HH:mm', { locale: es })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={enviar} style={{ padding: 12, borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 8, flexShrink: 0 }}>
          <input value={texto} onChange={e => setTexto(e.target.value)}
            placeholder="Escribe algo..." className="input flex-1" style={{ fontSize: 13 }} />
          <button type="submit" disabled={enviando || !texto.trim()} style={{
            padding: '8px 16px', borderRadius: 8, border: 'none', background: '#1D9E75', color: '#fff',
            fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: (!texto.trim() || enviando) ? 0.4 : 1,
          }}>
            {enviando ? '...' : 'Enviar'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Tarjeta de reto ───────────────────────────────────────────
function RetoCard({ reto, miEquipoId, usuarioId, onActualizar }) {
  const [modalContra, setModalContra] = useState(false);
  const [modalChat, setModalChat] = useState(false);
  const [respondiendo, setRespondiendo] = useState(false);
  const { usuario } = useAuth();

  const esRecibido = reto.retado_id === miEquipoId;
  const esMiPropuesta = reto.propuesto_por === miEquipoId;
  const puedoResponder = reto.estado === 'pendiente' && !esMiPropuesta &&
    (reto.retador_id === miEquipoId || reto.retado_id === miEquipoId);
  const estaEnReto = reto.retador_id === miEquipoId || reto.retado_id === miEquipoId;
  const puedeChat = reto.estado === 'aceptado' && estaEnReto;
  const estadoColor = ESTADO_COLOR[reto.estado] || '#888';

  const responder = async (accion) => {
    setRespondiendo(true);
    try {
      const { data } = await api.put(`/retos/${reto.id}/responder`, { accion });
      onActualizar(data);
    } catch (err) {
      alert(err.response?.data?.error || 'Error');
    }
    setRespondiendo(false);
  };

  return (
    <>
      <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ height: 2, background: estadoColor }} />
        <div style={{ padding: '14px 16px' }}>
          {/* Equipos VS */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Escudo url={reto.retador_escudo} nombre={reto.retador_nombre} size={36} />
              <span style={{ fontFamily: 'Anton,Impact,sans-serif', fontSize: 13, color: '#fff', letterSpacing: '0.02em' }}>{reto.retador_nombre}</span>
            </div>
            <div style={{ textAlign: 'center', flexShrink: 0 }}>
              <div style={{ fontFamily: 'Anton,Impact,sans-serif', fontSize: 16, color: '#e5a000' }}>VS</div>
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
              <span style={{ fontFamily: 'Anton,Impact,sans-serif', fontSize: 13, color: '#fff', letterSpacing: '0.02em', textAlign: 'right' }}>{reto.retado_nombre}</span>
              <Escudo url={reto.retado_escudo} nombre={reto.retado_nombre} size={36} />
            </div>
          </div>

          {/* Detalles del reto */}
          <FormatoLabel reto={reto} />

          {/* Estado + contraoferta info */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '3px 8px', borderRadius: 4, color: estadoColor, background: estadoColor + '18', border: `1px solid ${estadoColor}44` }}>
              {reto.estado}
            </span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {reto.rondas_contraoferta > 0 && (
                <span style={{ fontSize: 9, color: '#fbbf24', fontWeight: 700 }}>Ronda {reto.rondas_contraoferta}/3</span>
              )}
              {esMiPropuesta && reto.estado === 'pendiente' && (
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>Esperando respuesta...</span>
              )}
              {puedeChat && (
                <button onClick={() => setModalChat(true)} style={{ background: 'rgba(29,158,117,0.12)', border: '1px solid rgba(29,158,117,0.3)', borderRadius: 6, padding: '4px 8px', color: '#1D9E75', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>
                  💬 Chat
                </button>
              )}
            </div>
          </div>

          {/* Acciones */}
          {puedoResponder && (
            <div style={{ display: 'flex', gap: 6, marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <button onClick={() => responder('rechazar')} disabled={respondiendo} style={{
                flex: 1, padding: '7px', borderRadius: 8, border: '1px solid rgba(248,113,113,0.3)',
                background: 'rgba(248,113,113,0.08)', color: '#f87171', fontSize: 11, fontWeight: 700, cursor: 'pointer',
              }}>
                ✕ Rechazar
              </button>
              {reto.rondas_contraoferta < 3 && (
                <button onClick={() => setModalContra(true)} disabled={respondiendo} style={{
                  flex: 1, padding: '7px', borderRadius: 8, border: '1px solid rgba(251,191,36,0.3)',
                  background: 'rgba(251,191,36,0.08)', color: '#fbbf24', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                }}>
                  🔄 Contraoferta
                </button>
              )}
              <button onClick={() => responder('aceptar')} disabled={respondiendo} style={{
                flex: 1, padding: '7px', borderRadius: 8, border: '1px solid rgba(29,158,117,0.4)',
                background: 'rgba(29,158,117,0.12)', color: '#1D9E75', fontSize: 11, fontWeight: 700, cursor: 'pointer',
              }}>
                ✓ Aceptar
              </button>
            </div>
          )}
        </div>
      </div>

      {modalContra && (
        <ModalContraoferta
          reto={reto}
          onClose={() => setModalContra(false)}
          onHecha={data => { onActualizar(data); setModalContra(false); }}
        />
      )}
      {modalChat && usuario && (
        <ModalChat reto={reto} usuario={usuario} onClose={() => setModalChat(false)} />
      )}
    </>
  );
}

// ── Página principal ──────────────────────────────────────────
export default function Retos() {
  const { usuario } = useAuth();
  const [retos,        setRetos]        = useState([]);
  const [miEquipoId,   setMiEquipoId]   = useState(null);
  const [unlock,       setUnlock]       = useState(null);
  const [tab,          setTab]          = useState('recibidos');
  const [cargando,     setCargando]     = useState(true);
  const [modalLanzar,  setModalLanzar]  = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const [retosRes, unlockRes] = await Promise.allSettled([
        api.get('/retos'),
        api.get('/equipos/puede-crear'),
      ]);
      if (retosRes.status === 'fulfilled') {
        setRetos(retosRes.value.data.retos || []);
        setMiEquipoId(retosRes.value.data.mi_equipo_id);
      }
      if (unlockRes.status === 'fulfilled') setUnlock(unlockRes.value.data);
    } catch {}
    setCargando(false);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const actualizarReto = (updated) => {
    setRetos(prev => prev.map(r => r.id === updated.id ? { ...r, ...updated } : r));
  };

  const recibidos = retos.filter(r => r.retado_id === miEquipoId);
  const enviados  = retos.filter(r => r.retador_id === miEquipoId);
  const lista     = tab === 'recibidos' ? recibidos : enviados;

  // Sin unlock (menos de 5 partidos)
  if (!cargando && unlock && !unlock.puede && !miEquipoId) {
    return (
      <div className="max-w-lg mx-auto px-4 py-10">
        <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>⚔️</div>
          <h2 style={{ fontFamily: 'Anton,Impact,sans-serif', fontSize: 22, color: '#fff', letterSpacing: '0.04em', marginBottom: 8 }}>DESBLOQUEA LOS RETOS</h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 20 }}>
            Necesitas jugar <strong style={{ color: '#fff' }}>5 partidos</strong> para poder crear tu equipo y retar a otros.
          </p>
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Partidos jugados</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{unlock.partidos_jugados} / {unlock.requerido}</span>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: '#1D9E75', borderRadius: 3, width: `${Math.min((unlock.partidos_jugados / unlock.requerido) * 100, 100)}%`, transition: 'width .4s' }} />
            </div>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 8 }}>
              Faltan {unlock.faltantes} partido{unlock.faltantes !== 1 ? 's' : ''}
            </p>
          </div>
          <a href="/eventos" className="btn-primary text-sm">Buscar eventos para jugar</a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontFamily: 'Anton,Impact,sans-serif', fontSize: 24, color: '#fff', letterSpacing: '0.04em' }}>RETOS</h1>
        {miEquipoId && (
          <button onClick={() => setModalLanzar(true)} style={{
            padding: '9px 18px', borderRadius: 9, border: 'none', background: '#1D9E75', color: '#fff',
            fontFamily: 'Anton,Impact,sans-serif', fontSize: 13, letterSpacing: '0.08em', cursor: 'pointer',
          }}>
            ⚔️ LANZAR RETO
          </button>
        )}
      </div>

      {!miEquipoId && unlock?.puede && (
        <div style={{ background: 'rgba(29,158,117,0.08)', border: '1px solid rgba(29,158,117,0.2)', borderRadius: 12, padding: '14px 18px' }}>
          <p style={{ fontSize: 13, color: '#1D9E75', fontWeight: 700, marginBottom: 4 }}>Ya puedes crear tu equipo</p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Tienes {unlock?.partidos_jugados} partidos jugados. Ve a <a href="/equipos" style={{ color: '#1D9E75', fontWeight: 700 }}>Equipos</a> para crear el tuyo.</p>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: '#111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 4 }}>
        {[
          { key: 'recibidos', label: `Recibidos (${recibidos.length})` },
          { key: 'enviados',  label: `Enviados (${enviados.length})`   },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)} style={{
            flex: 1, padding: '9px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, transition: 'all .2s',
            background: tab === key ? '#1D9E75' : 'transparent',
            color: tab === key ? '#fff' : 'rgba(255,255,255,0.4)',
          }}>{label}</button>
        ))}
      </div>

      {cargando ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} style={{ height: 110, borderRadius: 14, background: 'rgba(255,255,255,0.03)', animation: 'pulse 1.5s infinite' }} />)}
        </div>
      ) : !miEquipoId ? (
        <div style={{ textAlign: 'center', padding: '40px 24px', color: 'rgba(255,255,255,0.3)' }}>
          <p style={{ fontSize: 40, marginBottom: 10 }}>🛡️</p>
          <p style={{ fontWeight: 700, fontSize: 15 }}>No eres capitán de ningún equipo</p>
          <p style={{ fontSize: 12, marginTop: 6 }}>Crea o únete a un equipo para gestionar retos</p>
        </div>
      ) : lista.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 24px', color: 'rgba(255,255,255,0.3)' }}>
          <p style={{ fontSize: 40, marginBottom: 10 }}>{tab === 'recibidos' ? '📭' : '📤'}</p>
          <p style={{ fontWeight: 700, fontSize: 15 }}>{tab === 'recibidos' ? 'Sin retos recibidos' : 'No has enviado retos'}</p>
          {tab === 'enviados' && (
            <button onClick={() => setModalLanzar(true)} style={{
              marginTop: 14, padding: '9px 20px', borderRadius: 8, border: '1px solid rgba(29,158,117,0.4)',
              background: 'rgba(29,158,117,0.12)', color: '#1D9E75', fontSize: 12, fontWeight: 700, cursor: 'pointer',
            }}>⚔️ Lanzar primer reto</button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {lista.map(reto => (
            <RetoCard
              key={reto.id}
              reto={reto}
              miEquipoId={miEquipoId}
              usuarioId={usuario?.id}
              onActualizar={actualizarReto}
            />
          ))}
        </div>
      )}

      {modalLanzar && miEquipoId && (
        <ModalLanzarReto
          miEquipoId={miEquipoId}
          onClose={() => setModalLanzar(false)}
          onCreado={data => { setRetos(p => [data, ...p]); setTab('enviados'); }}
        />
      )}
    </div>
  );
}
