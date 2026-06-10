import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import { CENTRO_DEFAULT } from '../lib/leafletSetup';

/** Ajusta el encuadre para mostrar todos los eventos (y al usuario si hay coords). */
function FitBounds({ puntos }) {
  const map = useMap();
  useEffect(() => {
    if (puntos.length === 0) return;
    if (puntos.length === 1) {
      map.setView(puntos[0], 14);
      return;
    }
    map.fitBounds(puntos, { padding: [40, 40], maxZoom: 15 });
  }, [JSON.stringify(puntos)]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

const TIPO_EMOJI = { pichanga: '⚽', reto: '⚔️', campeonato: '🏆' };

/**
 * MapaEventos — vista de mapa de la lista de eventos.
 *
 * Props:
 *   eventos   array de eventos (usa latitud/longitud; ignora los que no tienen)
 *   coords    { lat, lng } | null — ubicación del usuario ("estás aquí")
 *   height    string (default '520px')
 */
export default function MapaEventos({ eventos, coords, height = '520px' }) {
  const conUbicacion = eventos.filter(e => e.latitud != null && e.longitud != null);
  const puntos = [
    ...conUbicacion.map(e => [parseFloat(e.latitud), parseFloat(e.longitud)]),
    ...(coords ? [[coords.lat, coords.lng]] : []),
  ];

  return (
    <div className="rounded-xl overflow-hidden border border-white/10 relative" style={{ height }}>
      <MapContainer center={coords ? [coords.lat, coords.lng] : CENTRO_DEFAULT} zoom={12} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <FitBounds puntos={puntos} />

        {conUbicacion.map(e => (
          <Marker key={e.id} position={[parseFloat(e.latitud), parseFloat(e.longitud)]}>
            <Popup>
              <div style={{ minWidth: 180, fontFamily: 'Inter, sans-serif' }}>
                <p style={{ fontWeight: 800, fontSize: 14, margin: '0 0 4px' }}>
                  {TIPO_EMOJI[e.tipo] ?? '🎯'} {e.titulo}
                </p>
                <p style={{ fontSize: 12, color: '#555', margin: '0 0 2px' }}>
                  {e.nombre_cancha || e.direccion || e.ciudad || 'Sin dirección'}
                </p>
                <p style={{ fontSize: 12, color: '#555', margin: '0 0 8px' }}>
                  {e.formato}v{e.formato} · {e.cupos_ocupados}/{e.cupos_total} jugadores
                  {e.distancia_km != null && ` · a ${e.distancia_km} km`}
                </p>
                <Link
                  to={`/eventos/${e.id}`}
                  style={{
                    display: 'inline-block', background: '#1D9E75', color: '#fff',
                    fontSize: 12, fontWeight: 700, padding: '6px 14px',
                    borderRadius: 8, textDecoration: 'none',
                  }}
                >
                  Ver evento →
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {conUbicacion.length === 0 && (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-black/60 pointer-events-none">
          <p className="text-white/60 text-sm font-semibold">No hay eventos con ubicación para mostrar</p>
        </div>
      )}
    </div>
  );
}
