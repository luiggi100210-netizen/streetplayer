import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import Avatar from '../../components/Avatar';
import { COLORES_NIVEL } from '../../constants';

const ESTADO_RETO = {
  pendiente: { color: '#fbbf24', label: 'Pendiente' },
  aceptado:  { color: '#1D9E75', label: 'Aceptado ✅' },
  rechazado: { color: '#f87171', label: 'Rechazado ❌' },
  finalizado:{ color: '#888',    label: 'Finalizado' },
};

// ── Tarjeta publicación ──────────────────────────────────────
function TarjetaPublicacion({ pub }) {
  const [liked,     setLiked]     = useState(pub.yo_di_like || false);
  const [likes,     setLikes]     = useState(parseInt(pub.total_likes) || 0);
  const [comments,  setComments]  = useState([]);
  const [showComs,  setShowComs]  = useState(false);
  const [newCom,    setNewCom]    = useState('');
  const [sending,   setSending]   = useState(false);
  const colorNivel = COLORES_NIVEL[pub.nivel_xp] || '#888';
  const esReto = pub.contenido?.startsWith('⚔️ RETO:');

  const handleLike = async () => {
    try {
      await api.post(`/feed/${pub.id}/like`);
      setLiked(p => !p);
      setLikes(p => liked ? p - 1 : p + 1);
    } catch {}
  };

  const toggleComments = async () => {
    if (showComs) { setShowComs(false); return; }
    try {
      const { data } = await api.get(`/feed/${pub.id}/comentarios`);
      setComments(data);
      setShowComs(true);
    } catch {}
  };

  const sendComment = async e => {
    e.preventDefault();
    if (!newCom.trim()) return;
    setSending(true);
    try {
      const { data } = await api.post(`/feed/${pub.id}/comentarios`, { contenido: newCom });
      setComments(p => [...p, data]);
      setNewCom('');
    } catch {}
    setSending(false);
  };

  return (
    <div style={{
      background: '#111', border: `1px solid ${esReto ? 'rgba(229,160,0,0.25)' : 'rgba(255,255,255,0.07)'}`,
      borderRadius: 12, overflow: 'hidden',
    }}>
      {/* Accent bar para retos */}
      {esReto && <div style={{ height: 3, background: 'linear-gradient(to right, #e5a000, #f87171)' }} />}

      <div style={{ padding: '14px 16px' }}>
        {/* Header autor */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <Link to={`/perfil/${pub.usuario_id}`} style={{ textDecoration: 'none' }}>
            <Avatar foto={pub.foto_url} username={pub.username} size={38} color={colorNivel} />
          </Link>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Link to={`/perfil/${pub.usuario_id}`} style={{ textDecoration: 'none' }}>
              <span style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 14, color: '#fff', letterSpacing: '0.02em' }}>
                {pub.nombre || pub.username}
              </span>
            </Link>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>
              @{pub.username} · {formatDistanceToNow(new Date(pub.fecha), { addSuffix: true, locale: es })}
            </p>
          </div>
          {pub.deporte && (
            <span style={{
              fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em',
              padding: '3px 8px', borderRadius: 4,
              color: esReto ? '#e5a000' : '#1D9E75',
              background: esReto ? 'rgba(229,160,0,0.12)' : 'rgba(29,158,117,0.12)',
              border: `1px solid ${esReto ? 'rgba(229,160,0,0.35)' : 'rgba(29,158,117,0.35)'}`,
            }}>{esReto ? '⚔️ ' : ''}{pub.deporte}</span>
          )}
        </div>

        {/* Contenido */}
        {pub.contenido && (
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.82)', lineHeight: 1.65, marginBottom: pub.foto_url ? 10 : 12 }}>
            {pub.contenido}
          </p>
        )}

        {pub.foto_url && (
          <img src={pub.foto_url} alt="" style={{ width: '100%', borderRadius: 8, maxHeight: 360, objectFit: 'cover', marginBottom: 12 }} />
        )}

        {/* Evento vinculado */}
        {pub.evento_titulo && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
            background: 'rgba(29,158,117,0.08)', border: '1px solid rgba(29,158,117,0.2)',
            borderRadius: 8, marginBottom: 12,
          }}>
            <span style={{ fontSize: 14 }}>⚽</span>
            <span style={{ fontSize: 12, color: '#1D9E75', fontWeight: 600 }}>{pub.evento_titulo}</span>
          </div>
        )}

        {/* Acciones */}
        <div style={{ display: 'flex', gap: 20, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={handleLike} style={{
            display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer',
            color: liked ? '#f87171' : 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 600, transition: 'color .15s',
          }}>
            <svg width={16} height={16} fill={liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {likes > 0 && likes}
          </button>
          <button onClick={toggleComments} style={{
            display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer',
            color: showComs ? '#1D9E75' : 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 600, transition: 'color .15s',
          }}>
            <svg width={16} height={16} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {pub.total_comentarios > 0 && pub.total_comentarios}
          </button>
        </div>

        {/* Comentarios */}
        {showComs && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {comments.map(c => (
              <div key={c.id} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <Avatar foto={c.foto_url} username={c.username} size={28} color="#1D9E75" />
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: '6px 10px' }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#1D9E75', marginBottom: 2 }}>@{c.username}</p>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>{c.contenido}</p>
                </div>
              </div>
            ))}
            <form onSubmit={sendComment} style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <input value={newCom} onChange={e => setNewCom(e.target.value)}
                placeholder="Escribe un comentario..." className="input flex-1 text-sm" style={{ paddingTop: 6, paddingBottom: 6 }} />
              <button type="submit" disabled={sending} className="btn-primary text-xs px-3">
                {sending ? '...' : 'Enviar'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tarjeta Reto (equipo vs equipo) ─────────────────────────
function TarjetaReto({ reto, mioEquipoId, onResponder }) {
  const cfg      = ESTADO_RETO[reto.estado] || ESTADO_RETO.pendiente;
  const esMiReto = reto.retado_id === mioEquipoId && reto.estado === 'pendiente';
  const [respondiendo, setRespondiendo] = useState(false);

  const responder = async (accion) => {
    setRespondiendo(true);
    try {
      await api.put(`/retos/${reto.id}/responder`, { accion });
      onResponder();
    } catch {}
    setRespondiendo(false);
  };

  return (
    <div style={{
      background: '#111', border: '1px solid rgba(229,160,0,0.2)',
      borderRadius: 12, overflow: 'hidden',
    }}>
      <div style={{ height: 3, background: 'linear-gradient(to right, #e5a000, #f87171)' }} />
      <div style={{ padding: '14px 16px' }}>
        {/* VS display */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          {/* Retador */}
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{
              width: 48, height: 48, borderRadius: 10, margin: '0 auto 6px',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
            }}>
              {reto.retador_escudo ? <img src={reto.retador_escudo} style={{ width: 40, height: 40, objectFit: 'contain' }} alt="" /> : '🛡️'}
            </div>
            <p style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 13, color: '#fff', letterSpacing: '0.02em', marginBottom: 1 }}>{reto.retador_nombre}</p>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>@{reto.retador_capitan}</p>
          </div>

          {/* VS */}
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <span style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 22, color: '#e5a000', letterSpacing: '0.04em' }}>VS</span>
            <div style={{
              fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em',
              padding: '3px 8px', borderRadius: 4, marginTop: 6,
              color: cfg.color, background: cfg.color + '18', border: `1px solid ${cfg.color}44`,
            }}>{cfg.label}</div>
          </div>

          {/* Retado */}
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{
              width: 48, height: 48, borderRadius: 10, margin: '0 auto 6px',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
            }}>
              {reto.retado_escudo ? <img src={reto.retado_escudo} style={{ width: 40, height: 40, objectFit: 'contain' }} alt="" /> : '🛡️'}
            </div>
            <p style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 13, color: '#fff', letterSpacing: '0.02em', marginBottom: 1 }}>{reto.retado_nombre}</p>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>@{reto.retado_capitan}</p>
          </div>
        </div>

        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginBottom: esMiReto ? 12 : 0, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em' }}>
          {formatDistanceToNow(new Date(reto.fecha), { addSuffix: true, locale: es })}
        </p>

        {/* Botones accept/reject si es mi reto pendiente */}
        {esMiReto && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => responder('rechazar')} disabled={respondiendo}
              style={{ flex: 1, padding: '8px', borderRadius: 8, border: '1px solid rgba(248,113,113,0.4)', background: 'rgba(248,113,113,0.1)', color: '#f87171', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all .15s', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              ✕ Rechazar
            </button>
            <button onClick={() => responder('aceptar')} disabled={respondiendo}
              style={{ flex: 1, padding: '8px', borderRadius: 8, border: '1px solid rgba(29,158,117,0.5)', background: 'rgba(29,158,117,0.15)', color: '#1D9E75', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all .15s', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              ✓ Aceptar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Composer publicación / reto ──────────────────────────────
function Composer({ usuario, onPublicado }) {
  const [modo,      setModo]      = useState('post'); // 'post' | 'reto'
  const [contenido, setContenido] = useState('');
  const [deporte,   setDeporte]   = useState('futbol');
  const [publicando, setPublicando] = useState(false);

  const DEPORTES = ['futbol','basquet','tenis','padel','voley','running'];

  const publicar = async e => {
    e.preventDefault();
    if (!contenido.trim()) return;
    setPublicando(true);
    try {
      const payload = modo === 'reto'
        ? { contenido: `⚔️ RETO: ${contenido}`, deporte }
        : { contenido };
      const { data } = await api.post('/feed', payload);
      onPublicado(data);
      setContenido('');
      setModo('post');
    } catch {}
    setPublicando(false);
  };

  const colorNivel = COLORES_NIVEL[usuario?.nivel_xp] || '#888';

  return (
    <div style={{
      background: '#111', border: `1px solid ${modo === 'reto' ? 'rgba(229,160,0,0.3)' : 'rgba(255,255,255,0.07)'}`,
      borderRadius: 12, overflow: 'hidden', transition: 'border-color .2s',
    }}>
      {modo === 'reto' && <div style={{ height: 3, background: 'linear-gradient(to right, #e5a000, #f87171)' }} />}
      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <Avatar foto={usuario?.foto_url} username={usuario?.username} size={38} color={colorNivel} />
          <div style={{ flex: 1 }}>
            {/* Toggle post / reto */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              {[{ key: 'post', label: '📝 Publicar' }, { key: 'reto', label: '⚔️ Lanzar Reto' }].map(({ key, label }) => (
                <button key={key} onClick={() => setModo(key)} style={{
                  fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 999, cursor: 'pointer',
                  border: `1px solid ${modo === key ? (key === 'reto' ? '#e5a000' : '#1D9E75') : 'rgba(255,255,255,0.1)'}`,
                  background: modo === key ? (key === 'reto' ? 'rgba(229,160,0,0.15)' : 'rgba(29,158,117,0.15)') : 'transparent',
                  color: modo === key ? (key === 'reto' ? '#e5a000' : '#1D9E75') : 'rgba(255,255,255,0.4)',
                  transition: 'all .15s',
                }}>{label}</button>
              ))}
            </div>

            <textarea
              value={contenido}
              onChange={e => setContenido(e.target.value)}
              placeholder={modo === 'reto'
                ? '⚔️ ¿A quién retas? ¿Qué términos pones sobre la mesa? ¡Lánzalo aquí!'
                : '¿Qué está pasando en la cancha? Comparte con la comunidad...'}
              rows={modo === 'reto' ? 3 : 2}
              className="input w-full resize-none text-sm"
              style={{ marginBottom: 10 }}
            />

            {/* Selector deporte (solo en modo reto) */}
            {modo === 'reto' && (
              <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                {DEPORTES.map(d => (
                  <button key={d} type="button" onClick={() => setDeporte(d)} style={{
                    fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 999, cursor: 'pointer',
                    textTransform: 'capitalize', border: `1px solid ${deporte === d ? '#e5a000' : 'rgba(255,255,255,0.1)'}`,
                    background: deporte === d ? 'rgba(229,160,0,0.15)' : 'transparent',
                    color: deporte === d ? '#e5a000' : 'rgba(255,255,255,0.35)', transition: 'all .15s',
                  }}>{d}</button>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={publicar} disabled={publicando || !contenido.trim()} style={{
                fontFamily: 'Anton, Impact, sans-serif', fontSize: 13, letterSpacing: '0.1em',
                padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: modo === 'reto' ? '#e5a000' : '#1D9E75',
                color: modo === 'reto' ? '#000' : '#fff',
                opacity: (!contenido.trim() || publicando) ? 0.5 : 1,
                transition: 'opacity .15s',
              }}>
                {publicando ? '...' : modo === 'reto' ? '⚔️ LANZAR RETO' : 'PUBLICAR'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sidebar ──────────────────────────────────────────────────
function Sidebar({ usuario, ranking }) {
  const colorNivel = COLORES_NIVEL[usuario?.nivel_xp] || '#888';
  return (
    <div className="space-y-4">
      {/* Mi perfil mini */}
      <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ height: 3, background: colorNivel }} />
        <div style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Avatar foto={usuario?.foto_url} username={usuario?.username} size={44} color={colorNivel} />
            <div>
              <p style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 15, color: '#fff', letterSpacing: '0.02em' }}>
                {usuario?.nombre || usuario?.username}
              </p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>@{usuario?.username}</p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
            {[
              { val: usuario?.partidos_jugados || 0, label: 'Partidos', color: colorNivel },
              { val: (usuario?.nivel_xp || 'rookie').toUpperCase(), label: 'Nivel', color: colorNivel },
              { val: usuario?.xp || 0, label: 'XP', color: colorNivel },
              { val: usuario?.goles_totales || 0, label: 'Goles', color: '#fbbf24' },
            ].map(({ val, label, color }) => (
              <div key={label} style={{ textAlign: 'center', padding: '8px 4px', background: 'rgba(255,255,255,0.03)', borderRadius: 6 }}>
                <p style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 18, color, lineHeight: 1 }}>{val}</p>
                <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{label}</p>
              </div>
            ))}
          </div>
          <Link to={`/perfil/${usuario?.id}`} style={{
            display: 'block', textAlign: 'center', padding: '8px', borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.55)',
            textDecoration: 'none', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
            transition: 'all .15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = colorNivel; e.currentTarget.style.color = colorNivel; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; }}
          >Ver perfil completo</Link>
        </div>
      </div>

      {/* Top ranking mini */}
      {ranking.length > 0 && (
        <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 13, color: '#fff', letterSpacing: '0.04em' }}>TOP RANKING</span>
            <Link to="/ranking" style={{ fontSize: 11, fontWeight: 700, color: '#1D9E75', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Ver todo</Link>
          </div>
          <div className="space-y-2">
            {ranking.slice(0, 5).map((item, i) => {
              const posColor = i === 0 ? '#fbbf24' : i === 1 ? '#9ca3af' : i === 2 ? '#d97706' : 'rgba(255,255,255,0.25)';
              return (
                <Link key={item.usuario_id} to={`/perfil/${item.usuario_id}`}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', padding: '4px 0' }}>
                  <span style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 13, color: posColor, width: 20, textAlign: 'center', flexShrink: 0 }}>
                    {i < 3 ? ['🥇','🥈','🥉'][i] : `#${i+1}`}
                  </span>
                  <Avatar foto={item.foto_url} username={item.username} size={26} color={COLORES_NIVEL[item.nivel_xp] || '#888'} />
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.username}
                  </span>
                  <span style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 13, color: posColor }}>{item.puntos}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Accesos rápidos */}
      <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 16 }}>
        <p style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 13, color: '#fff', letterSpacing: '0.04em', marginBottom: 10 }}>ACCESOS RÁPIDOS</p>
        <div className="space-y-1">
          {[
            { to: '/eventos/nuevo', label: '+ Crear evento',  color: '#1D9E75' },
            { to: '/eventos',       label: '⚽ Ver eventos',   color: 'rgba(255,255,255,0.55)' },
            { to: '/equipos',       label: '🛡️ Mis equipos',   color: 'rgba(255,255,255,0.55)' },
            { to: '/torneos',       label: '🏆 Torneos',       color: 'rgba(255,255,255,0.55)' },
            { to: '/buscar',        label: '🔍 Buscar jugadores', color: 'rgba(255,255,255,0.55)' },
          ].map(({ to, label, color }) => (
            <Link key={to} to={to} style={{
              display: 'block', padding: '7px 10px', borderRadius: 6, textDecoration: 'none',
              fontSize: 12, fontWeight: 600, color, transition: 'background .15s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >{label}</Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Página principal ─────────────────────────────────────────
export default function Home() {
  const { usuario } = useAuth();
  const [feed,     setFeed]     = useState([]);
  const [retos,    setRetos]    = useState([]);
  const [eventos,  setEventos]  = useState([]);
  const [ranking,  setRanking]  = useState([]);
  const [tab,      setTab]      = useState('feed');
  const [cargando, setCargando] = useState(true);
  const [miEquipoId, setMiEquipoId] = useState(null);

  const cargar = async () => {
    setCargando(true);
    try {
      const [feedRes, retosRes, eventosRes, rankingRes] = await Promise.all([
        api.get('/feed'),
        api.get('/retos/comunidad'),
        api.get('/eventos?estado=abierto'),
        api.get('/ranking'),
      ]);
      setFeed(feedRes.data);
      setRetos(retosRes.data);
      setEventos(eventosRes.data.slice(0, 6));
      setRanking(rankingRes.data);

      // Obtener el ID del equipo del que soy capitán para accept/reject
      try {
        const { data: { mi_equipo_id } } = await api.get('/retos');
        if (mi_equipo_id) setMiEquipoId(mi_equipo_id);
      } catch {}
    } catch {}
    setCargando(false);
  };

  useEffect(() => { cargar(); }, []);

  const TABS = [
    { key: 'feed',    label: '📰 Feed' },
    { key: 'retos',   label: '⚔️ Retos' },
    { key: 'eventos', label: '⚽ Eventos' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-20">
            <Sidebar usuario={usuario} ranking={ranking} />
          </div>
        </aside>

        {/* Contenido principal */}
        <main className="lg:col-span-2 space-y-4">

          {/* Tabs */}
          <div style={{
            display: 'flex', gap: 4, background: '#111',
            border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 4,
          }}>
            {TABS.map(({ key, label }) => (
              <button key={key} onClick={() => setTab(key)} style={{
                flex: 1, padding: '9px 8px', borderRadius: 9, border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', transition: 'all .2s',
                background: tab === key ? '#1D9E75' : 'transparent',
                color: tab === key ? '#fff' : 'rgba(255,255,255,0.4)',
              }}>{label}</button>
            ))}
          </div>

          {/* ── TAB FEED ── */}
          {tab === 'feed' && (
            <>
              <Composer usuario={usuario} onPublicado={data => setFeed(p => [data, ...p])} />
              {cargando ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => (
                    <div key={i} style={{ height: 140, borderRadius: 12, background: 'rgba(255,255,255,0.03)', animation: 'pulse 1.5s ease-in-out infinite' }} />
                  ))}
                </div>
              ) : feed.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 24px', background: '#111', borderRadius: 12, border: '1px solid rgba(255,255,255,0.07)' }}>
                  <p style={{ fontSize: 40, marginBottom: 10 }}>🏃</p>
                  <p style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 18, color: '#fff', marginBottom: 6 }}>FEED VACÍO</p>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>Sigue a otros jugadores o publica algo.</p>
                  <Link to="/buscar" className="btn-primary text-sm">Buscar jugadores</Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {feed.map(pub => <TarjetaPublicacion key={pub.id} pub={pub} />)}
                </div>
              )}
            </>
          )}

          {/* ── TAB RETOS ── */}
          {tab === 'retos' && (
            <>
              {/* Encabezado retos */}
              <div style={{
                background: 'linear-gradient(135deg, #111 0%, #1a1a1a 100%)',
                border: '1px solid rgba(229,160,0,0.2)', borderRadius: 12, overflow: 'hidden',
              }}>
                <div style={{ height: 3, background: 'linear-gradient(to right, #e5a000, #f87171)' }} />
                <div style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.18em', color: '#e5a000', textTransform: 'uppercase' }}>
                      ⚔️ Feed de retos
                    </span>
                  </div>
                  <h2 style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 26, color: '#fff', letterSpacing: '0.04em', lineHeight: 1 }}>
                    RETOS DE LA COMUNIDAD
                  </h2>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
                    Los equipos se desafían. ¿Tu equipo aceptaría?
                  </p>
                </div>
              </div>

              {/* Publicar reto personal en el feed */}
              <Composer usuario={usuario} onPublicado={data => setFeed(p => [data, ...p])} />

              {/* Retos equipo vs equipo */}
              {cargando ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => (
                    <div key={i} style={{ height: 160, borderRadius: 12, background: 'rgba(255,255,255,0.03)', animation: 'pulse 1.5s ease-in-out infinite' }} />
                  ))}
                </div>
              ) : retos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 24px', background: '#111', borderRadius: 12, border: '1px solid rgba(229,160,0,0.15)' }}>
                  <p style={{ fontSize: 40, marginBottom: 10 }}>⚔️</p>
                  <p style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 18, color: '#fff', marginBottom: 6 }}>SIN RETOS AÚN</p>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>Forma un equipo y lanza el primero.</p>
                  <Link to="/equipos" className="btn-primary text-sm">Ver equipos</Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {retos.map(r => (
                    <TarjetaReto key={r.id} reto={r} mioEquipoId={miEquipoId} onResponder={cargar} />
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── TAB EVENTOS ── */}
          {tab === 'eventos' && (
            <>
              {cargando ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[1,2,3,4].map(i => (
                    <div key={i} style={{ height: 180, borderRadius: 12, background: 'rgba(255,255,255,0.03)', animation: 'pulse 1.5s ease-in-out infinite' }} />
                  ))}
                </div>
              ) : eventos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 24px', background: '#111', borderRadius: 12, border: '1px solid rgba(255,255,255,0.07)' }}>
                  <p style={{ fontSize: 40, marginBottom: 10 }}>📍</p>
                  <p style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 18, color: '#fff', marginBottom: 6 }}>SIN EVENTOS</p>
                  <Link to="/eventos/nuevo" className="btn-primary text-sm">Crear evento</Link>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {eventos.map(ev => (
                      <Link key={ev.id} to={`/eventos/${ev.id}`} style={{ textDecoration: 'none' }}>
                        <div style={{
                          background: '#111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12,
                          padding: 14, transition: 'border-color .2s',
                        }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(29,158,117,0.4)'}
                          onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'}
                        >
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                            <p style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 15, color: '#fff', letterSpacing: '0.02em', lineHeight: 1.2 }}>{ev.titulo}</p>
                            <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', padding: '3px 8px', borderRadius: 4, color: '#1D9E75', background: 'rgba(29,158,117,0.12)', border: '1px solid rgba(29,158,117,0.3)', flexShrink: 0 }}>{ev.deporte}</span>
                          </div>
                          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>📍 {ev.ciudad}</p>
                          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: 'JetBrains Mono, monospace' }}>
                            {ev.fecha_evento ? new Date(ev.fecha_evento).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                          </p>
                          <div style={{ marginTop: 10, height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ height: '100%', background: '#1D9E75', borderRadius: 2, width: `${Math.min(((ev.cupos_ocupados || 0) / (ev.cupos_total || 10)) * 100, 100)}%` }} />
                          </div>
                          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>{ev.cupos_ocupados || 0}/{ev.cupos_total || 10} jugadores</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <Link to="/eventos" style={{
                      display: 'inline-block', padding: '9px 24px', borderRadius: 8,
                      border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)',
                      textDecoration: 'none', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
                    }}>Ver todos los eventos →</Link>
                  </div>
                </>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
