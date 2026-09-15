import { getSocket } from '../services/socket';

// getSocket() ya es la fuente de verdad: devuelve el socket actual y crea
// uno nuevo por su cuenta cuando el token rota (login/renovación). Guardar
// una referencia propia aquí (como se hacía antes) la deja obsoleta después
// de esa rotación — el componente sigue escuchando un socket ya
// desconectado y deja de recibir eventos en tiempo real sin ningún aviso.
export function useSocket() {
  return getSocket();
}
