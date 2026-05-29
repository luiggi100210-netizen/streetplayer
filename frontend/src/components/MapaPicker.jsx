import 'leaflet/dist/leaflet.css';
import { useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix default marker icons broken by Webpack/Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function ClickHandler({ onChange }) {
  useMapEvents({
    click(e) {
      onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function FlyTo({ coords }) {
  const map = useMap();
  if (coords) map.flyTo([coords.lat, coords.lng], 16, { duration: 1.2 });
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
  const [flyTo, setFlyTo] = useState(null);
  const [locating, setLocating] = useState(false);

  const centro = value
    ? [value.lat, value.lng]
    : [-12.0464, -77.0428]; // Lima, Perú por defecto

  function usarUbicacionActual() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        onChange(coords);
        setFlyTo(coords);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  return (
    <div className="rounded-xl overflow-hidden border border-[#1e1e2e] relative" style={{ height }}>
      <MapContainer
        center={centro}
        zoom={value ? 16 : 13}
        style={{ height: '100%', width: '100%' }}
        key={value ? `${value.lat},${value.lng}` : 'sin-valor'}
        zoomControl={!readOnly}
        dragging={!readOnly}
        scrollWheelZoom={!readOnly}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        {!readOnly && onChange && <ClickHandler onChange={onChange} />}
        {flyTo && <FlyTo coords={flyTo} />}
        {value && <Marker position={[value.lat, value.lng]} />}
      </MapContainer>

      {!readOnly && onChange && (
        <button
          type="button"
          onClick={usarUbicacionActual}
          disabled={locating}
          title="Usar mi ubicación actual"
          style={{
            position: 'absolute',
            bottom: 12,
            right: 12,
            zIndex: 1000,
            background: '#7c3aed',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '7px 12px',
            cursor: locating ? 'wait' : 'pointer',
            fontSize: 13,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
          }}
        >
          {locating ? '⏳' : '📍'} {locating ? 'Obteniendo...' : 'Mi ubicación'}
        </button>
      )}
    </div>
  );
}
