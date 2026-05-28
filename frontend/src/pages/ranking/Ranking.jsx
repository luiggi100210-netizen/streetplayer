import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const DEPORTES = ['', 'futbol', 'basquet', 'tenis', 'padel', 'voley', 'running', 'ciclismo'];

const COLORES_NIVEL = {
  rookie: '#888', amateur: '#9FE1CB', intermedio: '#60a5fa',
  avanzado: '#a78bfa', pro: '#fbbf24', elite: '#f87171', leyenda: '#fde68a',
};

const PODIO = [
  { pos: 0, height: 110, medal: '🥇', color: '#fbbf24', shadow: '#fbbf2444' },
  { pos: 1, height: 80,  medal: '🥈', color: '#9ca3af', shadow: '#9ca3af33' },
  { pos: 2, height: 60,  medal: '🥉', color: '#d97706', shadow: '#d9770633' },
];

function Avatar({ foto, username, size = 40, color = '#1D9E75' }) {
  return foto ? (
    <img src={foto} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${color}`, flexShrink: 0 }} alt="" />
  ) : (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: color + '22', border: `2px solid ${color}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Anton, Impact, sans-serif', fontSize: size * 0.38, color,
    }}>
      {username?.[0]?.toUpperCase()}
    </div>
  );
}

export default function Ranking() {
  const { usuario: yo } = useAuth();
  const [ranking,  setRanking]  = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtros,  setFiltros]  = useState({ deporte: '', ciudad: '' });

  useEffect(() => {
    const cargar = async () => {
      setCargando(true);
      try {
        const params = new URLSearchParams();
        if (filtros.deporte) params.set('deporte', filtros.deporte);
        if (filtros.ciudad)  params.set('ciudad',  filtros.ciudad);
        const { data } = await api.get(`/ranking?${params}`);
        setRanking(data);
      } catch {}
      setCargando(false);
    };
    cargar();
  }, [filtros]);

  const top3 = ranking.slice(0, 3);
  const resto = ranking.slice(3);
  const miPos = yo ? ranking.findIndex(r => r.usuario_id === yo.id) : -1;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">

      {/* ── HEADER ── */}
      <div className="rounded-xl overflow-hidden border border-sp-border bg-sp-card" style={{
        background: 'linear-gradient(135deg, #111 0%, #1a1a1a 60%, #0f0f0f 100%)',
      }}>
        {/* Accent bar */}
        <div style={{ height: 4, background: 'linear-gradient(to right, #fbbf24, #1D9E75, #a78bfa)' }} />

        <div className="px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span style={{
                width: 7, height: 7, borderRadius: '50%', background: '#1D9E75', flexShrink: 0,
                boxShadow: '0 0 10px #1D9E7577', animation: 'rankPulse 2s ease-in-out infinite',
                display: 'inline-block',
              }} />
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', color: '#1D9E75', textTransform: 'uppercase' }}>
                EN VIVO · ACTUALIZACIÓN SEMANAL
              </span>
            </div>
            <h1 style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 'clamp(28px, 5vw, 48px)', color: '#fff', letterSpacing: '0.04em', lineHeight: 1 }}>
              RANKING GLOBAL
            </h1>
            <p className="text-sp-muted text-sm mt-1">Los mejores jugadores de la comunidad</p>
          </div>

          {/* Mi posición */}
          {miPos >= 0 && (
            <div style={{
              background: '#1D9E7515', border: '1px solid #1D9E7540',
              borderRadius: 10, padding: '10px 20px', textAlign: 'center',
            }}>
              <p style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 32, color: '#1D9E75', lineHeight: 1 }}>#{miPos + 1}</p>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.4)' }}>Tu posición</p>
            </div>
          )}
        </div>

        {/* Filtros */}
        <div className="px-6 pb-5 flex flex-wrap gap-2 items-center border-t border-sp-border pt-4">
          <div className="flex flex-wrap gap-2 flex-1">
            {DEPORTES.map(d => (
              <button key={d || 'todos'} onClick={() => setFiltros(p => ({ ...p, deporte: d }))}
                className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full transition-colors capitalize"
                style={{
                  background: filtros.deporte === d ? '#1D9E75' : 'rgba(255,255,255,0.06)',
                  color: filtros.deporte === d ? '#fff' : 'rgba(255,255,255,0.45)',
                  border: `1px solid ${filtros.deporte === d ? '#1D9E75' : 'rgba(255,255,255,0.08)'}`,
                }}>
                {d || 'Global'}
              </button>
            ))}
          </div>
          <input
            value={filtros.ciudad}
            onChange={e => setFiltros(p => ({ ...p, ciudad: e.target.value }))}
            placeholder="Ciudad..."
            className="input text-sm"
            style={{ width: 130 }}
          />
        </div>
      </div>

      {/* ── PODIO TOP 3 ── */}
      {!cargando && top3.length >= 3 && (
        <div className="card overflow-hidden p-0" style={{
          background: 'linear-gradient(160deg, #0f0f0f 0%, #111 40%, #0d0d0d 100%)',
        }}>
          <div style={{ padding: '32px 24px 0', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 8 }}>
            {/* Reorden: 2 - 1 - 3 para el podio */}
            {[PODIO[1], PODIO[0], PODIO[2]].map(({ pos, height, medal, color, shadow }) => {
              const item = top3[pos];
              if (!item) return null;
              const colorNivel = COLORES_NIVEL[item.nivel_xp] || '#888';
              const esTuyo = item.usuario_id === yo?.id;
              return (
                <Link key={item.usuario_id} to={`/perfil/${item.usuario_id}`}
                  style={{ flex: 1, maxWidth: 220, textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

                  {/* Info jugador */}
                  <div style={{ textAlign: 'center', marginBottom: 12, padding: '0 8px' }}>
                    <div style={{ position: 'relative', display: 'inline-block', marginBottom: 8 }}>
                      <Avatar foto={item.foto_url} username={item.username} size={pos === 0 ? 72 : 56} color={color} />
                      <span style={{
                        position: 'absolute', bottom: -4, right: -4,
                        background: '#0a0a0a', borderRadius: '50%', fontSize: pos === 0 ? 22 : 16,
                        width: pos === 0 ? 30 : 24, height: pos === 0 ? 30 : 24,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: `1px solid ${color}44`,
                      }}>{medal}</span>
                    </div>

                    <p style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: pos === 0 ? 16 : 13, color: '#fff', letterSpacing: '0.04em', marginBottom: 2 }}>
                      {item.nombre || item.username}
                    </p>
                    {esTuyo && <span style={{ fontSize: 9, fontWeight: 700, color: '#1D9E75', letterSpacing: '0.14em', textTransform: 'uppercase' }}>tú</span>}
                    <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em' }}>
                      {item.ciudad || '—'}
                    </p>

                    <p style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: pos === 0 ? 26 : 20, color, lineHeight: 1, marginTop: 6 }}>
                      {item.puntos}
                    </p>
                    <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'rgba(255,255,255,0.3)' }}>pts</p>
                  </div>

                  {/* Bloque del podio */}
                  <div style={{
                    width: '100%', height, borderRadius: '8px 8px 0 0',
                    background: `linear-gradient(to bottom, ${color}22, ${color}08)`,
                    border: `1px solid ${color}33`, borderBottom: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: `0 -4px 24px ${shadow}`,
                  }}>
                    <span style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 32, color: color + '44' }}>
                      #{pos + 1}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TABLA RANKING ── */}
      <div className="card p-0 overflow-hidden">
        {/* Header tabla */}
        <div style={{
          display: 'grid', gridTemplateColumns: '48px 1fr 90px 70px 70px 80px',
          padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)',
          background: '#0a0a0a',
        }}>
          {['#', 'Jugador', 'Partidos', 'Victorias', 'Goles', 'Puntos'].map((h, i) => (
            <span key={h} style={{
              fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em',
              color: 'rgba(255,255,255,0.3)', textAlign: i > 1 ? 'center' : 'left',
            }}>{h}</span>
          ))}
        </div>

        {cargando ? (
          <div className="space-y-px">
            {[1,2,3,4,5,6,7,8].map(i => (
              <div key={i} className="animate-pulse" style={{ height: 56, background: 'rgba(255,255,255,0.02)' }} />
            ))}
          </div>
        ) : ranking.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🏆</p>
            <p className="text-sp-muted text-sm">No hay datos de ranking aún</p>
          </div>
        ) : (
          <div>
            {ranking.map((item, i) => {
              const colorNivel = COLORES_NIVEL[item.nivel_xp] || '#888';
              const esTuyo = item.usuario_id === yo?.id;
              const posColor = i === 0 ? '#fbbf24' : i === 1 ? '#9ca3af' : i === 2 ? '#d97706' : 'rgba(255,255,255,0.25)';

              return (
                <Link key={item.usuario_id} to={`/perfil/${item.usuario_id}`}
                  style={{
                    display: 'grid', gridTemplateColumns: '48px 1fr 90px 70px 70px 80px',
                    padding: '10px 16px', textDecoration: 'none', alignItems: 'center',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    background: esTuyo ? 'rgba(29,158,117,0.06)' : 'transparent',
                    transition: 'background .15s',
                  }}
                  onMouseEnter={e => { if (!esTuyo) e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; }}
                  onMouseLeave={e => { if (!esTuyo) e.currentTarget.style.background = 'transparent'; }}
                >
                  {/* Posición */}
                  <span style={{
                    fontFamily: 'Anton, Impact, sans-serif', fontSize: i < 3 ? 18 : 14,
                    color: posColor, textAlign: 'left',
                    textShadow: i < 3 ? `0 0 12px ${posColor}66` : 'none',
                  }}>
                    {i < 3 ? ['🥇','🥈','🥉'][i] : `#${i + 1}`}
                  </span>

                  {/* Jugador */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <Avatar foto={item.foto_url} username={item.username} size={36} color={colorNivel} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 14, color: '#fff', letterSpacing: '0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.nombre || item.username}
                        </span>
                        {esTuyo && (
                          <span style={{ fontSize: 9, fontWeight: 700, color: '#1D9E75', letterSpacing: '0.12em', textTransform: 'uppercase', flexShrink: 0 }}>tú</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.04em' }}>@{item.username}</span>
                        {item.ciudad && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>· {item.ciudad}</span>}
                        <span style={{
                          fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 4,
                          textTransform: 'uppercase', letterSpacing: '0.1em',
                          border: `1px solid ${colorNivel}44`, color: colorNivel, background: colorNivel + '14',
                        }}>{item.nivel_xp || 'rookie'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Partidos */}
                  <span style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 16, color: '#fff', textAlign: 'center' }}>
                    {item.victorias + (item.derrotas || 0) + (item.empates || 0) || item.partidos_jugados || 0}
                  </span>

                  {/* Victorias */}
                  <span style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 16, color: '#1D9E75', textAlign: 'center' }}>
                    {item.victorias || 0}
                  </span>

                  {/* Goles */}
                  <span style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 16, color: '#fbbf24', textAlign: 'center' }}>
                    {item.goles_totales || 0}
                  </span>

                  {/* Puntos */}
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 20, color: posColor, lineHeight: 1 }}>
                      {item.puntos}
                    </span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block' }}>pts</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes rankPulse {
          0%, 100% { box-shadow: 0 0 0 3px rgba(29,158,117,0.2), 0 0 10px rgba(29,158,117,0.5); }
          50%       { box-shadow: 0 0 0 5px rgba(29,158,117,0.06), 0 0 18px rgba(29,158,117,0.25); }
        }
      `}</style>
    </div>
  );
}
