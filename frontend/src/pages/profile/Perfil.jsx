import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';

const COLORES_NIVEL = {
  rookie: '#888', amateur: '#9FE1CB', intermedio: '#60a5fa',
  avanzado: '#a78bfa', pro: '#fbbf24', elite: '#f87171', leyenda: '#fde68a',
};

const XP_NIVELES = {
  rookie: 0, amateur: 100, intermedio: 300,
  avanzado: 600, pro: 1000, elite: 2000, leyenda: 5000,
};
const ORDEN_NIVELES = ['rookie','amateur','intermedio','avanzado','pro','elite','leyenda'];

function calcularProgreso(xp, nivel) {
  const idx = ORDEN_NIVELES.indexOf(nivel);
  if (idx === ORDEN_NIVELES.length - 1) return 100;
  const siguiente = ORDEN_NIVELES[idx + 1];
  const base = XP_NIVELES[nivel];
  const tope = XP_NIVELES[siguiente];
  return Math.min(100, Math.round(((xp - base) / (tope - base)) * 100));
}

const MEDALLAS = [
  { id: 'campeon',    emoji: '🏆', label: 'Campeón',      desc: 'Ganar un torneo oficial' },
  { id: 'goleador',   emoji: '🎯', label: 'Goleador',      desc: '20 goles registrados' },
  { id: 'relampago',  emoji: '⚡', label: 'Relámpago',     desc: '10 partidos sin fallar' },
  { id: 'capitan',    emoji: '👑', label: 'Capitán Nato',  desc: 'Crear 5 eventos exitosos' },
  { id: 'muralla',    emoji: '🧤', label: 'Muralla',        desc: '10 partidos sin goles (portero)' },
  { id: 'teamplayer', emoji: '🤝', label: 'Team Player',   desc: '50 recomendaciones positivas' },
  { id: 'infalible',  emoji: '💀', label: 'Infalible',     desc: '0 inasistencias en 20 partidos' },
  { id: 'leyenda',    emoji: '🌟', label: 'Leyenda',        desc: 'Llegar al nivel máximo' },
];

const DEPORTES_LIST = ['futbol','basquet','tenis','padel','voley','running','ciclismo','otro'];

const TAG_LABELS = {
  buen_companero: 'Buen compañero', tecnico: 'Técnico', puntual: 'Puntual',
  goleador: 'Goleador', rapido: 'Rápido', lider: 'Líder',
  agresivo: 'Agresivo', no_se_presento: 'No se presentó', tramposo: 'Tramposo',
};

function StatBox({ valor, label, color }) {
  return (
    <div className="text-center">
      <p className="font-impact text-2xl" style={{ color: color || 'white' }}>{valor ?? 0}</p>
      <p className="text-sp-muted text-xs uppercase tracking-wider mt-0.5">{label}</p>
    </div>
  );
}

export default function Perfil() {
  const { id } = useParams();
  const { usuario: yo } = useAuth();
  const [perfil, setPerfil]       = useState(null);
  const [publicaciones, setPubs]  = useState([]);
  const [historial, setHistorial] = useState([]);
  const [reputacion, setReputacion] = useState(null);
  const [cargando, setCargando]   = useState(true);
  const [siguiendo, setSiguiendo] = useState(false);
  const [accion, setAccion]       = useState(false);
  const [editando, setEditando]   = useState(false);
  const [form, setForm]           = useState({});
  const [guardando, setGuardando] = useState(false);
  const [tab, setTab]             = useState('publicaciones');

  const esMio = yo?.id === id;

  useEffect(() => {
    const cargar = async () => {
      setCargando(true);
      try {
        const [pRes, pubRes, histRes, repRes] = await Promise.all([
          api.get(`/usuarios/${id}`),
          api.get(`/usuarios/${id}/publicaciones`),
          api.get(`/usuarios/${id}/historial`),
          api.get(`/usuarios/${id}/reputacion`),
        ]);
        setPerfil(pRes.data);
        setSiguiendo(pRes.data.siguiendo_yo || false);
        setPubs(pubRes.data);
        setHistorial(histRes.data);
        setReputacion(repRes.data);
        setForm({
          nombre:           pRes.data.nombre       || '',
          apodo:            pRes.data.apodo        || '',
          bio:              pRes.data.bio          || '',
          ciudad:           pRes.data.ciudad       || '',
          departamento:     pRes.data.departamento || '',
          deportes:         pRes.data.deportes     || [],
          posicion:         pRes.data.posicion     || '',
          pie_dominante:    pRes.data.pie_dominante|| '',
          formato_preferido: pRes.data.formato_preferido || '',
          foto_url:         pRes.data.foto_url     || '',
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

  const toggleDeporte = (d) => setForm(p => ({
    ...p,
    deportes: p.deportes.includes(d) ? p.deportes.filter(x => x !== d) : [...p.deportes, d],
  }));

  if (cargando) return (
    <div className="max-w-3xl mx-auto px-4 py-12 animate-pulse space-y-4">
      <div className="h-32 bg-sp-card rounded-xl" />
      <div className="h-24 bg-sp-card rounded-xl" />
    </div>
  );

  if (!perfil) return <div className="text-center py-20 text-sp-muted">Usuario no encontrado</div>;

  const nivel   = perfil.nivel_xp ?? 'rookie';
  const xp      = perfil.xp ?? 0;
  const progreso = calcularProgreso(xp, nivel);
  const idxNivel = ORDEN_NIVELES.indexOf(nivel);
  const nivelSig  = idxNivel < ORDEN_NIVELES.length - 1 ? ORDEN_NIVELES[idxNivel + 1] : null;
  const colorNivel = COLORES_NIVEL[nivel];

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      {/* HEADER */}
      <div className="card">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-4 items-start flex-1">
            {/* Avatar */}
            <div className="relative shrink-0">
              {perfil.foto_url ? (
                <img src={perfil.foto_url} className="w-20 h-20 rounded-full object-cover border-2" style={{ borderColor: colorNivel }} alt="" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-sp-green flex items-center justify-center text-3xl font-bold text-white border-2" style={{ borderColor: colorNivel }}>
                  {perfil.username?.[0]?.toUpperCase()}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <h1 className="font-impact text-2xl">{perfil.nombre || perfil.username}</h1>
                {perfil.apodo && <span className="text-sp-muted text-sm">"{perfil.apodo}"</span>}
              </div>
              <p className="text-sp-muted text-sm">@{perfil.username}</p>
              {perfil.ciudad && <p className="text-sp-muted text-xs mt-0.5">📍 {perfil.departamento ? `${perfil.ciudad}, ${perfil.departamento}` : perfil.ciudad}</p>}
              {perfil.bio && <p className="text-white/80 text-sm mt-2 leading-relaxed">{perfil.bio}</p>}

              {/* Posición */}
              <div className="flex flex-wrap gap-2 mt-2">
                {perfil.posicion && <span className="badge-white capitalize">{perfil.posicion}</span>}
                {perfil.pie_dominante && <span className="badge-white capitalize">Pie {perfil.pie_dominante}</span>}
                {perfil.formato_preferido && <span className="badge-white">{perfil.formato_preferido}v{perfil.formato_preferido}</span>}
              </div>
            </div>
          </div>

          {esMio ? (
            <button onClick={() => setEditando(p => !p)} className="btn-ghost text-xs shrink-0">
              {editando ? 'Cancelar' : 'Editar'}
            </button>
          ) : (
            <button onClick={handleSeguir} disabled={accion} className={`text-xs shrink-0 ${siguiendo ? 'btn-ghost' : 'btn-primary'}`}>
              {accion ? '...' : siguiendo ? 'Siguiendo' : 'Seguir'}
            </button>
          )}
        </div>

        {/* XP Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="font-bold uppercase" style={{ color: colorNivel }}>{nivel}</span>
            {nivelSig && <span className="text-sp-muted">{xp} / {XP_NIVELES[nivelSig]} XP → {nivelSig.toUpperCase()}</span>}
            {!nivelSig && <span className="text-sp-muted">NIVEL MÁXIMO · {xp} XP</span>}
          </div>
          <div className="xp-bar">
            <div className="xp-bar-fill" style={{ width: `${progreso}%`, background: colorNivel }} />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-sp-border">
          <StatBox valor={perfil.partidos_jugados} label="Partidos" color={colorNivel} />
          <StatBox valor={perfil.seguidores || 0}  label="Seguidores" />
          <StatBox valor={perfil.siguiendo || 0}   label="Siguiendo" />
          <StatBox valor={`${xp} XP`}              label="Experiencia" color={colorNivel} />
        </div>

        {/* Estadísticas detalladas */}
        <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-sp-border">
          <StatBox valor={perfil.partidos_ganados}    label="Victorias"    color="#1D9E75" />
          <StatBox valor={perfil.partidos_empatados}  label="Empates"      color="#888" />
          <StatBox valor={perfil.goles_totales}       label="Goles"        color="#fbbf24" />
          <StatBox valor={perfil.asistencias_totales} label="Asistencias" />
        </div>

        {/* Deportes */}
        {perfil.deportes?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {perfil.deportes.map(d => <span key={d} className="badge-green capitalize">{d}</span>)}
          </div>
        )}
      </div>

      {/* MEDALLAS */}
      <div className="card">
        <h2 className="font-impact text-lg mb-3">MEDALLAS E INSIGNIAS</h2>
        <div className="grid grid-cols-4 gap-3">
          {MEDALLAS.map(m => {
            const desbloqueada = false; // TODO: conectar con backend
            return (
              <div
                key={m.id}
                title={m.desc}
                className={`flex flex-col items-center gap-1 py-2 rounded-xl border transition-all cursor-help ${desbloqueada ? 'border-sp-green/50 bg-sp-green/10' : 'border-sp-border opacity-30'}`}
              >
                <span className="text-2xl">{m.emoji}</span>
                <span className="text-[10px] text-center text-sp-muted leading-tight uppercase tracking-wide">{m.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* EDITOR */}
      {editando && (
        <div className="card border-sp-green/30 space-y-4">
          <h2 className="font-impact text-lg">EDITAR PERFIL</h2>

          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Nombre</label><input value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} className="input" /></div>
            <div><label className="label">Apodo</label><input value={form.apodo} onChange={e => setForm(p => ({ ...p, apodo: e.target.value }))} className="input" placeholder='"El Tigre"' /></div>
          </div>

          <div><label className="label">Bio</label><textarea value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} rows={2} className="input resize-none" /></div>

          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Ciudad</label><input value={form.ciudad} onChange={e => setForm(p => ({ ...p, ciudad: e.target.value }))} className="input" /></div>
            <div><label className="label">Departamento</label><input value={form.departamento} onChange={e => setForm(p => ({ ...p, departamento: e.target.value }))} className="input" /></div>
          </div>

          <div className="grid grid-cols-3 gap-4">
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
              <label className="label">Formato preferido</label>
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
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDeporte(d)}
                  className={`px-3 py-1 rounded-full text-xs border capitalize transition-colors ${form.deportes.includes(d) ? 'bg-sp-green border-sp-green text-white' : 'border-sp-border text-sp-muted hover:text-white'}`}
                >
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

      {/* TABS */}
      <div className="flex gap-1 border-b border-sp-border">
        {['publicaciones','historial','reputacion'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 -mb-px ${tab === t ? 'border-sp-green text-sp-green' : 'border-transparent text-sp-muted hover:text-white'}`}
          >
            {t === 'publicaciones' ? 'Posts' : t === 'historial' ? 'Historial' : 'Reputación'}
          </button>
        ))}
      </div>

      {/* TAB: PUBLICACIONES */}
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

      {/* TAB: HISTORIAL */}
      {tab === 'historial' && (
        <div className="space-y-2">
          {historial.length === 0 ? (
            <div className="card text-center py-10 text-sp-muted text-sm">Sin partidos registrados</div>
          ) : (
            historial.map((p, i) => {
              const res = p.resultado;
              const resColor = res === 'victoria' ? '#1D9E75' : res === 'derrota' ? '#f87171' : '#888';
              const resLabel = res === 'victoria' ? 'V' : res === 'derrota' ? 'D' : 'E';
              return (
                <div key={i} className="card flex items-center gap-4">
                  {/* Resultado badge */}
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 border-2" style={{ borderColor: resColor, color: resColor }}>
                    {resLabel}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{p.titulo}</p>
                    <p className="text-sp-muted text-xs capitalize">{p.tipo} · {p.deporte}</p>
                  </div>
                  {/* Stats */}
                  <div className="flex gap-3 text-xs text-sp-muted shrink-0">
                    {p.goles > 0 && <span className="text-yellow-400 font-bold">{p.goles}⚽</span>}
                    {p.asistencias > 0 && <span>{p.asistencias} asist.</span>}
                    {p.tarjeta_amarilla && <span className="text-yellow-400">🟨</span>}
                    {p.tarjeta_roja && <span className="text-red-400">🟥</span>}
                    {p.calificacion > 0 && <span style={{ color: colorNivel }}>★ {Number(p.calificacion).toFixed(1)}</span>}
                  </div>
                  {/* Fecha */}
                  <span className="text-sp-muted text-xs shrink-0">
                    {format(new Date(p.fecha), 'dd/MM/yy', { locale: es })}
                  </span>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB: REPUTACIÓN */}
      {tab === 'reputacion' && (
        <div className="card space-y-4">
          {reputacion?.total_calificaciones > 0 ? (
            <>
              {/* Promedio */}
              <div className="flex items-center gap-3">
                <span className="font-impact text-4xl" style={{ color: colorNivel }}>
                  {Number(reputacion.promedio_estrellas).toFixed(1)}
                </span>
                <div>
                  <div className="flex gap-0.5 text-yellow-400 text-lg">
                    {[1,2,3,4,5].map(s => (
                      <span key={s} className={Number(reputacion.promedio_estrellas) >= s ? 'opacity-100' : 'opacity-20'}>★</span>
                    ))}
                  </div>
                  <p className="text-sp-muted text-xs">{reputacion.total_calificaciones} calificaciones recibidas</p>
                </div>
              </div>

              {/* Tags positivos */}
              {reputacion.positivos?.length > 0 && (
                <div>
                  <p className="text-xs text-sp-muted uppercase tracking-wider mb-2">Puntos fuertes</p>
                  <div className="flex flex-wrap gap-2">
                    {reputacion.positivos.map(t => (
                      <span key={t.tag} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-sp-green/15 border border-sp-green/40 text-sp-green-light text-xs">
                        {TAG_LABELS[t.tag] || t.tag}
                        <span className="bg-sp-green/30 rounded-full px-1.5 py-0.5 text-sp-green font-bold">{t.total}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags negativos */}
              {reputacion.negativos?.length > 0 && (
                <div>
                  <p className="text-xs text-sp-muted uppercase tracking-wider mb-2">Áreas de mejora</p>
                  <div className="flex flex-wrap gap-2">
                    {reputacion.negativos.map(t => (
                      <span key={t.tag} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-900/20 border border-red-500/30 text-red-400 text-xs">
                        {TAG_LABELS[t.tag] || t.tag}
                        <span className="bg-red-900/30 rounded-full px-1.5 py-0.5 font-bold">{t.total}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-sp-muted text-sm">Sin calificaciones aún</div>
          )}
        </div>
      )}
    </div>
  );
}
