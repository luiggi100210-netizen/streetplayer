import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Fix default marker icons broken by Webpack/Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Componente interno que captura clicks en el mapa
function ClickHandler({ onChange }) {
  useMapEvents({
    click(e) {
      onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

/**
 * MapaPicker — mapa interactivo para elegir ubicación.
 *
 * Props:
 *   value    { lat, lng } | null
 *   onChange ({ lat, lng }) => void
 *   height   string  (default '280px')
 */
export default function MapaPicker({ value, onChange, height = '280px' }) {
  const centro = value
    ? [value.lat, value.lng]
    : [-12.0464, -77.0428]; // Lima, Perú por defecto

  return (
    <div className="rounded-xl overflow-hidden border border-[#1e1e2e]" style={{ height }}>
      <MapContainer
        center={centro}
        zoom={value ? 16 : 13}
        style={{ height: '100%', width: '100%' }}
        key={value ? 'con-valor' : 'sin-valor'}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <ClickHandler onChange={onChange} />
        {value && <Marker position={[value.lat, value.lng]} />}
      </MapContainer>
    </div>
  );
}
