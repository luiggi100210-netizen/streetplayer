// Fecha completa con día de semana y hora — para eventos
export function formatFechaEvento(f) {
  if (!f) return '';
  return new Date(f).toLocaleDateString('es-ES', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
  });
}

// Fecha corta sin hora — para torneos y listas
export function formatFechaCorta(f) {
  if (!f) return '';
  return new Date(f).toLocaleDateString('es-ES', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}
