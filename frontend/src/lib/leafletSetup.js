/**
 * Configuración compartida de Leaflet: íconos del marcador empaquetados
 * por Vite (sin depender de un CDN externo). Importar este módulo una
 * vez por cada componente que use react-leaflet.
 */
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

/** Centro por defecto del mapa: Lima, Perú. */
export const CENTRO_DEFAULT = [-12.0464, -77.0428];

export default L;
