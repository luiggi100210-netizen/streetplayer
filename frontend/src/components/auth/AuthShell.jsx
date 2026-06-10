import { Link } from 'react-router-dom';
import { T, heroGradient, grainBg, monoFont } from '../../styles/brand';
import CourtLines from '../CourtLines';

function Logo({ className = '' }) {
  return (
    <Link to="/" className={`font-impact text-xl tracking-wider no-underline ${className}`}>
      <span className="text-white">Street</span>
      <span className="italic" style={{ color: T.emerald }}>Player</span>
    </Link>
  );
}

/**
 * Layout split-screen para Login y Registro:
 * panel de marca a la izquierda (solo escritorio) + formulario a la derecha.
 * Mantiene la identidad editorial de la Landing.
 */
export default function AuthShell({ children }) {
  return (
    <div className="min-h-screen flex bg-sp-bg text-white">

      {/* ── Panel de marca — solo escritorio ── */}
      <aside
        className="hidden lg:flex relative w-[44%] max-w-[640px] overflow-hidden flex-col justify-between p-12"
        style={{ background: heroGradient }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: grainBg, backgroundSize: '200px 200px', opacity: 0.45 }}
        />
        <CourtLines className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.05 }} />
        {/* Oscurece el borde derecho para fundir con el panel de formulario */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: `linear-gradient(to right, transparent 55%, ${T.black} 100%)` }}
        />

        <Logo className="relative z-10" />

        <h2 className="relative z-10 font-impact uppercase text-[clamp(40px,4.2vw,68px)] leading-[0.9] font-normal">
          <span className="block text-white">Tu cancha.</span>
          <span className="block text-white">Tu ranking.</span>
          <em className="block italic" style={{ color: T.emerald }}>Tu calle.</em>
        </h2>

        <div className="relative z-10 flex items-center gap-3">
          <span
            className="w-[7px] h-[7px] rounded-full shrink-0"
            style={{ background: T.emerald, boxShadow: `0 0 0 3px ${T.emerald}2a, 0 0 14px ${T.emerald}77`, animation: 'livePulse 2.2s ease-in-out infinite' }}
          />
          <span className="uppercase font-bold" style={{ fontFamily: monoFont, fontSize: 9.5, letterSpacing: '0.2em', color: T.emerald }}>
            EN VIVO · PERÚ
          </span>
          <span className="w-px h-3" style={{ background: T.border }} />
          <span className="uppercase" style={{ fontFamily: monoFont, fontSize: 9.5, letterSpacing: '0.14em', color: T.muted }}>
            JUEGA · RANKEA · DOMINA
          </span>
        </div>

        <style>{`
          @keyframes livePulse {
            0%, 100% { box-shadow: 0 0 0 3px rgba(29,158,117,0.22), 0 0 14px rgba(29,158,117,0.5); }
            50%       { box-shadow: 0 0 0 5px rgba(29,158,117,0.07), 0 0 22px rgba(29,158,117,0.25); }
          }
        `}</style>
      </aside>

      {/* ── Panel de formulario ── */}
      <main className="flex-1 flex flex-col px-6 py-10 lg:px-16 overflow-y-auto">
        <div className="w-full max-w-[400px] m-auto">
          <Logo className="lg:hidden block text-center mb-10" />
          {children}
        </div>
      </main>
    </div>
  );
}

/** Eyebrow monoespaciado — etiqueta editorial sobre el título. */
export function Eyebrow({ children }) {
  return (
    <span
      className="block uppercase font-bold mb-4"
      style={{ fontFamily: monoFont, fontSize: 10, letterSpacing: '0.22em', color: T.emerald }}
    >
      {children}
    </span>
  );
}
