/**
 * brand.js — Identidad visual de StreetPlayer.
 * Fuente única de tokens para las superficies "editoriales"
 * (Landing, Login, Registro). El resto de la app usa los
 * tokens sp-* de tailwind.config.js, alineados a estos valores.
 */
export const T = {
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

export const heroGradient = `
  radial-gradient(ellipse 88% 70% at 8% 50%,
    ${T.warm1} 0%, ${T.warm2} 22%, ${T.warm3}99 46%, transparent 68%),
  radial-gradient(ellipse 84% 80% at 94% 55%,
    ${T.emerald} 0%, ${T.emeraldDark}cc 28%, ${T.emeraldDeep}aa 52%, transparent 70%),
  linear-gradient(112deg, ${T.warm2} 0%, ${T.black} 42%, ${T.emeraldDeep} 100%)
`.replace(/\s+/g, ' ');

export const grainBg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23g)' opacity='0.045'/%3E%3C/svg%3E")`;

export const monoFont = 'JetBrains Mono, Courier New, monospace';
