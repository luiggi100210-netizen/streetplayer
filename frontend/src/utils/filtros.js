/** Arma un URLSearchParams con los filtros comunes deporte/ciudad/estado (Eventos, Torneos). */
export function construirParamsFiltros({ deporte, ciudad, estado }) {
  const p = new URLSearchParams();
  if (deporte) p.set('deporte', deporte);
  if (ciudad)  p.set('ciudad', ciudad);
  if (estado)  p.set('estado', estado);
  return p;
}
