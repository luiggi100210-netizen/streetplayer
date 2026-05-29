import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';

import { COLORES_NIVEL } from '../../constants';

// ── Constantes ───────────────────────────────────────────────
const XP_NIVELES = {
  rookie: 0, amateur: 100, intermedio: 300,
  avanzado: 600, pro: 1000, elite: 2000, leyenda: 5000,
};
const ORDEN_NIVELES = ['rookie','amateur','intermedio','avanzado','pro','elite','leyenda'];

const MEDALLAS = [
  { id: 'campeon',    emoji: '🏆', label: 'Campeón'      },
  { id: 'goleador',   emoji: '🎯', label: 'Goleador'      },
  { id: 'relampago',  emoji: '⚡', label: 'Relámpago'     },
  { id: 'capitan',    emoji: '👑', label: 'Capitán'       },
  { id: 'muralla',    emoji: '🧤', label: 'Muralla'       },
  { id: 'teamplayer', emoji: '🤝', label: 'Team Player'   },
  { id: 'infalible',  emoji: '💀', label: 'Infalible'     },
  { id: 'leyenda',    emoji: '🌟', label: 'Leyenda'       },
];

const DEPORTES_LIST = ['futbol','basquet','tenis','padel','voley','running','ciclismo','otro'];

const TAG_LABELS = {
  buen_companero: 'Buen compañero', tecnico: 'Técnico', puntual: 'Puntual',
  goleador: 'Goleador', rapido: 'Rápido', lider: 'Líder',
  agresivo: 'Agresivo', no_se_presento: 'No se presentó', tramposo: 'Tramposo',
};

function calcularProgreso(xp, nivel) {
  const idx = ORDEN_NIVELES.indexOf(nivel);
  if (idx === ORDEN_NIVELES.length - 1) return 100;
  const sig = ORDEN_NIVELES[idx + 1];
  return Math.min(100, Math.round(((xp - XP_NIVELES[nivel]) / (XP_NIVELES[sig] - XP_NIVELES[nivel])) * 100));
}

// ── Sub-componentes ──────────────────────────────────────────
function BigStat({ valor, label, color }) {
  return (
    <div className="text-center py-4 px-3">
      <p className="font-impact text-3xl leading-none mb-1" style={{ color: color || '#fff' }}>{valor ?? 0}</p>
      <p className="text-[10px] text-sp-muted uppercase tracking-widest font-semibold">{label}</p>
    </div>
  );
}

function DataRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2 py-2.5 border-b border-sp-border last:border-0">
      <span className="text-sp-muted text-xs uppercase tracking-wider font-semibold w-28 shrink-0 pt-0.5">{label}</span>
      <span className="text-white text-sm capitalize flex-1">{value}</span>
    </div>
  );
}

// ── Componente principal ─────────────────────────────────────
export default function Perfil() {
  const { id } = useParams();
  const { usuario: yo } = useAuth();
  const [perfil,     setPerfil]     = useState(null);
  const [publicaciones, setPubs]    = useState([]);
  const [historial,  setHistorial]  = useState([]);
  const [reputacion, setReputacion] = useState(null);
  const [medallas,   setMedallas]   = useState([]);
  const [cargando,   setCargando]   = useState(true);
  const [siguiendo,  setSiguiendo]  = useState(false);
  const [accion,     setAccion]     = useState(false);
  const [editando,   setEditando]   = useState(false);
  const [form,       setForm]       = useState({});
  const [guardando,  setGuardando]  = useState(false);
  const [tab,        setTab]        = useState('historial');

  const esMio = yo?.id === id;

  useEffect(() => {
    const cargar = async () => {
      setCargando(true);
      try {
        const [pRes, pubRes, histRes, repRes, medRes] = await Promise.all([
          api.get(`/usuarios/${id}`),
          api.get(`/usuarios/${id}/publicaciones`),
          api.get(`/usuarios/${id}/historial`),
          api.get(`/usuarios/${id}/reputacion`),
          api.get(`/usuarios/${id}/medallas`),
        ]);
        setPerfil(pRes.data);
        setSiguiendo(pRes.data.siguiendo_yo || false);
        setPubs(pubRes.data);
        setHistorial(histRes.data);
        setReputacion(repRes.data);
        setMedallas(medRes.data || []);
        setForm({
          nombre: pRes.data.nombre || '', apodo: pRes.data.apodo || '',
          bio: pRes.data.bio || '', ciudad: pRes.data.ciudad || '',
          departamento: pRes.data.departamento || '', deportes: pRes.data.deportes || [],
          posicion: pRes.data.posicion || '', pie_dominante: pRes.data.pie_dominante || '',
          formato_preferido: pRes.data.formato_preferido || '', foto_url: pRes.data.foto_url || '',
        });
      } catch {}
      setCargando(false);
    };
    cargar();
  }, [id]);

  const handleSeguir = async () => {
    setAccion(true);
    try {
      await api.post(`/usuarios/${id}/seguir`);
      setSiguiendo(p => !p);
      setPerfil(p => ({ ...p, seguidores: siguiendo ? (p.seguidores - 1) : (p.seguidores + 1) }));
    } catch {}
    setAccion(false);
  };

  const handleGuardar = async () => {
    setGuardando(true);
    try {
      const { data } = await api.put('/usuarios/perfil', form);
      setPerfil(p => ({ ...p, ...data }));
      setEditando(false);
    } catch {}
    setGuardando(false);
  };

  const toggleDeporte = d => setForm(p => ({
    ...p,
    deportes: p.deportes.includes(d) ? p.deportes.filter(x => x !== d) : [...p.deportes, d],
  }));

  if (cargando) return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-4 animate-pulse">
      <div className="h-52 bg-sp-card rounded-xl" />
      <div className="grid grid-cols-3 gap-4">
        <div className="h-64 bg-sp-card rounded-xl" />
        <div className="col-span-2 h-64 bg-sp-card rounded-xl" />
      </div>
    </div>
  );

  if (!perfil) return <div className="text-center py-20 text-sp-muted">Usuario no encontrado</div>;

  const nivel      = perfil.nivel_xp ?? 'rookie';
  const xp         = perfil.xp ?? 0;
  const progreso   = calcularProgreso(xp, nivel);
  const idxNivel   = ORDEN_NIVELES.indexOf(nivel);
  const nivelSig   = idxNivel < ORDEN_NIVELES.length - 1 ? ORDEN_NIVELES[idxNivel + 1] : null;
  const colorNivel = COLORES_NIVEL[nivel];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">

      {/* ── BANNER HEADER (estilo Transfermarkt) ── */}
      <div className="rounded-xl overflow-hidden border border-sp-border">

        {/* Franja superior de color del nivel */}
        <div style={{ height: 6, background: colorNivel }} />

        {/* Fondo banner */}
        <div className="relative bg-sp-card" style={{
          background: `linear-gradient(135deg, #111 0%, #1a1a1a 50%, #0f0f0f 100%)`,
        }}>
          {/* Patrón sutil */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }} />

          <div className="relative flex gap-6 p-6 md:p-8">
            {/* Avatar grande */}
            <div className="shrink-0">
              <div style={{
                width: 120, height: 120, borderRadius: 12, overflow: 'hidden',
                border: `3px solid ${colorNivel}`,
                boxShadow: `0 0 0 1px rgba(0,0,0,0.5), 0 0 24px ${colorNivel}33`,
              }}>
                {perfil.foto_url ? (
                  <img src={perfil.foto_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: colorNivel + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 52, color: colorNivel, lineHeight: 1 }}>
                      {perfil.username?.[0]?.toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              {/* Nivel badge bajo avatar */}
              <div style={{
                marginTop: 8, textAlign: 'center', padding: '4px 8px',
                border: `1px solid ${colorNivel}55`, borderRadius: 6,
                background: colorNivel + '15',
              }}>
                <span style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 13, color: colorNivel, letterSpacing: '0.08em' }}>
                  {nivel.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Info jugador */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h1 style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 'clamp(22px, 4vw, 36px)', lineHeight: 1.1, color: '#fff', letterSpacing: '0.02em' }}>
                    {perfil.nombre || perfil.username}
                    {perfil.apodo && <span className="text-sp-muted text-base font-sans ml-2 font-normal">"{perfil.apodo}"</span>}
                  </h1>
                  <p className="text-sp-muted text-sm mt-1">@{perfil.username}</p>
                </div>

                {/* Botones acción */}
                <div className="flex gap-2 shrink-0">
                  {esMio ? (
                    <button onClick={() => setEditando(p => !p)} className="btn-ghost text-xs">
                      {editando ? 'Cancelar' : '✏️ Editar perfil'}
                    </button>
                  ) : (
                    <button onClick={handleSeguir} disabled={accion}
                      className={`text-xs ${siguiendo ? 'btn-ghost' : 'btn-primary'}`}>
                      {accion ? '...' : siguiendo ? '✓ Siguiendo' : '+ Seguir'}
                    </button>
                  )}
                </div>
              </div>

              {/* Ciudad + Bio */}
              {(perfil.ciudad || perfil.bio) && (
                <div className="mt-3 space-y-1.5">
                  {perfil.ciudad && (
                    <p className="text-sp-muted text-sm flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {perfil.departamento ? `${perfil.ciudad}, ${perfil.departamento}` : perfil.ciudad}
                    </p>
                  )}
                  {perfil.bio && <p className="text-white/70 text-sm leading-relaxed max-w-lg">{perfil.bio}</p>}
                </div>
              )}

              {/* Deportes */}
              {perfil.deportes?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {perfil.deportes.map(d => (
                    <span key={d} className="badge-green capitalize text-[11px]">⚽ {d}</span>
                  ))}
                </div>
              )}

              {/* Seguidores / Siguiendo */}
              <div className="flex gap-5 mt-4">
                <div>
                  <span className="font-impact text-xl" style={{ color: colorNivel }}>{perfil.seguidores || 0}</span>
                  <span className="text-sp-muted text-xs ml-1.5 uppercase tracking-wider">Seguidores</span>
                </div>
                <div>
                  <span className="font-impact text-xl text-white">{perfil.siguiendo || 0}</span>
                  <span className="text-sp-muted text-xs ml-1.5 uppercase tracking-wider">Siguiendo</span>
                </div>
                <div>
                  <span className="font-impact text-xl text-white">{perfil.partidos_jugados || 0}</span>
                  <span className="text-sp-muted text-xs ml-1.5 uppercase tracking-wider">Partidos</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── BARRA DE STATS (como Transfermarkt) ── */}
        <div className="border-t border-sp-border grid grid-cols-7 divide-x divide-sp-border bg-sp-bg">
          <BigStat valor={perfil.partidos_jugados}    label="Partidos"    color={colorNivel} />
          <BigStat valor={perfil.partidos_ganados}    label="Victorias"   color="#1D9E75" />
          <BigStat valor={perfil.partidos_empatados}  label="Empates"     color="#888" />
          <BigStat valor={perfil.partidos_perdidos}   label="Derrotas"    color="#f87171" />
          <BigStat valor={perfil.goles_totales}       label="Goles"       color="#fbbf24" />
          <BigStat valor={perfil.asistencias_totales} label="Asistencias" />
          <BigStat valor={`${xp}`}                   label="XP"          color={colorNivel} />
        </div>

        {/* XP Progress */}
        <div className="px-6 py-3 border-t border-sp-border bg-sp-bg flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wider shrink-0" style={{ color: colorNivel, width: 90 }}>{nivel}</span>
          <div className="flex-1 h-1.5 bg-sp-border rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${progreso}%`, background: colorNivel }} />
          </div>
          {nivelSig
            ? <span className="text-xs text-sp-muted shrink-0">{xp} / {XP_NIVELES[nivelSig]} XP → <span className="uppercase">{nivelSig}</span></span>
            : <span className="text-xs text-sp-muted shrink-0">NIVEL MÁXIMO · {xp} XP</span>
          }
        </div>
      </div>

      {/* ── GRID PRINCIPAL (sidebar + contenido) ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">

        {/* ── COLUMNA IZQUIERDA: Datos + Medallas ── */}
        <div className="space-y-4">

          {/* Datos del jugador — tabla estilo Transfermarkt */}
          <div className="card">
            <h2 className="font-impact text-sm uppercase tracking-wider text-sp-muted mb-1 pb-2 border-b border-sp-border">
              Datos del jugador
            </h2>
            <div className="mt-1">
              <DataRow label="Ciudad"   value={perfil.ciudad} />
              <DataRow label="Región"   value={perfil.departamento} />
              <DataRow label="Posición" value={perfil.posicion} />
              <DataRow label="Pie"      value={perfil.pie_dominante ? `Pie ${perfil.pie_dominante}` : null} />
              <DataRow label="Formato"  value={perfil.formato_preferido ? `${perfil.formato_preferido}v${perfil.formato_preferido}` : null} />
              <DataRow label="Nivel"    value={nivel} />
              <DataRow label="Tarjetas" value={
                (perfil.tarjetas_amarillas || perfil.tarjetas_rojas)
                  ? `🟨 ${perfil.tarjetas_amarillas || 0}   🟥 ${perfil.tarjetas_rojas || 0}`
                  : null
              } />
              <DataRow label="En SP desde" value={
                perfil.fecha_registro
                  ? format(new Date(perfil.fecha_registro), 'MMM yyyy', { locale: es })
                  : null
              } />
            </div>
          </div>

          {/* Medallas */}
          <div className="card">
            <h2 className="font-impact text-sm uppercase tracking-wider text-sp-muted mb-3 pb-2 border-b border-sp-border">
              Medallas e insignias
            </h2>
            <div className="grid grid-cols-4 gap-2">
              {MEDALLAS.map(m => {
                const ok = medallas.includes(m.id);
                return (
                  <div key={m.id} title={m.label} className={`flex flex-col items-center gap-1 py-2.5 rounded-lg border transition-all ${ok ? 'border-sp-green/50 bg-sp-green/10' : 'border-sp-border/30 opacity-25'}`}>
                    <span className="text-xl">{m.emoji}</span>
                    <span className="text-[9px] text-center text-sp-muted leading-tight uppercase tracking-wide">{m.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── COLUMNA DERECHA: Tabs ── */}
        <div className="md:col-span-2 space-y-3">

          {/* Editor */}
          {editando && (
            <div className="card border-sp-green/30 space-y-4">
              <h2 className="font-impact text-lg">EDITAR PERFIL</h2>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Nombre</label><input value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} className="input" /></div>
                <div><label className="label">Apodo</label><input value={form.apodo} onChange={e => setForm(p => ({ ...p, apodo: e.target.value }))} className="input" placeholder='"El Tigre"' /></div>
              </div>
              <div><label className="label">Bio</label><textarea value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} rows={2} className="input resize-none" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Ciudad</label><input value={form.ciudad} onChange={e => setForm(p => ({ ...p, ciudad: e.target.value }))} className="input" /></div>
                <div><label className="label">Departamento</label><input value={form.departamento} onChange={e => setForm(p => ({ ...p, departamento: e.target.value }))} className="input" /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label">Posición</label>
                  <select value={form.posicion} onChange={e => setForm(p => ({ ...p, posicion: e.target.value }))} className="input">
                    <option value="">-</option>
                    {['portero','defensa','mediocampista','delantero'].map(p => <option key={p} value={p} className="capitalize">{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Pie dominante</label>
                  <select value={form.pie_dominante} onChange={e => setForm(p => ({ ...p, pie_dominante: e.target.value }))} className="input">
                    <option value="">-</option>
                    {['derecho','izquierdo','ambos'].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Formato</label>
                  <select value={form.formato_preferido} onChange={e => setForm(p => ({ ...p, formato_preferido: e.target.value }))} className="input">
                    <option value="">-</option>
                    {[5,7,8,9,10,11].map(n => <option key={n} value={n}>{n}v{n}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Deportes</label>
                <div className="flex flex-wrap gap-2">
                  {DEPORTES_LIST.map(d => (
                    <button key={d} type="button" onClick={() => toggleDeporte(d)}
                      className={`px-3 py-1 rounded-full text-xs border capitalize transition-colors ${form.deportes.includes(d) ? 'bg-sp-green border-sp-green text-white' : 'border-sp-border text-sp-muted hover:text-white'}`}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div><label className="label">URL de foto</label><input value={form.foto_url} onChange={e => setForm(p => ({ ...p, foto_url: e.target.value }))} className="input" placeholder="https://..." /></div>
              <button onClick={handleGuardar} disabled={guardando} className="btn-primary w-full">
                {guardando ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}
              </button>
            </div>
          )}

          {/* Tabs */}
          <div className="flex border-b border-sp-border gap-1">
            {[
              { key: 'historial',     label: 'Historial' },
              { key: 'reputacion',    label: 'Reputación' },
              { key: 'publicaciones', label: 'Posts' },
            ].map(({ key, label }) => (
              <button key={key} onClick={() => setTab(key)}
                className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 -mb-px ${tab === key ? 'border-sp-green text-sp-green' : 'border-transparent text-sp-muted hover:text-white'}`}>
                {label}
              </button>
            ))}
          </div>

          {/* ── TAB: HISTORIAL (tabla estilo Transfermarkt) ── */}
          {tab === 'historial' && (
            <div className="card p-0 overflow-hidden">
              {historial.length === 0 ? (
                <p className="text-center py-10 text-sp-muted text-sm">Sin partidos registrados</p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-sp-border bg-sp-bg">
                      <th className="th w-10 text-center">Res.</th>
                      <th className="th">Evento</th>
                      <th className="th text-center hidden md:table-cell">Tipo</th>
                      <th className="th text-center">⚽</th>
                      <th className="th text-center hidden sm:table-cell">Asist.</th>
                      <th className="th text-center hidden sm:table-cell">★</th>
                      <th className="th text-right">Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historial.map((p, i) => {
                      const resColor = p.resultado === 'victoria' ? '#1D9E75' : p.resultado === 'derrota' ? '#f87171' : '#888';
                      const resLabel = p.resultado === 'victoria' ? 'V' : p.resultado === 'derrota' ? 'D' : 'E';
                      return (
                        <tr key={i} className="border-b border-sp-border/50 last:border-0 hover:bg-white/[0.02] transition-colors">
                          <td className="td text-center">
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              width: 26, height: 26, borderRadius: '50%',
                              border: `1.5px solid ${resColor}`, color: resColor,
                              fontSize: 10, fontWeight: 700,
                            }}>{resLabel}</span>
                          </td>
                          <td className="td">
                            <p className="text-white text-sm font-medium truncate max-w-[180px]">{p.titulo}</p>
                          </td>
                          <td className="td text-center hidden md:table-cell">
                            <span className="badge-white capitalize">{p.tipo}</span>
                          </td>
                          <td className="td text-center">
                            <span className={`text-sm font-bold ${p.goles > 0 ? 'text-yellow-400' : 'text-sp-muted'}`}>{p.goles || 0}</span>
                          </td>
                          <td className="td text-center hidden sm:table-cell">
                            <span className="text-sm text-sp-muted">{p.asistencias || 0}</span>
                          </td>
                          <td className="td text-center hidden sm:table-cell">
                            {p.calificacion > 0
                              ? <span className="text-sm font-bold" style={{ color: colorNivel }}>★ {Number(p.calificacion).toFixed(1)}</span>
                              : <span className="text-sp-muted text-sm">—</span>
                            }
                          </td>
                          <td className="td text-right text-xs text-sp-muted whitespace-nowrap">
                            {format(new Date(p.fecha), 'dd MMM yy', { locale: es })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ── TAB: REPUTACIÓN ── */}
          {tab === 'reputacion' && (
            <div className="card space-y-5">
              {reputacion?.total_calificaciones > 0 ? (
                <>
                  {/* Puntuación grande */}
                  <div className="flex items-center gap-5 pb-4 border-b border-sp-border">
                    <div className="text-center">
                      <p className="font-impact text-6xl leading-none" style={{ color: colorNivel }}>
                        {Number(reputacion.promedio_estrellas).toFixed(1)}
                      </p>
                      <div className="flex gap-0.5 justify-center mt-1">
                        {[1,2,3,4,5].map(s => (
                          <svg key={s} className="w-4 h-4" fill={Number(reputacion.promedio_estrellas) >= s ? '#fbbf24' : 'none'} stroke="#fbbf24" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-white font-bold text-lg">{reputacion.total_calificaciones} calificaciones</p>
                      <p className="text-sp-muted text-sm">recibidas de compañeros</p>
                    </div>
                  </div>

                  {reputacion.positivos?.length > 0 && (
                    <div>
                      <p className="text-xs text-sp-muted uppercase tracking-widest mb-3 font-semibold">✅ Puntos fuertes</p>
                      <div className="flex flex-wrap gap-2">
                        {reputacion.positivos.map(t => (
                          <span key={t.tag} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-sp-green/10 border border-sp-green/30 text-sp-green-light text-xs font-semibold">
                            {TAG_LABELS[t.tag] || t.tag}
                            <span className="bg-sp-green/25 text-sp-green rounded-full px-1.5 py-0.5 font-bold text-[10px]">{t.total}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {reputacion.negativos?.length > 0 && (
                    <div>
                      <p className="text-xs text-sp-muted uppercase tracking-widest mb-3 font-semibold">⚠️ Áreas de mejora</p>
                      <div className="flex flex-wrap gap-2">
                        {reputacion.negativos.map(t => (
                          <span key={t.tag} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-900/20 border border-red-500/30 text-red-400 text-xs font-semibold">
                            {TAG_LABELS[t.tag] || t.tag}
                            <span className="bg-red-900/30 rounded-full px-1.5 py-0.5 font-bold text-[10px]">{t.total}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-10 text-sp-muted text-sm">Sin calificaciones aún</div>
              )}
            </div>
          )}

          {/* ── TAB: PUBLICACIONES ── */}
          {tab === 'publicaciones' && (
            <div className="space-y-3">
              {publicaciones.length === 0 ? (
                <div className="card text-center py-10 text-sp-muted text-sm">Sin publicaciones aún</div>
              ) : (
                publicaciones.map(pub => (
                  <div key={pub.id} className="card">
                    {pub.contenido && <p className="text-white/90 text-sm leading-relaxed mb-3">{pub.contenido}</p>}
                    {pub.imagen_url && <img src={pub.imagen_url} alt="" className="w-full rounded-lg mb-3 max-h-64 object-cover" />}
                    <div className="flex items-center gap-4 text-xs text-sp-muted border-t border-sp-border pt-2">
                      <span>❤️ {pub.likes_count || 0}</span>
                      <span>💬 {pub.comentarios_count || 0}</span>
                      <span className="ml-auto">{formatDistanceToNow(new Date(pub.fecha), { addSuffix: true, locale: es })}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
