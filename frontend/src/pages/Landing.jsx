import { Link } from 'react-router-dom';

// ── Design tokens ────────────────────────────────────────────
const T = {
  black:       '#0a0a0a',
  gray1:       '#111111',
  border:      'rgba(255,255,255,0.07)',
  muted:       'rgba(255,255,255,0.38)',
  dim:         'rgba(255,255,255,0.62)',
  white:       '#ffffff',
  emerald:     '#1D9E75',
  emeraldDark: '#0F6E56',
  emeraldDeep: '#074a3a',
  warm1:       '#f0c382',
  warm2:       '#d49960',
  warm3:       '#c97c4b',
};

const heroGradient = `
  radial-gradient(ellipse 88% 70% at 8% 50%,
    ${T.warm1} 0%, ${T.warm2} 22%, ${T.warm3}99 46%, transparent 68%),
  radial-gradient(ellipse 84% 80% at 94% 55%,
    ${T.emerald} 0%, ${T.emeraldDark}cc 28%, ${T.emeraldDeep}aa 52%, transparent 70%),
  linear-gradient(112deg, ${T.warm2} 0%, ${T.black} 42%, ${T.emeraldDeep} 100%)
`.replace(/\s+/g, ' ');

const PASOS = [
  { n: '01', titulo: 'Crea tu perfil', desc: 'Elige tu posición, tu deporte y conecta con jugadores cerca de ti.' },
  { n: '02', titulo: 'Únete o convoca', desc: 'Encuentra pichangas abiertas en el mapa o crea tu propio evento en segundos.' },
  { n: '03', titulo: 'Juega y sube', desc: 'Cada partido suma XP, medallas y posiciones en el ranking de tu ciudad.' },
];

const MODOS = [
  {
    emoji: '⚽', titulo: 'Pichanga', color: T.emerald,
    desc: 'Partido abierto. Cualquiera puede unirse, sin compromisos. El modo más popular.',
    tag: 'Casual',
  },
  {
    emoji: '⚔️', titulo: 'Reto', color: '#e5a000',
    desc: 'Un equipo desafía a otro. Acepta o pierde reputación. El honor está en juego.',
    tag: 'Competitivo',
  },
  {
    emoji: '🏆', titulo: 'Campeonato', color: '#e05353',
    desc: 'Torneos organizados con fixture automático, grupos y campeón oficial de la ciudad.',
    tag: 'Torneo',
  },
];

const FEATURES = [
  { icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7', titulo: 'Mapa de canchas', desc: 'Todas las canchas geolocalizadas. Encuentra una a menos de 10 minutos de ti.' },
  { icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', titulo: 'Ranking en vivo', desc: 'Tabla actualizada en tiempo real por ciudad, deporte y nivel. Sube o baja cada semana.' },
  { icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z', titulo: 'Calificaciones post-partido', desc: 'Al terminar el partido, los jugadores se califican entre sí. Tu reputación importa.' },
  { icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', titulo: 'Equipos y escudos', desc: 'Forma tu equipo, diseña tu escudo y reta a otros equipos de tu zona.' },
  { icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z', titulo: 'Sistema de XP y medallas', desc: 'Más de 30 acciones que dan XP. Cada partido, gol, asistencia y calificación suma.' },
  { icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9', titulo: 'Notificaciones en tiempo real', desc: 'Entérate cuando alguien te sigue, te reta o califica tu juego. Todo en la app.' },
];

const NIVELES = [
  { nivel: 'Rookie',     xp: '0 XP',     color: '#888888' },
  { nivel: 'Amateur',    xp: '100 XP',   color: '#9FE1CB' },
  { nivel: 'Intermedio', xp: '300 XP',   color: '#60a5fa' },
  { nivel: 'Avanzado',   xp: '600 XP',   color: '#a78bfa' },
  { nivel: 'Pro',        xp: '1 000 XP', color: '#fbbf24' },
  { nivel: 'Élite',      xp: '2 000 XP', color: '#f87171' },
  { nivel: 'Leyenda',    xp: '5 000 XP', color: '#fde68a' },
];

const STATS = [
  { valor: '12K+', label: 'Jugadores' },
  { valor: '1.2K', label: 'Canchas' },
  { valor: '48/día', label: 'Partidos' },
  { valor: '14', label: 'Ciudades' },
];

// ── Component ────────────────────────────────────────────────
export default function Landing() {
  return (
    <div style={{ background: T.black, color: T.white, fontFamily: 'Inter, system-ui, sans-serif', overflowX: 'hidden' }}>

      {/* ── NAV ──────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: 56, padding: '0 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(10,10,10,0.75)', backdropFilter: 'blur(20px) saturate(1.4)',
        borderBottom: `1px solid ${T.border}`,
      }}>
        <span style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 18, letterSpacing: '0.05em' }}>
          <span style={{ color: T.white }}>Street</span>
          <span style={{ color: T.emerald, fontStyle: 'italic' }}>Player</span>
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <div className="hidden md:flex" style={{ gap: 24 }}>
            {['Eventos', 'Ranking', 'Torneos'].map(l => (
              <a key={l} href={`#${l.toLowerCase()}`}
                style={{ color: T.muted, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', textDecoration: 'none', transition: 'color .2s' }}
                onMouseEnter={e => e.target.style.color = T.white}
                onMouseLeave={e => e.target.style.color = T.muted}
              >{l}</a>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link to="/login" style={{
              color: T.muted, fontSize: 11, fontWeight: 700,
              padding: '7px 16px', border: `1px solid ${T.border}`, borderRadius: 6,
              textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.1em',
              transition: 'all .2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.emerald; e.currentTarget.style.color = T.white; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.muted; }}
            >Entrar</Link>
            <Link to="/registro" style={{
              background: T.emerald, color: T.white, fontSize: 11, fontWeight: 700,
              padding: '7px 18px', borderRadius: 6, textDecoration: 'none',
              textTransform: 'uppercase', letterSpacing: '0.1em',
            }}>Únete</Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────── */}
      <section style={{
        position: 'relative', minHeight: '100vh', overflow: 'hidden',
        background: heroGradient, display: 'flex', alignItems: 'center',
      }}>

        {/* Grain / textura */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23g)' opacity='0.045'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px', opacity: 0.45,
        }} />

        {/* Líneas de cancha — muy sutiles */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.045, pointerEvents: 'none', zIndex: 1 }} viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
          <line x1="600" y1="0" x2="600" y2="800" stroke="#fff" strokeWidth="1.5"/>
          <circle cx="600" cy="400" r="115" fill="none" stroke="#fff" strokeWidth="1.5"/>
          <circle cx="600" cy="400" r="4" fill="#fff"/>
          <rect x="0" y="215" width="175" height="370" fill="none" stroke="#fff" strokeWidth="1.5"/>
          <rect x="1025" y="215" width="175" height="370" fill="none" stroke="#fff" strokeWidth="1.5"/>
          <rect x="0" y="290" width="62" height="220" fill="none" stroke="#fff" strokeWidth="1.5"/>
          <rect x="1138" y="290" width="62" height="220" fill="none" stroke="#fff" strokeWidth="1.5"/>
        </svg>

        {/* Atleta */}
        <div style={{
          position: 'absolute', right: '-5%', bottom: 0,
          width: 'min(68vw, 980px)', height: '100%',
          pointerEvents: 'none', overflow: 'hidden', zIndex: 2,
        }}>
          <img
            src="/hero-athlete.png"
            alt="Jugador StreetPlayer"
            style={{
              width: '100%', height: '100%',
              objectFit: 'cover', objectPosition: 'left center',
              mixBlendMode: 'screen',
            }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(10,10,10,0.9) 0%, rgba(10,10,10,0.35) 18%, transparent 44%)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,10,10,0.96) 0%, transparent 28%)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(10,10,10,0.55) 0%, transparent 18%)' }} />
        </div>

        {/* Contenido hero */}
        <div style={{
          position: 'relative', zIndex: 10, width: '100%',
          maxWidth: 1240, margin: '0 auto', padding: '80px 48px',
        }}>
          <div style={{ maxWidth: 510 }}>

            {/* Eyebrow broadcast */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 26, animation: 'fadeUp .6s ease both' }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%', background: T.emerald, flexShrink: 0,
                animation: 'livePulse 2.2s ease-in-out infinite',
                boxShadow: `0 0 0 3px ${T.emerald}2a, 0 0 14px ${T.emerald}77`,
              }} />
              <span style={{ fontFamily: 'JetBrains Mono, Courier New, monospace', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.2em', color: T.emerald, textTransform: 'uppercase' }}>
                EN VIVO · PERÚ
              </span>
              <span style={{ width: 1, height: 12, background: T.border }} />
              <span style={{ fontFamily: 'JetBrains Mono, Courier New, monospace', fontSize: 9.5, color: T.muted, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                JUEGA · RANKEA · DOMINA
              </span>
            </div>

            {/* Headline */}
            <h1 style={{
              fontFamily: 'Anton, Impact, Arial Black, sans-serif',
              fontSize: 'clamp(52px, 8vw, 138px)',
              lineHeight: 0.88, fontWeight: 400, margin: '0 0 24px',
              textTransform: 'none', letterSpacing: '-0.01em',
              animation: 'fadeUp .7s .05s ease both',
            }}>
              <span style={{ color: T.white, display: 'block' }}>La calle</span>
              <span style={{ color: T.white, display: 'block' }}>ya tiene</span>
              <em style={{ color: T.emerald, fontStyle: 'italic', display: 'block' }}>ranking</em>
              <em style={{ color: T.emerald, fontStyle: 'italic', display: 'block' }}>propio.</em>
            </h1>

            <p style={{
              color: T.dim, fontSize: 15, lineHeight: 1.75, maxWidth: 390,
              marginBottom: 36, animation: 'fadeUp .7s .18s ease both',
            }}>
              La red social deportiva para jugadores de calle. Organiza pichangas, sube XP y domina el ranking de tu ciudad.
            </p>

            {/* CTAs */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', animation: 'fadeUp .7s .28s ease both' }}>
              <Link to="/registro" style={{
                background: T.emerald, color: T.white, fontWeight: 700, fontSize: 13,
                padding: '14px 32px', borderRadius: 8, textDecoration: 'none',
                textTransform: 'uppercase', letterSpacing: '0.1em',
                boxShadow: `0 4px 28px ${T.emerald}44`,
                transition: 'transform .15s, box-shadow .15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 36px ${T.emerald}55`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 4px 28px ${T.emerald}44`; }}
              >Crear cuenta gratis</Link>
              <Link to="/login" style={{
                border: `1.5px solid rgba(255,255,255,0.18)`, color: T.white, fontWeight: 600,
                fontSize: 13, padding: '14px 24px', borderRadius: 8, textDecoration: 'none',
                textTransform: 'uppercase', letterSpacing: '0.08em',
                background: 'rgba(10,10,10,0.28)', backdropFilter: 'blur(8px)',
                transition: 'border-color .2s',
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = T.emerald}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'}
              >Iniciar sesión</Link>
            </div>

            {/* Stats inline */}
            <div style={{
              display: 'flex', gap: 36, marginTop: 52, flexWrap: 'wrap',
              animation: 'fadeUp .7s .38s ease both',
            }}>
              {STATS.map(({ valor, label }) => (
                <div key={label}>
                  <p style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 30, color: T.white, lineHeight: 1, marginBottom: 3 }}>{valor}</p>
                  <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: T.muted }}>{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Label vertical broadcast derecha */}
        <div className="hidden md:flex" style={{
          position: 'absolute', right: 22, top: '50%', transform: 'translateY(-50%)',
          flexDirection: 'column', alignItems: 'center', gap: 8, zIndex: 10,
        }}>
          <div style={{ width: 1, height: 44, background: T.border }} />
          <span style={{ writingMode: 'vertical-rl', fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', color: T.muted, textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>LIMA · LIVE</span>
          <span style={{ width: 4, height: 4, borderRadius: '50%', background: T.emerald }} />
          <span style={{ writingMode: 'vertical-rl', fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', color: T.emerald, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase' }}>RANKING #042</span>
          <div style={{ width: 1, height: 44, background: T.border }} />
        </div>

        {/* Scroll cue */}
        <div style={{
          position: 'absolute', bottom: 26, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
          zIndex: 10, animation: 'scrollBounce 2.8s ease-in-out infinite',
        }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, fontWeight: 700, letterSpacing: '0.2em', color: T.muted, textTransform: 'uppercase' }}>scroll</span>
          <svg width={14} height={14} fill="none" stroke={T.muted} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* ── CÓMO FUNCIONA ────────────────────────────────── */}
      <section id="eventos" style={{ padding: '88px 48px', background: T.black, borderTop: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>

          {/* Separator label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 52 }}>
            <div style={{ flex: 1, height: 1, background: T.border }} />
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.22em', color: T.emerald, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>— Cómo funciona —</span>
            <div style={{ flex: 1, height: 1, background: T.border }} />
          </div>

          {/* Steps grid — hairline borders */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1px', background: T.border, border: `1px solid ${T.border}` }}>
            {PASOS.map(({ n, titulo, desc }) => (
              <div key={n} style={{
                background: T.black, padding: '44px 36px', position: 'relative', overflow: 'hidden',
                transition: 'background .25s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = '#0f0f0f'}
                onMouseLeave={e => e.currentTarget.style.background = T.black}
              >
                <span style={{
                  position: 'absolute', top: -10, right: 10,
                  fontFamily: 'Anton, Impact, sans-serif', fontSize: 110, lineHeight: 1,
                  color: 'rgba(29,158,117,0.05)', userSelect: 'none', pointerEvents: 'none',
                }}>{n}</span>
                <div style={{ position: 'relative' }}>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 700, color: T.emerald, letterSpacing: '0.18em', display: 'block', marginBottom: 14 }}>{n} /</span>
                  <h3 style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 24, fontWeight: 400, color: T.white, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: 1.1 }}>{titulo}</h3>
                  <p style={{ color: T.muted, fontSize: 13.5, lineHeight: 1.72 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MODOS DE JUEGO ───────────────────────────────── */}
      <section style={{ padding: '88px 48px', background: T.gray1, borderTop: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 52 }}>
            <div style={{ flex: 1, height: 1, background: T.border }} />
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.22em', color: T.emerald, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>— Modos de juego —</span>
            <div style={{ flex: 1, height: 1, background: T.border }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1px', background: T.border, border: `1px solid ${T.border}` }}>
            {MODOS.map(({ emoji, titulo, color, desc, tag }) => (
              <div key={titulo} style={{
                background: T.gray1, padding: '44px 36px', position: 'relative',
                transition: 'background .25s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = '#161616'}
                onMouseLeave={e => e.currentTarget.style.background = T.gray1}
              >
                {/* Accent top bar */}
                <div style={{ position: 'absolute', top: 0, left: 36, width: 40, height: 2, background: color, boxShadow: `0 0 12px ${color}88` }} />

                <div style={{ fontSize: 40, marginBottom: 20, lineHeight: 1 }}>{emoji}</div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <h3 style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 26, fontWeight: 400, color: T.white, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{titulo}</h3>
                  <span style={{
                    fontFamily: 'JetBrains Mono, monospace', fontSize: 9, fontWeight: 700,
                    padding: '3px 8px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.12em',
                    border: `1px solid ${color}55`, color: color, background: `${color}12`,
                  }}>{tag}</span>
                </div>
                <p style={{ color: T.muted, fontSize: 13.5, lineHeight: 1.72 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────── */}
      <section style={{ padding: '88px 48px', background: T.black, borderTop: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 52 }}>
            <div style={{ flex: 1, height: 1, background: T.border }} />
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.22em', color: T.emerald, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>— Por qué StreetPlayer —</span>
            <div style={{ flex: 1, height: 1, background: T.border }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1px', background: T.border, border: `1px solid ${T.border}` }}>
            {FEATURES.map(({ icon, titulo, desc }) => (
              <div key={titulo} style={{
                background: T.black, padding: '36px 32px',
                display: 'flex', gap: 20, alignItems: 'flex-start',
                transition: 'background .25s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = '#0d0d0d'}
                onMouseLeave={e => e.currentTarget.style.background = T.black}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 8, flexShrink: 0,
                  background: `${T.emerald}14`, border: `1px solid ${T.emerald}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width={18} height={18} fill="none" stroke={T.emerald} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={icon} />
                  </svg>
                </div>
                <div>
                  <h4 style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 17, fontWeight: 400, color: T.white, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>{titulo}</h4>
                  <p style={{ color: T.muted, fontSize: 13, lineHeight: 1.7 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SISTEMA XP / NIVELES ──────────────────────────── */}
      <section style={{ padding: '88px 48px', background: T.gray1, borderTop: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 16 }}>
            <div style={{ flex: 1, height: 1, background: T.border }} />
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.22em', color: T.emerald, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>— Sistema de niveles —</span>
            <div style={{ flex: 1, height: 1, background: T.border }} />
          </div>

          <p style={{ textAlign: 'center', color: T.muted, fontSize: 13.5, marginBottom: 44 }}>
            Cada partido, gol, asistencia y calificación suma XP. Sube de nivel y domina el ranking de tu ciudad.
          </p>

          {/* Barra de progresión */}
          <div style={{ display: 'flex', gap: '1px', background: T.border, border: `1px solid ${T.border}`, marginBottom: 2 }}>
            {NIVELES.map(({ nivel, xp, color }, i) => (
              <div key={nivel} style={{
                flex: 1, background: T.gray1, padding: '28px 16px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                position: 'relative', transition: 'background .25s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = '#161616'}
                onMouseLeave={e => e.currentTarget.style.background = T.gray1}
              >
                {/* Top color bar per level */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: color, opacity: i === 6 ? 1 : 0.7 }} />

                {/* Hexagon-ish icon */}
                <div style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: `${color}18`, border: `1px solid ${color}44`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}88` }} />
                </div>

                <p style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 13, fontWeight: 400, color, textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center', lineHeight: 1.1 }}>{nivel}</p>
                <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: T.muted, letterSpacing: '0.1em' }}>{xp}</p>
              </div>
            ))}
          </div>

          {/* Arrow progression line */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '10px 8px', gap: 4 }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: T.muted, letterSpacing: '0.14em', textTransform: 'uppercase', marginRight: 8 }}>Progresión →</span>
            <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${T.border}, ${T.emerald}55, #fde68a55)` }} />
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#fde68a', letterSpacing: '0.1em', marginLeft: 8 }}>+30 acciones dan XP</span>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section id="ranking" style={{
        padding: '96px 48px', position: 'relative', overflow: 'hidden',
        background: T.gray1, borderTop: `1px solid ${T.border}`,
      }}>
        {/* Glow radial de estadio */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: `radial-gradient(ellipse 65% 85% at 50% 50%, ${T.emerald}16 0%, ${T.emeraldDeep}08 42%, transparent 68%)`,
        }} />
        {/* Accent bar top */}
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 72, height: 2, background: T.emerald, boxShadow: `0 0 20px ${T.emerald}aa` }} />

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 680, margin: '0 auto' }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.22em', color: T.emerald, textTransform: 'uppercase', display: 'block', marginBottom: 18 }}>
            ⚽ Tu rival está a 200 metros
          </span>

          <h2 style={{
            fontFamily: 'Anton, Impact, sans-serif',
            fontSize: 'clamp(46px, 7vw, 100px)',
            fontWeight: 400, color: T.white,
            margin: '0 0 14px', lineHeight: 0.9, letterSpacing: '0.02em',
          }}>
            ¿LISTO PARA<br />
            <em style={{ color: T.emerald, fontStyle: 'italic' }}>JUGAR?</em>
          </h2>

          <p style={{ color: T.muted, fontSize: 15, marginBottom: 38, lineHeight: 1.7 }}>
            No lo hagas esperar. Tu cancha, tu ranking, tu calle.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/registro" style={{
              background: T.emerald, color: T.white, fontWeight: 700, fontSize: 13,
              padding: '15px 40px', borderRadius: 8, textDecoration: 'none',
              textTransform: 'uppercase', letterSpacing: '0.1em',
              boxShadow: `0 4px 32px ${T.emerald}55`,
              transition: 'transform .15s, box-shadow .15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 10px 40px ${T.emerald}66`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 4px 32px ${T.emerald}55`; }}
            >Empieza ahora — es gratis</Link>
            <Link to="/login" style={{
              border: `1.5px solid ${T.border}`, color: T.dim, fontWeight: 600,
              fontSize: 13, padding: '15px 28px', borderRadius: 8, textDecoration: 'none',
              textTransform: 'uppercase', letterSpacing: '0.08em',
              transition: 'border-color .2s',
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = T.emerald}
              onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
            >Ya tengo cuenta</Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────── */}
      <footer style={{
        background: '#080808', borderTop: `1px solid ${T.border}`,
        padding: '28px 48px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
      }}>
        <span style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 16, letterSpacing: '0.05em' }}>
          <span style={{ color: T.white }}>Street</span>
          <span style={{ color: T.emerald, fontStyle: 'italic' }}>Player</span>
          <span style={{ fontFamily: 'Inter, sans-serif', fontStyle: 'normal', fontSize: 11, color: T.muted, marginLeft: 10, fontWeight: 400, letterSpacing: 0 }}>Perú 🇵🇪</span>
        </span>

        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {[['Ingresar', '/login'], ['Registrarse', '/registro']].map(([l, to]) => (
            <Link key={l} to={to} style={{ color: T.muted, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', textDecoration: 'none', transition: 'color .2s' }}
              onMouseEnter={e => e.target.style.color = T.white}
              onMouseLeave={e => e.target.style.color = T.muted}
            >{l}</Link>
          ))}
          {[['Eventos', '#eventos'], ['Ranking', '#ranking']].map(([l, h]) => (
            <a key={l} href={h} style={{ color: T.muted, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', textDecoration: 'none', transition: 'color .2s' }}
              onMouseEnter={e => e.target.style.color = T.white}
              onMouseLeave={e => e.target.style.color = T.muted}
            >{l}</a>
          ))}
        </div>

        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'rgba(255,255,255,0.14)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          JUEGA · RANKEA · DOMINA
        </span>
      </footer>

      {/* ── Animations ───────────────────────────────────── */}
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes livePulse {
          0%, 100% { box-shadow: 0 0 0 3px rgba(29,158,117,0.22), 0 0 14px rgba(29,158,117,0.5); }
          50%       { box-shadow: 0 0 0 5px rgba(29,158,117,0.07), 0 0 22px rgba(29,158,117,0.25); }
        }
        @keyframes scrollBounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50%       { transform: translateX(-50%) translateY(7px); }
        }
        @media (max-width: 768px) {
          .hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}
