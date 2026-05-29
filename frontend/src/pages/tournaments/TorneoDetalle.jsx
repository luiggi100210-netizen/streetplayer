import { useState, useEffect, useCallback } from 'react';
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

// ─── PartidoCard ─────────────────────────────────────────────────────────────

function PartidoCard({ partido, esOrg, onRegistrar }) {
  const [editando, setEditando] = useState(false);
  const [gl, setGl] = useState('');
  const [gv, setGv] = useState('');
  const [loading, setLoading] = useState(false);

  const guardar = async () => {
    if (gl === '' || gv === '') return;
    setLoading(true);
    try { await onRegistrar(partido.id, parseInt(gl), parseInt(gv)); setEditando(false); }
    finally { setLoading(false); }
  };

  const hora = partido.fecha ? new Date(partido.fecha).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }) : '';
  const fechaStr = partido.fecha ? formatFecha(partido.fecha) : '';

  return (
    <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '12px 14px',
      borderLeft: partido.estado === 'finalizado' ? '3px solid #1D9E75' : partido.estado === 'en_curso' ? '3px solid #fbbf24' : '3px solid rgba(255,255,255,0.08)' }}>
      {fechaStr && <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 8, textAlign: 'center' }}>{fechaStr}{hora ? ' · ' + hora : ''}</p>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
          {partido.equipo_local_escudo
            ? <img src={partido.equipo_local_escudo} alt="" style={{ width: 26, height: 26, borderRadius: 5, objectFit: 'cover', flexShrink: 0 }} />
            : <div style={{ width: 26, height: 26, borderRadius: 5, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>🛡️</div>
          }
          <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{partido.equipo_local_nombre}</span>
        </div>
        <div style={{ minWidth: 54, textAlign: 'center', flexShrink: 0 }}>
          {partido.estado === 'finalizado'
            ? <span style={{ fontFamily: 'Impact,sans-serif', fontSize: 20, color: '#1D9E75', letterSpacing: 2 }}>{partido.goles_local} - {partido.goles_visita}</span>
            : partido.estado === 'en_curso'
            ? <span style={{ fontSize: 10, fontWeight: 700, color: '#fbbf24' }}>EN VIVO</span>
            : <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.25)' }}>VS</span>
          }
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', textAlign: 'right' }}>{partido.equipo_visita_nombre}</span>
          {partido.equipo_visita_escudo
            ? <img src={partido.equipo_visita_escudo} alt="" style={{ width: 26, height: 26, borderRadius: 5, objectFit: 'cover', flexShrink: 0 }} />
            : <div style={{ width: 26, height: 26, borderRadius: 5, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>🛡️</div>
          }
        </div>
      </div>
      {esOrg && partido.estado !== 'finalizado' && (
        <div style={{ marginTop: 10 }}>
          {!editando
            ? <button onClick={() => setEditando(true)} style={{ width: '100%', padding: '6px', fontSize: 11, fontWeight: 600, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', color: '#fbbf24', borderRadius: 6, cursor: 'pointer' }}>Registrar resultado</button>
            : <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input type="number" min="0" value={gl} onChange={e => setGl(e.target.value)} placeholder="0" style={{ flex: 1, padding: '6px 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.15)', background: '#0a0a0a', color: '#fff', fontSize: 15, textAlign: 'center' }} />
                <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>-</span>
                <input type="number" min="0" value={gv} onChange={e => setGv(e.target.value)} placeholder="0" style={{ flex: 1, padding: '6px 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.15)', background: '#0a0a0a', color: '#fff', fontSize: 15, textAlign: 'center' }} />
                <button onClick={guardar} disabled={loading} style={{ padding: '6px 12px', borderRadius: 6, background: '#1D9E75', border: 'none', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>{loading ? '...' : 'OK'}</button>
                <button onClick={() => setEditando(false)} style={{ padding: '6px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', fontSize: 12, cursor: 'pointer' }}>✕</button>
              </div>
          }
        </div>
      )}
    </div>
  );
}

// ─── Panel organizador ────────────────────────────────────────────────────────

function PanelOrganizador({ torneo, onUpdate }) {
  const [tab, setTab] = useState('postulantes');
  const [accion, setAccion] = useState(null);
  const [premios, setPremios] = useState(
    [1, 2, 3].map(p => ({ puesto: p, descripcion: (torneo.premios || []).find(x => x.puesto === p)?.descripcion || '' }))
  );
  const [saving, setSaving] = useState(false);
  const [iniciando, setIniciando] = useState(false);
  const [err, setErr] = useState('');

  const postulantes = (torneo.equipos || []).filter(e => e.estado_inscripcion === 'postulante');
  const confirmados = (torneo.equipos || []).filter(e => e.estado_inscripcion === 'confirmado');

  const gestionar = async (equipoId, acc) => {
    setAccion(equipoId + acc); setErr('');
    try { await api.put(`/torneos/${torneo.id}/equipos/${equipoId}/${acc}`); await onUpdate(); }
    catch (e) { setErr(e.response?.data?.error || 'Error'); }
    setAccion(null);
  };

  const guardarPremios = async () => {
    setSaving(true); setErr('');
    try { await api.put(`/torneos/${torneo.id}/premios`, { premios: premios.filter(p => p.descripcion) }); await onUpdate(); }
    catch (e) { setErr(e.response?.data?.error || 'Error'); }
    setSaving(false);
  };

  const iniciar = async () => {
    if (!window.confirm('¿Iniciar el torneo? Se generará el fixture automáticamente con los equipos confirmados.')) return;
    setIniciando(true); setErr('');
    try {
      const res = await api.put(`/torneos/${torneo.id}/iniciar`);
      alert(res.data.mensaje + ' (' + res.data.partidos_generados + ' partidos)');
      await onUpdate();
    } catch (e) { setErr(e.response?.data?.error || 'Error al iniciar'); }
    setIniciando(false);
  };

  return (
    <div style={{ background: 'rgba(251,191,36,0.04)', border: '1px solid rgba(251,191,36,0.18)', borderRadius: 14, padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
        <span style={{ fontFamily: 'Impact,sans-serif', fontSize: 15, color: '#fbbf24', letterSpacing: 1 }}>⚙️ PANEL ORGANIZADOR</span>
        {torneo.estado === 'aprobado' && (
          confirmados.length >= 2
            ? <button onClick={iniciar} disabled={iniciando} style={{ padding: '8px 18px', borderRadius: 8, background: '#1D9E75', border: 'none', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', opacity: iniciando ? 0.6 : 1 }}>
                {iniciando ? 'Iniciando...' : '🚀 Iniciar Torneo'}
              </button>
            : <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Necesitas ≥2 equipos confirmados</span>
        )}
      </div>

      {err && <p style={{ color: '#f87171', fontSize: 12, marginBottom: 10 }}>{err}</p>}

      <div style={{ display: 'flex', gap: 4, marginBottom: 14, borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: 8 }}>
        {[['postulantes', 'Postulantes (' + postulantes.length + ')'], ['confirmados', 'Confirmados (' + confirmados.length + ')'], ['premios', 'Premios']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} style={{ padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: tab === k ? 'rgba(251,191,36,0.12)' : 'transparent', color: tab === k ? '#fbbf24' : 'rgba(255,255,255,0.35)' }}>{l}</button>
        ))}
      </div>

      {tab === 'postulantes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {postulantes.length === 0
            ? <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, textAlign: 'center', padding: '14px 0' }}>Sin postulantes aún</p>
            : postulantes.map(eq => (
              <div key={eq.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#111', borderRadius: 8, padding: '10px 12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, overflow: 'hidden', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {eq.escudo_url ? <img src={eq.escudo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 18 }}>🛡️</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ color: '#fff', fontWeight: 700, fontSize: 13, margin: 0 }}>{eq.nombre}</p>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, margin: 0 }}>{eq.ciudad || ''}</p>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => gestionar(eq.id, 'aceptar')} disabled={accion === eq.id + 'aceptar'} style={{ padding: '6px 12px', borderRadius: 6, background: '#1D9E75', border: 'none', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>{accion === eq.id + 'aceptar' ? '...' : '✅ Aceptar'}</button>
                  <button onClick={() => gestionar(eq.id, 'rechazar')} disabled={accion === eq.id + 'rechazar'} style={{ padding: '6px 12px', borderRadius: 6, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', color: '#f87171', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>{accion === eq.id + 'rechazar' ? '...' : '❌ Rechazar'}</button>
                </div>
              </div>
            ))
          }
        </div>
      )}

      {tab === 'confirmados' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {confirmados.length === 0
            ? <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, textAlign: 'center', padding: '14px 0' }}>Sin equipos confirmados</p>
            : confirmados.map(eq => (
              <div key={eq.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#111', borderRadius: 8, padding: '10px 12px', border: '1px solid rgba(29,158,117,0.18)' }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, overflow: 'hidden', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {eq.escudo_url ? <img src={eq.escudo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 18 }}>🛡️</span>}
                </div>
                <span style={{ flex: 1, color: '#fff', fontWeight: 700, fontSize: 13 }}>{eq.nombre}</span>
                <span style={{ fontSize: 10, color: '#1D9E75', fontWeight: 700 }}>✅ CONFIRMADO</span>
              </div>
            ))
          }
        </div>
      )}

      {tab === 'premios' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {premios.map(p => (
            <div key={p.puesto} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>{['🥇','🥈','🥉'][p.puesto - 1]}</span>
              <input type="text" value={p.descripcion} placeholder={p.puesto + 'er lugar — describe el premio...'}
                onChange={e => setPremios(prev => prev.map(x => x.puesto === p.puesto ? { ...x, descripcion: e.target.value } : x))}
                style={{ flex: 1, padding: '8px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.12)', background: '#0a0a0a', color: '#fff', fontSize: 13 }}
              />
            </div>
          ))}
          <button onClick={guardarPremios} disabled={saving} style={{ marginTop: 6, padding: '9px', borderRadius: 8, background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', color: '#fbbf24', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            {saving ? 'Guardando...' : 'Guardar premios'}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Fixture ──────────────────────────────────────────────────────────────────

function SeccionFixture({ partidos, esOrg, torneo_id, onUpdate }) {
  const [err, setErr] = useState('');

  const handleRegistrar = async (partidoId, gl, gv) => {
    setErr('');
    try { await api.put(`/torneos/${torneo_id}/partidos/${partidoId}/resultado`, { goles_local: gl, goles_visita: gv }); await onUpdate(); }
    catch (e) { setErr(e.response?.data?.error || 'Error'); throw e; }
  };

  if (!partidos?.length) return (
    <div className="card text-center py-8">
      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>El fixture se publicará cuando inicie el torneo.</p>
    </div>
  );

  const rondas = partidos.reduce((acc, p) => {
    const r = p.ronda || 'Ronda';
    if (!acc[r]) acc[r] = [];
    acc[r].push(p);
    return acc;
  }, {});

  return (
    <div className="card space-y-5">
      <h2 className="font-impact text-base uppercase tracking-wide">Fixture</h2>
      {err && <p style={{ color: '#f87171', fontSize: 12 }}>{err}</p>}
      {Object.entries(rondas).map(([ronda, ps]) => (
        <div key={ronda}>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>{ronda}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ps.map(p => <PartidoCard key={p.id} partido={p} esOrg={esOrg} onRegistrar={handleRegistrar} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Equipos ──────────────────────────────────────────────────────────────────

function SeccionEquipos({ equipos, torneo, miEquipoId, onPostular, onRetirar, accion }) {
  const max = torneo?.max_equipos || 8;
  const confirmados = (equipos || []).filter(e => ['confirmado','campeon'].includes(e.estado_inscripcion));
  const pct = Math.min((confirmados.length / max) * 100, 100);
  const miEquipo = miEquipoId ? (equipos || []).find(e => e.id === miEquipoId) : null;
  const miEstado = miEquipo?.estado_inscripcion;
  const puedePostular = torneo?.estado === 'aprobado' && miEquipoId && !miEstado;
  const puedeRetirar = miEstado && torneo?.estado === 'aprobado';

  return (
    <div className="card space-y-4">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 className="font-impact text-base uppercase tracking-wide">Equipos ({confirmados.length}/{max})</h2>
        <div style={{ display: 'flex', gap: 6 }}>
          {puedePostular && <button onClick={onPostular} disabled={accion} className="btn-primary text-xs px-4">{accion ? '...' : 'Postular'}</button>}
          {puedeRetirar && <button onClick={onRetirar} disabled={accion} style={{ padding: '5px 12px', borderRadius: 6, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', color: '#f87171', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{accion ? '...' : 'Retirar'}</button>}
        </div>
      </div>

      {miEstado && (
        <div style={{ padding: '7px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
          background: miEstado === 'rechazado' ? 'rgba(248,113,113,0.08)' : miEstado === 'confirmado' ? 'rgba(29,158,117,0.08)' : 'rgba(96,165,250,0.08)',
          border: `1px solid ${miEstado === 'rechazado' ? 'rgba(248,113,113,0.2)' : miEstado === 'confirmado' ? 'rgba(29,158,117,0.2)' : 'rgba(96,165,250,0.2)'}`,
          color: miEstado === 'rechazado' ? '#f87171' : miEstado === 'confirmado' ? '#1D9E75' : '#60a5fa',
        }}>
          {miEstado === 'rechazado' ? '❌' : miEstado === 'confirmado' ? '✅' : miEstado === 'campeon' ? '🥇' : '⏳'} Tu equipo: {miEstado}
        </div>
      )}

      <div>
        <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 99, width: pct + '%', transition: 'width .5s', background: pct >= 100 ? '#f87171' : 'linear-gradient(to right,#fbbf24,#d97706)' }} />
        </div>
        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>{max - confirmados.length} cupos disponibles</p>
      </div>

      {confirmados.length === 0
        ? <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, textAlign: 'center', padding: '12px 0' }}>Sé el primero en postular tu equipo.</p>
        : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(100px,1fr))', gap: 10 }}>
            {confirmados.map(eq => (
              <Link key={eq.id} to={`/equipos/${eq.id}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, padding: '12px 8px', borderRadius: 10, background: '#111', border: eq.estado_inscripcion === 'campeon' ? '1px solid rgba(251,191,36,0.4)' : '1px solid rgba(255,255,255,0.06)', textDecoration: 'none', textAlign: 'center' }}>
                <div style={{ width: 40, height: 40, borderRadius: 7, overflow: 'hidden', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {eq.escudo_url ? <img src={eq.escudo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 20 }}>🛡️</span>}
                </div>
                <p style={{ color: '#fff', fontSize: 11, fontWeight: 700, margin: 0 }}>{eq.nombre}</p>
                {eq.estado_inscripcion === 'campeon' && <span style={{ fontSize: 10, color: '#fbbf24', fontWeight: 700 }}>🥇 CAMPEÓN</span>}
              </Link>
            ))}
          </div>
      }
    </div>
  );
}

// ─── Premios ──────────────────────────────────────────────────────────────────

function SeccionPremios({ premios }) {
  if (!premios?.length) return null;
  return (
    <div className="card space-y-3">
      <h2 className="font-impact text-base uppercase tracking-wide">Premios</h2>
      {premios.map(p => (
        <div key={p.puesto} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <span style={{ fontSize: 22 }}>{['🥇','🥈','🥉'][p.puesto - 1] || '🏅'}</span>
          <div>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', margin: 0 }}>{p.puesto}er lugar</p>
            <p style={{ fontSize: 14, color: '#fbbf24', fontWeight: 700, margin: 0 }}>{p.descripcion}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function TorneoDetalle() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const { usuario } = useAuth();

  const [torneo,     setTorneo]     = useState(null);
  const [cargando,   setCargando]   = useState(true);
  const [miEquipoId, setMiEquipoId] = useState(null);
  const [accion,     setAccion]     = useState(false);
  const [error,      setError]      = useState('');

  const cargar = useCallback(async () => {
    try {
      const [torneoRes, retosRes] = await Promise.allSettled([api.get(`/torneos/${id}`), api.get('/retos')]);
      if (torneoRes.status === 'fulfilled') setTorneo(torneoRes.value.data);
      else navigate('/torneos');
      if (retosRes.status === 'fulfilled') setMiEquipoId(retosRes.value.data.mi_equipo_id || null);
    } catch { navigate('/torneos'); }
    setCargando(false);
  }, [id]);

  useEffect(() => { cargar(); }, [cargar]);

  const postular = async () => {
    if (!miEquipoId) return;
    setAccion(true); setError('');
    try { await api.post(`/torneos/${id}/postular`, { equipo_id: miEquipoId }); await cargar(); }
    catch (e) { setError(e.response?.data?.error || 'Error al postular'); }
    setAccion(false);
  };

  const retirar = async () => {
    if (!miEquipoId) return;
    setAccion(true); setError('');
    try { await api.delete(`/torneos/${id}/inscribir`, { data: { equipo_id: miEquipoId } }); await cargar(); }
    catch (e) { setError(e.response?.data?.error || 'Error al retirar'); }
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

  const cfg = ESTADO_CFG[torneo.estado] || ESTADO_CFG.pendiente;
  const inscritos = parseInt(torneo.equipos_inscritos || 0);
  const pct = Math.min((inscritos / (torneo.max_equipos || 8)) * 100, 100);
  const esOrg = usuario?.id === torneo.organizador_id;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">

      {/* Back + breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={() => navigate(-1)} style={{ padding: '5px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>←</button>
        <Link to="/torneos" style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none', fontSize: 12 }}>Torneos</Link>
        <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 12 }}>/</span>
        <span style={{ color: '#fff', fontSize: 12 }}>{torneo.nombre}</span>
      </div>

      {/* Header */}
      <div className="rounded-2xl overflow-hidden border border-sp-border"
        style={{ background: 'linear-gradient(145deg, #111 0%, #161616 60%, #0f0f0f 100%)' }}>
        <div style={{ height: 4, background: 'linear-gradient(to right, #fbbf24, #d97706)' }} />
        {torneo.foto_url && <img src={torneo.foto_url} alt={torneo.nombre} style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }} />}
        <div style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', padding: '3px 10px', borderRadius: 4, color: cfg.color, background: cfg.color + '18', border: '1px solid ' + cfg.color + '44' }}>{cfg.label}</span>
            {torneo.formato && <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', padding: '3px 10px', borderRadius: 4, color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>{FORMATO_LABEL[torneo.formato] || torneo.formato}</span>}
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', padding: '3px 10px', borderRadius: 4, color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>{torneo.deporte}</span>
          </div>

          <h1 style={{ fontFamily: 'Impact,sans-serif', fontSize: 34, color: '#fff', letterSpacing: 1, margin: '0 0 6px' }}>{torneo.nombre}</h1>
          {torneo.descripcion && <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.5, margin: '0 0 14px' }}>{torneo.descripcion}</p>}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(90px,1fr))', gap: 10, marginBottom: 12 }}>
            {torneo.ciudad && <div><p style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', margin: '0 0 2px' }}>Ciudad</p><p style={{ fontSize: 13, color: '#fff', fontWeight: 600, margin: 0 }}>{torneo.ciudad}</p></div>}
            {torneo.fecha_inicio && <div><p style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', margin: '0 0 2px' }}>Inicio</p><p style={{ fontSize: 13, color: '#fff', fontWeight: 600, margin: 0 }}>{formatFecha(torneo.fecha_inicio)}</p></div>}
            {torneo.fecha_fin && <div><p style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', margin: '0 0 2px' }}>Fin</p><p style={{ fontSize: 13, color: '#fff', fontWeight: 600, margin: 0 }}>{formatFecha(torneo.fecha_fin)}</p></div>}
            <div><p style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', margin: '0 0 2px' }}>Equipos</p><p style={{ fontSize: 13, color: '#fff', fontWeight: 600, margin: 0 }}>{inscritos}/{torneo.max_equipos || 8}</p></div>
          </div>

          {torneo.premio && <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderRadius: 8, background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)', marginBottom: 10 }}><span>🏆</span><span style={{ color: '#fbbf24', fontWeight: 700, fontSize: 13 }}>{torneo.premio}</span></div>}
          {torneo.precio_inscripcion > 0 && <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: '0 0 10px' }}>Inscripción: <span style={{ color: '#fbbf24', fontFamily: 'Impact,sans-serif' }}>S/ {torneo.precio_inscripcion}</span></p>}

          <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden', marginBottom: 12 }}>
            <div style={{ height: '100%', borderRadius: 99, width: pct + '%', transition: 'width .5s', background: pct >= 100 ? '#f87171' : 'linear-gradient(to right,#fbbf24,#d97706)' }} />
          </div>

          {torneo.organizador_username && (
            <Link to={`/perfil/${torneo.organizador_id}`} style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: 'rgba(255,255,255,0.35)' }}>
              {torneo.organizador_foto
                ? <img src={torneo.organizador_foto} alt="" style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover' }} />
                : <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#1D9E75', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff' }}>{torneo.organizador_username?.[0]?.toUpperCase()}</div>
              }
              <span style={{ fontSize: 12 }}>Organizado por <strong style={{ color: '#fff' }}>@{torneo.organizador_username}</strong></span>
            </Link>
          )}
        </div>
      </div>

      {error && <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', color: '#f87171', fontSize: 13 }}>{error}</div>}

      {/* Panel organizador */}
      {esOrg && ['aprobado','activo'].includes(torneo.estado) && (
        <PanelOrganizador torneo={torneo} onUpdate={cargar} />
      )}

      {/* Grid principal */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 280px', gap: 16, alignItems: 'start' }}>
        <SeccionFixture partidos={torneo.partidos} esOrg={esOrg} torneo_id={id} onUpdate={cargar} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <SeccionEquipos equipos={torneo.equipos || []} torneo={torneo} miEquipoId={miEquipoId} onPostular={postular} onRetirar={retirar} accion={accion} />
          <SeccionPremios premios={torneo.premios} />
        </div>
      </div>

    </div>
  );
}
