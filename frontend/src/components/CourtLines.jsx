/** Líneas de cancha de fútbol — textura de fondo de la marca. */
export default function CourtLines(props) {
  return (
    <svg {...props} viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
      <line x1="600" y1="0" x2="600" y2="800" stroke="#fff" strokeWidth="1.5" />
      <circle cx="600" cy="400" r="115" fill="none" stroke="#fff" strokeWidth="1.5" />
      <circle cx="600" cy="400" r="4" fill="#fff" />
      <rect x="0" y="215" width="175" height="370" fill="none" stroke="#fff" strokeWidth="1.5" />
      <rect x="1025" y="215" width="175" height="370" fill="none" stroke="#fff" strokeWidth="1.5" />
      <rect x="0" y="290" width="62" height="220" fill="none" stroke="#fff" strokeWidth="1.5" />
      <rect x="1138" y="290" width="62" height="220" fill="none" stroke="#fff" strokeWidth="1.5" />
    </svg>
  );
}
