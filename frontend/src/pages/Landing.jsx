import { Link } from 'react-router-dom';

const STATS = [
  { valor: '1.2K+', label: 'Jugadores' },
  { valor: '340',   label: 'Partidos' },
  { valor: '28',    label: 'Torneos' },
  { valor: '15',    label: 'Ciudades' },
];

const COMO_FUNCIONA = [
  { paso: '01', titulo: 'CREA TU PERFIL', desc: 'Regístrate, elige tu posición y conecta con jugadores cerca de ti.' },
  { paso: '02', titulo: 'ÚNETE O CREA', desc: 'Encuentra pichangas abiertas en el mapa o crea tu propio evento en minutos.' },
  { paso: '03', titulo: 'JUEGA Y SUBE', desc: 'Cada partido suma XP, medallas y posiciones en el ranking nacional.' },
];

const TIPOS = [
  { emoji: '⚽', titulo: 'PICHANGA', color: '#1D9E75', desc: 'Partido abierto, cualquier puede unirse.' },
  { emoji: '⚔️', titulo: 'RETO',     color: '#e5a000', desc: 'Un equipo reta a otro. Acepta o pierde reputación.' },
  { emoji: '🏆', titulo: 'CAMPEONATO', color: '#c0392b', desc: 'Torneos organizados, fixture automático y campeón oficial.' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-sp-bg text-white">
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-sp-bg/90 backdrop-blur border-b border-sp-border">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <span className="font-impact text-xl tracking-wider">
            <span className="text-white">STREET</span>
            <span className="text-sp-green">PLAYER</span>
          </span>
          <div className="hidden md:flex items-center gap-6 text-sm text-sp-muted uppercase tracking-wider font-semibold">
            <a href="#eventos" className="hover:text-white transition-colors">Eventos</a>
            <a href="#ranking" className="hover:text-white transition-colors">Ranking</a>
            <a href="#torneos" className="hover:text-white transition-colors">Torneos</a>
          </div>
          <Link to="/registro" className="btn-outline text-xs py-2 px-4">
            ÚNETE AHORA
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-16">
        {/* Fondo con cancha */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Líneas de cancha SVG */}
          <svg className="w-full h-full opacity-5" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
            <rect x="50" y="50" width="700" height="500" fill="none" stroke="#1D9E75" strokeWidth="2"/>
            <line x1="400" y1="50" x2="400" y2="550" stroke="#1D9E75" strokeWidth="2"/>
            <circle cx="400" cy="300" r="80" fill="none" stroke="#1D9E75" strokeWidth="2"/>
            <rect x="50" y="175" width="130" height="250" fill="none" stroke="#1D9E75" strokeWidth="2"/>
            <rect x="620" y="175" width="130" height="250" fill="none" stroke="#1D9E75" strokeWidth="2"/>
            <rect x="50" y="230" width="60" height="140" fill="none" stroke="#1D9E75" strokeWidth="2"/>
            <rect x="690" y="230" width="60" height="140" fill="none" stroke="#1D9E75" strokeWidth="2"/>
          </svg>
          {/* Gradiente radial verde sutil */}
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(ellipse 60% 40% at 50% 60%, rgba(29,158,117,0.08) 0%, transparent 70%)',
          }} />
        </div>

        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 border border-sp-green/40 bg-sp-green/10 text-sp-green text-xs uppercase tracking-widest px-4 py-1.5 rounded-full mb-8 font-semibold">
            <span className="w-1.5 h-1.5 bg-sp-green rounded-full animate-pulse" />
            Perú → Latinoamérica → Mundial
          </div>

          {/* Título */}
          <h1 className="font-impact text-7xl md:text-9xl leading-none mb-4 text-white drop-shadow-lg">
            JUEGA.
            <br />
            <span className="text-sp-green">RANKEA.</span>
            <br />
            DOMINA.
          </h1>

          <p className="text-sp-muted text-lg md:text-xl max-w-xl mx-auto mb-10 font-sans">
            La red social deportiva para jugadores de calle. Organiza pichangas, sube XP y domina el ranking de tu ciudad.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/registro" className="btn-primary text-base px-8 py-3">
              CREAR CUENTA GRATIS
            </Link>
            <Link to="/login" className="btn-outline text-base px-8 py-3">
              VER PARTIDOS CERCA
            </Link>
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative z-10 w-full max-w-4xl mx-auto px-4 mt-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {STATS.map(({ valor, label }) => (
              <div key={label} className="text-center border border-sp-border bg-sp-card/60 rounded-xl py-4 backdrop-blur">
                <p className="font-impact text-3xl text-sp-green">{valor}</p>
                <p className="text-sp-muted text-xs uppercase tracking-widest mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-sp-muted">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* TIPOS DE EVENTO */}
      <section id="eventos" className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <p className="text-sp-green text-xs uppercase tracking-widest text-center mb-3 font-semibold">Modos de juego</p>
          <h2 className="text-4xl md:text-5xl text-center mb-12">ELIGE TU MODO</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TIPOS.map(({ emoji, titulo, color, desc }) => (
              <div key={titulo} className="card hover:border-sp-green/50 transition-all group cursor-pointer">
                <div className="text-5xl mb-4">{emoji}</div>
                <h3 className="font-impact text-xl mb-2" style={{ color }}>{titulo}</h3>
                <p className="text-sp-muted text-sm leading-relaxed">{desc}</p>
                <div className="mt-4 h-0.5 bg-sp-border group-hover:bg-sp-green transition-colors" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section className="py-24 px-4 bg-sp-card border-y border-sp-border">
        <div className="max-w-5xl mx-auto">
          <p className="text-sp-green text-xs uppercase tracking-widest text-center mb-3 font-semibold">Simple</p>
          <h2 className="text-4xl md:text-5xl text-center mb-16">CÓMO FUNCIONA</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {COMO_FUNCIONA.map(({ paso, titulo, desc }) => (
              <div key={paso} className="relative">
                <p className="font-impact text-7xl text-sp-green/10 absolute -top-4 -left-2 select-none">{paso}</p>
                <div className="relative">
                  <p className="text-sp-green text-xs uppercase tracking-widest mb-2 font-semibold">{paso}</p>
                  <h3 className="font-impact text-xl mb-3">{titulo}</h3>
                  <p className="text-sp-muted text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RANKING PREVIEW */}
      <section id="ranking" className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <p className="text-sp-green text-xs uppercase tracking-widest text-center mb-3 font-semibold">Gamificación</p>
          <h2 className="text-4xl md:text-5xl text-center mb-4">SISTEMA DE XP</h2>
          <p className="text-sp-muted text-center mb-12 max-w-lg mx-auto">Cada acción suma puntos. Sube de nivel, desbloquea medallas y escala el ranking de tu ciudad.</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { nivel: 'ROOKIE',     xp: '0 XP',    color: '#888' },
              { nivel: 'AMATEUR',    xp: '100 XP',  color: '#9FE1CB' },
              { nivel: 'INTERMEDIO', xp: '300 XP',  color: '#60a5fa' },
              { nivel: 'AVANZADO',   xp: '600 XP',  color: '#a78bfa' },
              { nivel: 'PRO',        xp: '1000 XP', color: '#fbbf24' },
              { nivel: 'ÉLITE',      xp: '2000 XP', color: '#f87171' },
              { nivel: 'LEYENDA',    xp: '5000 XP', color: '#fde68a' },
            ].map(({ nivel, xp, color }) => (
              <div key={nivel} className="card text-center py-3">
                <p className="font-impact text-base" style={{ color }}>{nivel}</p>
                <p className="text-xs text-sp-muted mt-1">{xp}</p>
              </div>
            ))}
            <div className="card text-center py-3 border-sp-green/30 bg-sp-green/5 flex flex-col items-center justify-center">
              <p className="text-sp-green text-xs font-semibold uppercase tracking-wider">+30 acciones<br/>que dan XP</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-24 px-4 bg-sp-green relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg viewBox="0 0 800 300" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
            <line x1="400" y1="0" x2="400" y2="300" stroke="white" strokeWidth="3"/>
            <circle cx="400" cy="150" r="80" fill="none" stroke="white" strokeWidth="3"/>
          </svg>
        </div>
        <div className="relative z-10 text-center max-w-2xl mx-auto">
          <h2 className="font-impact text-5xl md:text-6xl text-white mb-4">
            ¿LISTO PARA JUGAR?
          </h2>
          <p className="text-white/80 text-lg mb-8">Tu rival está a 200 metros. No lo hagas esperar.</p>
          <Link to="/registro" className="inline-block bg-black text-white font-bold px-10 py-4 rounded-xl text-lg uppercase tracking-wider hover:bg-gray-900 transition-colors">
            EMPIEZA AHORA — ES GRATIS
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-sp-card border-t border-sp-border py-8 px-4 text-center">
        <p className="font-impact text-lg tracking-wider mb-2">
          <span className="text-white">STREET</span><span className="text-sp-green">PLAYER</span>
        </p>
        <p className="text-sp-muted text-xs">Juega. Rankea. Domina. · Perú 🇵🇪</p>
        <div className="flex justify-center gap-6 mt-4 text-xs text-sp-muted uppercase tracking-wider">
          <Link to="/login" className="hover:text-white transition-colors">Ingresar</Link>
          <Link to="/registro" className="hover:text-white transition-colors">Registrarse</Link>
        </div>
      </footer>
    </div>
  );
}
