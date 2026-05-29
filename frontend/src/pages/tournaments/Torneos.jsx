import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { formatFechaCorta as formatFecha } from '../../utils/date';

const DEPORTES = ['futbol', 'basquet', 'tenis', 'padel', 'voley', 'running'];
const DEPORTES_EMOJI = { futbol: '⚽', basquet: '🏀', tenis: '🎾', padel: '🏸', voley: '🏐', running: '🏃' };

const ESTADO_CFG = {
  pendiente: { color: '#888',    label: 'Pendiente' },
  aprobado:  { color: '#60a5fa', label: 'Inscripciones' },
  activo:    { color: '#fbbf24', label: 'En curso' },
  finalizado:{ color: '#1D9E75', label: 'Finalizado' },
  cancelado: { color: '#f87171', label: 'Cancelado' },
};

const FORMATO_LABEL = { eliminacion: 'Eliminación', grupos: 'Grupos', liga: 'Liga' };

function TarjetaTorneo({ torneo }) {
  const navigate = useNavigate();
  const inscritos = parseInt(torneo.equipos_inscritos) || 0;
  const max       = torneo.max_equipos || 8;
  const pct       = Math.min((inscritos / max) * 100, 100);
  const cfg       = ESTADO_CFG[torneo.estado] || ESTADO_CFG.pendiente;
  const emoji     = DEPORTES_EMOJI[torneo.deporte] || '🏆';

  return (
    <div
      onClick={() => navigate(`/torneos/${torneo.id}`)}
      style={{
        background: '#111', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 12, overflow: 'hidden', cursor: 'pointer',
        transition: 'transform .15s, border-color .2s, box-shadow .2s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.borderColor = 'rgba(251,191,36,0.4)';
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(251,191,36,0.12)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Accent bar dorado para torneos */}
      <div style={{ height: 3, background: 'linear-gradient(to right, #fbbf24, #d97706)' }} />

      {/* Banner */}
      {torneo.banner_url || torneo.foto_url ? (
        <img src={torneo.banner_url || torneo.foto_url} alt={torneo.nombre}
          style={{ width: '100%', height: 130, objectFit: 'cover', display: 'block' }} />
      ) : (
        <div style={{
          height: 130, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(135deg, rgba(251,191,36,0.1) 0%, rgba(10,10,10,0) 70%)',
          fontSize: 52,
        }}>{emoji}</div>
      )}

      <div style={{ padding: '14px 16px 16px' }}>
        {/* Badges */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em',
            padding: '3px 8px', borderRadius: 4,
            color: cfg.color, background: cfg.color + '18', border: `1px solid ${cfg.color}44`,
          }}>{cfg.label}</span>
          {torneo.formato && (
            <span style={{
              fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em',
              padding: '3px 8px', borderRadius: 4, color: 'rgba(255,255,255,0.4)',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            }}>{FORMATO_LABEL[torneo.formato] || torneo.formato}</span>
          )}
          <span style={{
            fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em',
            padding: '3px 8px', borderRadius: 4, color: 'rgba(255,255,255,0.35)',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          }}>{emoji} {torneo.deporte}</span>
        </div>

        {/* Nombre */}
        <h3 style={{
          fontFamily: 'Anton, Impact, sans-serif', fontSize: 18, color: '#fff',
          letterSpacing: '0.02em', marginBottom: 8, lineHeight: 1.15,
        }}>{torneo.nombre}</h3>

        {/* Ciudad + fechas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 12 }}>
          {torneo.ciudad && (
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', display: 'flex', alignItems: 'center', gap: 5 }}>
              <svg width={10} height={10} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {torneo.ciudad}
            </span>
          )}
          {torneo.fecha_inicio && (
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'rgba(255,255,255,0.38)' }}>
              {formatFecha(torneo.fecha_inicio)}{torneo.fecha_fin ? ` → ${formatFecha(torneo.fecha_fin)}` : ''}
            </span>
          )}
        </div>

        {/* Premio */}
        {torneo.premio && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12,
            padding: '6px 10px', borderRadius: 6,
            background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)',
          }}>
            <span style={{ fontSize: 14 }}>🏆</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#fbbf24' }}>{torneo.premio}</span>
          </div>
        )}

        {/* Equipos barra */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
            {inscritos}/{max} equipos
          </span>
          {torneo.precio_inscripcion > 0 && (
            <span style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 13, color: '#fbbf24' }}>
              S/ {torneo.precio_inscripcion}
            </span>
          )}
        </div>
        <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 2,
            width: `${pct}%`,
            background: pct >= 100 ? '#f87171' : 'linear-gradient(to right, #fbbf24, #d97706)',
          }} />
        </div>
      </div>
    </div>
  );
}

// ── Formulario proponer torneo ───────────────────────────────
function FormularioTorneo({ onCerrar, onCreado }) {
  const [form, setForm] = useState({
    nombre: '', descripcion: '', deporte: 'futbol', ciudad: '',
    fecha_inicio: '', fecha_fin: '', max_equipos: 8,
    premio: '', precio_inscripcion: 0, formato: 'eliminacion',
  });
  const [cargando, setCargando] = useState(false);
  const [error,    setError]    = useState('');
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.nombre || !form.deporte || !form.fecha_inicio) {
      setError('Nombre, deporte y fecha de inicio son requeridos');
      return;
    }
    setCargando(true);
    setError('');
    try {
      await api.post('/torneos', form);
      onCreado();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear torneo');
    }
    setCargando(false);
  };

  return (
    <div style={{
      background: '#111', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 12, padding: 24, marginBottom: 20,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 20, color: '#fff', letterSpacing: '0.04em' }}>PROPONER TORNEO</h2>
        <button onClick={onCerrar} style={{ color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>✕</button>
      </div>
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 20 }}>
        Tu propuesta será revisada por el equipo antes de publicarse.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Nombre *</label><input value={form.nombre} onChange={e => set('nombre', e.target.value)} className="input" placeholder="Copa Verano 2026" /></div>
          <div>
            <label className="label">Deporte *</label>
            <select value={form.deporte} onChange={e => set('deporte', e.target.value)} className="input">
              {DEPORTES.map(d => <option key={d} value={d} className="capitalize">{d}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Ciudad</label><input value={form.ciudad} onChange={e => set('ciudad', e.target.value)} className="input" /></div>
          <div>
            <label className="label">Formato</label>
            <select value={form.formato} onChange={e => set('formato', e.target.value)} className="input">
              <option value="eliminacion">Eliminación directa</option>
              <option value="grupos">Fase de grupos</option>
              <option value="liga">Liga</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Inicio *</label><input type="date" value={form.fecha_inicio} onChange={e => set('fecha_inicio', e.target.value)} className="input" /></div>
          <div><label className="label">Fin</label><input type="date" value={form.fecha_fin} onChange={e => set('fecha_fin', e.target.value)} className="input" /></div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div><label className="label">Máx equipos</label><input type="number" min={4} value={form.max_equipos} onChange={e => set('max_equipos', parseInt(e.target.value) || 4)} className="input" /></div>
          <div><label className="label">Inscripción (S/)</label><input type="number" min={0} value={form.precio_inscripcion} onChange={e => set('precio_inscripcion', parseFloat(e.target.value) || 0)} className="input" /></div>
          <div><label className="label">Premio</label><input value={form.premio} onChange={e => set('premio', e.target.value)} className="input" placeholder="Copa + medallas" /></div>
        </div>
        {error && <p style={{ color: '#f87171', fontSize: 13 }}>{error}</p>}
        <div className="flex gap-3">
          <button type="button" onClick={onCerrar} className="btn-ghost flex-1 text-sm">Cancelar</button>
          <button type="submit" disabled={cargando} className="btn-primary flex-1 text-sm">
            {cargando ? 'Enviando...' : 'Enviar propuesta'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Página principal ─────────────────────────────────────────
export default function Torneos() {
  const [torneos,  setTorneos]  = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtros,  setFiltros]  = useState({ deporte: '', ciudad: '', estado: 'aprobado' }); // 'aprobado' = inscripciones abiertas
  const [formulario, setFormulario] = useState(false);

  const cargar = async () => {
    setCargando(true);
    try {
      const p = new URLSearchParams();
      if (filtros.deporte) p.set('deporte', filtros.deporte);
      if (filtros.ciudad)  p.set('ciudad',  filtros.ciudad);
      if (filtros.estado)  p.set('estado',  filtros.estado);
      const { data } = await api.get(`/torneos?${p}`);
      setTorneos(data);
    } catch {}
    setCargando(false);
  };

  useEffect(() => { cargar(); }, [filtros]);
  const setF = (k, v) => setFiltros(p => ({ ...p, [k]: v }));

  const ESTADOS = [
    { val: 'aprobado',   label: 'Inscripciones', color: '#60a5fa' },
    { val: 'activo',     label: 'En curso',      color: '#fbbf24' },
    { val: 'finalizado', label: 'Finalizados',   color: '#1D9E75' },
    { val: '',           label: 'Todos',         color: 'rgba(255,255,255,0.4)' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">

      {/* ── HEADER ── */}
      <div style={{
        background: 'linear-gradient(135deg, #111 0%, #1a1a1a 60%, #0f0f0f 100%)',
        border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden',
      }}>
        <div style={{ height: 4, background: 'linear-gradient(to right, #fbbf24, #d97706, #92400e)' }} />
        <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.18em', color: '#fbbf24', textTransform: 'uppercase' }}>
                🏆 Competencias oficiales
              </span>
            </div>
            <h1 style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 'clamp(24px, 4vw, 40px)', color: '#fff', letterSpacing: '0.04em', lineHeight: 1 }}>
              TORNEOS
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 4 }}>Competencias organizadas por la comunidad</p>
          </div>
          <button onClick={() => setFormulario(p => !p)}
            style={{
              fontFamily: 'Anton, Impact, sans-serif', fontSize: 13, letterSpacing: '0.1em',
              padding: '10px 20px', borderRadius: 8, border: '1.5px solid rgba(251,191,36,0.4)',
              background: 'rgba(251,191,36,0.1)', color: '#fbbf24', cursor: 'pointer',
              transition: 'all .2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(251,191,36,0.18)'; e.currentTarget.style.borderColor = '#fbbf24'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(251,191,36,0.1)'; e.currentTarget.style.borderColor = 'rgba(251,191,36,0.4)'; }}
          >+ PROPONER TORNEO</button>
        </div>

        {/* Filtros */}
        <div style={{ padding: '0 24px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          {ESTADOS.map(({ val, label, color }) => (
            <button key={val || 'todos'} onClick={() => setF('estado', val)}
              style={{
                fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
                padding: '6px 14px', borderRadius: 999, cursor: 'pointer', transition: 'all .2s',
                border: `1px solid ${filtros.estado === val ? color : 'rgba(255,255,255,0.08)'}`,
                background: filtros.estado === val ? color + '22' : 'transparent',
                color: filtros.estado === val ? color : 'rgba(255,255,255,0.38)',
              }}>{label}</button>
          ))}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            <select value={filtros.deporte} onChange={e => setF('deporte', e.target.value)} className="input text-sm" style={{ width: 130 }}>
              <option value="">Todos</option>
              {DEPORTES.map(d => <option key={d} value={d} className="capitalize">{d}</option>)}
            </select>
            <input value={filtros.ciudad} onChange={e => setF('ciudad', e.target.value)} placeholder="Ciudad..." className="input text-sm" style={{ width: 110 }} />
          </div>
        </div>
      </div>

      {/* Formulario */}
      {formulario && (
        <FormularioTorneo
          onCerrar={() => setFormulario(false)}
          onCreado={() => { setFormulario(false); cargar(); }}
        />
      )}

      {/* ── GRID ── */}
      {cargando ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} style={{ height: 300, borderRadius: 12, background: 'rgba(255,255,255,0.03)', animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      ) : torneos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 24px' }}>
          <p style={{ fontSize: 48, marginBottom: 12 }}>🏆</p>
          <p style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 22, color: '#fff', marginBottom: 8 }}>SIN TORNEOS</p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginBottom: 24 }}>No hay torneos disponibles. Propone el primero.</p>
          <button onClick={() => setFormulario(true)} style={{
            background: '#fbbf24', color: '#000', fontFamily: 'Anton, Impact, sans-serif',
            fontSize: 13, letterSpacing: '0.1em', padding: '12px 28px', borderRadius: 8, border: 'none', cursor: 'pointer',
          }}>+ PROPONER TORNEO</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {torneos.map(t => <TarjetaTorneo key={t.id} torneo={t} />)}
        </div>
      )}
    </div>
  );
}
