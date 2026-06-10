import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { CENTRO_DEFAULT } from '../lib/leafletSetup';
import { useGeolocation } from '../hooks/useGeolocation';

function ClickHandler({ onChange }) {
  useMapEvents({
    click(e) {
      onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

/** Mantiene el mapa centrado en value sin remontar el componente. */
function CenterOnValue({ coords, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (coords) map.setView([coords.lat, coords.lng], zoom ?? map.getZoom(), { animate: true });
  }, [coords?.lat, coords?.lng]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

/**
 * MapaPicker — mapa interactivo para elegir o visualizar una ubicación.
 *
 * Props:
 *   value     { lat, lng } | null
 *   onChange  ({ lat, lng }) => void   — omitir para modo solo lectura
 *   height    string  (default '280px')
 *   readOnly  bool    (default false)
 */
export default function MapaPicker({ value, onChange, height = '280px', readOnly = false }) {
  const { coords: miUbicacion, error: geoError, loading: locating, solicitar } = useGeolocation();

  // Cuando el usuario pulsa "Mi ubicación", el hook entrega coords → seleccionarlas
  useEffect(() => {
    if (miUbicacion && onChange) onChange(miUbicacion);
  }, [miUbicacion]); // eslint-disable-line react-hooks/exhaustive-deps

  const centro = value ? [value.lat, value.lng] : CENTRO_DEFAULT;

  return (
    <div className="rounded-xl overflow-hidden border border-white/10 relative" style={{ height }}>
      <MapContainer
        center={centro}
        zoom={value ? 16 : 13}
        style={{ height: '100%', width: '100%' }}
        zoomControl={!readOnly}
        dragging={!readOnly}
        scrollWheelZoom={!readOnly}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        {!readOnly && onChange && <ClickHandler onChange={onChange} />}
        <CenterOnValue coords={value} zoom={16} />
        {value && <Marker position={[value.lat, value.lng]} />}
      </MapContainer>

      {!readOnly && onChange && (
        <button
          type="button"
          onClick={solicitar}
          disabled={locating}
          title="Usar mi ubicación actual"
          className="absolute bottom-3 right-3 z-[1000] flex items-center gap-1.5 px-3 py-2 rounded-lg
                     bg-sp-green hover:bg-sp-green-dark text-white text-xs font-bold uppercase tracking-wider
                     shadow-[0_2px_12px_rgba(0,0,0,0.45)] transition-colors disabled:opacity-60"
        >
          {locating ? '⏳ Obteniendo...' : '📍 Mi ubicación'}
        </button>
      )}

      {geoError && !readOnly && (
        <p className="absolute bottom-3 left-3 right-28 z-[1000] text-[11px] text-red-300 bg-black/80 rounded-lg px-3 py-2">
          {geoError}
        </p>
      )}
    </div>
  );
}
