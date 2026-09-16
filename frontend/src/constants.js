export const COLORES_NIVEL = {
  rookie:    '#888',
  amateur:   '#9FE1CB',
  intermedio:'#60a5fa',
  avanzado:  '#a78bfa',
  pro:       '#fbbf24',
  elite:     '#f87171',
  leyenda:   '#fde68a',
};

// Mismo código de color de los "modos de juego" del landing (pichanga
// casual = verde, reto competitivo = ambar, campeonato/torneo = rojo),
// reutilizado en toda la app para que un evento/reto/torneo se identifique
// por color de un vistazo, no solo por su ícono.
export const COLORES_MODO = {
  pichanga: '#1D9E75',
  reto:     '#e5a000',
  campeonato: '#e05353',
  torneo:   '#e05353',
};

export const PODIO = {
  1: { medalla: '🥇', color: '#fbbf24', glow: 'rgba(251,191,36,0.18)' },
  2: { medalla: '🥈', color: '#cbd5e1', glow: 'rgba(203,213,225,0.14)' },
  3: { medalla: '🥉', color: '#e08a4f', glow: 'rgba(224,138,79,0.14)' },
};
