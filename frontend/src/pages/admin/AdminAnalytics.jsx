import { useState, useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';

function KpiCard({ label, value, sub, color = '#00e676' }) {
  return (
    <div style={{ background: '#0d0d1a', border: `1px solid ${color}22`, borderRadius: 12, padding: '18px 22px', flex: 1, minWidth: 130 }}>
      <p style={{ color: '#64748b', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</p>
      <p style={{ fontFamily: 'Impact, sans-serif', fontSize: 32, color, margin: '4px 0 0' }}>{value ?? '—'}</p>
      {sub && <p style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>{sub}</p>}
    </div>
  );
}

function BarChart({ data, labelKey, valueKey, color = '#7c3aed', title }) {
  const max = Math.max(...data.map(d => +d[valueKey]), 1);
  return (
    <div style={{ background: '#0d0d1a', border: '1px solid #1e1e2e', borderRadius: 12, padding: 20 }}>
      <p style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>{title}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: '#64748b', fontSize: 11, width: 100, flexShrink: 0, textTransform: 'capitalize', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{d[labelKey]}</span>
            <div style={{ flex: 1, background: '#13131f', borderRadius: 4, height: 18, overflow: 'hidden' }}>
              <div style={{ width: `${(+d[valueKey] / max) * 100}%`, height: '100%', background: color + '99', borderRadius: 4, transition: 'width 0.4s' }} />
            </div>
            <span style={{ color, fontSize: 11, fontWeight: 700, width: 30, textAlign: 'right' }}>{d[valueKey]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HeatHora({ data }) {
  const max = Math.max(...data.map(d => +d.total), 1);
  return (
    <div style={{ background: '#0d0d1a', border: '1px solid #1e1e2e', borderRadius: 12, padding: 20 }}>
      <p style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Actividad por hora del día</p>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 80 }}>
        {Array.from({ length: 24 }, (_, h) => {
          const found = data.find(d => +d.hora === h);
          const val = found ? +found.total : 0;
          const pct = Math.round((val / max) * 100);
          const isDay = h >= 6 && h <= 22;
          return (
            <div key={h} title={`${h}:00 — ${val} registros`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <div style={{ width: '100%', height: `${pct}%`, background: isDay ? '#7c3aed99' : '#1e1e2e', borderRadius: 2, minHeight: 2 }} />
              {h % 6 === 0 && <span style={{ color: '#64748b', fontSize: 8 }}>{h}h</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Tendencia30d({ data }) {
  const max = Math.max(...data.map(d => +d.nuevos), 1);
  return (
    <div style={{ background: '#0d0d1a', border: '1px solid #1e1e2e', borderRadius: 12, padding: 20 }}>
      <p style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Nuevos usuarios — 30 días</p>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 80 }}>
        {data.map((d, i) => {
          const pct = Math.round((+d.nuevos / max) * 100);
          return (
            <div key={i} title={`${new Date(d.dia).toLocaleDateString('es')} — ${d.nuevos} nuevos`}
              style={{ flex: 1, height: `${pct}%`, background: '#00e67666', borderRadius: 2, minHeight: 2 }} />
          );
        })}
      </div>
    </div>
  );
}

function Funnel({ data }) {
  const base = +data.registrados || 1;
  const steps = [
    { label: 'Registrados', value: data.registrados, color: '#7c3aed' },
    { label: 'Con foto',     value: data.con_foto,    color: '#a78bfa' },
    { label: 'Con partidos', value: data.con_partidos, color: '#00e676' },
    { label: 'En equipo',    value: data.en_equipo,   color: '#38bdf8' },
    { label: 'En evento',    value: data.en_evento,   color: '#fbbf24' },
    { label: 'Capitanes',    value: data.capitanes,   color: '#f87171' },
  ];
  return (
    <div style={{ background: '#0d0d1a', border: '1px solid #1e1e2e', borderRadius: 12, padding: 20 }}>
      <p style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Funnel de conversión</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {steps.map((s, i) => {
          const pct = Math.round((+s.value / base) * 100);
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ color: '#64748b', fontSize: 11, width: 90, flexShrink: 0 }}>{s.label}</span>
              <div style={{ flex: 1, background: '#13131f', borderRadius: 4, height: 20, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: s.color + '88', borderRadius: 4 }} />
              </div>
              <span style={{ color: s.color, fontSize: 12, fontWeight: 700, width: 50, textAlign: 'right' }}>{(+s.value).toLocaleString()}</span>
              <span style={{ color: '#64748b', fontSize: 10, width: 32 }}>{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function Analytics({ api }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/analytics').then(r => setData(r.data)).catch(() => {});
  }, []);

  if (!data) return <p style={{ color: '#64748b', padding: 32 }}>Cargando analytics...</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Retención */}
      <div>
        <p style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Retención de usuarios</p>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <KpiCard label="Activos hoy (DAU)" value={(+data.retencion.dau).toLocaleString()} color="#00e676" />
          <KpiCard label="Activos 7d (WAU)"  value={(+data.retencion.wau).toLocaleString()} color="#7c3aed" />
          <KpiCard label="Activos 30d (MAU)" value={(+data.retencion.mau).toLocaleString()} color="#fbbf24" />
          <KpiCard label="Total activos"     value={(+data.retencion.total).toLocaleString()} color="#38bdf8" />
        </div>
      </div>

      {/* Tendencia + Horas */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Tendencia30d data={data.tendencia_30d} />
        <HeatHora data={data.actividad_hora} />
      </div>

      {/* Distribuciones */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {data.distribucion_deporte.length > 0 && (
          <BarChart data={data.distribucion_deporte} labelKey="deporte" valueKey="total" color="#7c3aed" title="Deportes más activos (eventos)" />
        )}
        {data.distribucion_ciudad.length > 0 && (
          <BarChart data={data.distribucion_ciudad} labelKey="ciudad" valueKey="total" color="#00e676" title="Top ciudades de usuarios" />
        )}
      </div>

      {/* Funnel */}
      <Funnel data={data.funnel} />
    </div>
  );
}

// ─── Mapa de usuarios ─────────────────────────────────────────────────────────
export function MapaUsuarios({ api }) {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/mapa').then(r => { setUsuarios(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ color: '#64748b', padding: 32 }}>Cargando mapa...</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 4 }}>
        <div style={{ background: '#0d0d1a', border: '1px solid #00e67622', borderRadius: 10, padding: '14px 20px' }}>
          <p style={{ color: '#64748b', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Con GPS</p>
          <p style={{ fontFamily: 'Impact, sans-serif', fontSize: 28, color: '#00e676' }}>{usuarios.length}</p>
        </div>
      </div>
      <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #1e1e2e', height: 500 }}>
        <MapContainer center={[-12.0464, -77.0428]} zoom={6} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap'
          />
          {usuarios.map(u => (
            <CircleMarker
              key={u.id}
              center={[+u.latitud, +u.longitud]}
              radius={u.en_equipo ? 8 : 5}
              pathOptions={{ color: u.en_equipo ? '#7c3aed' : '#00e676', fillColor: u.en_equipo ? '#7c3aed' : '#00e676', fillOpacity: 0.7 }}
            >
              <Popup>
                <div style={{ fontSize: 12 }}>
                  <strong>{u.username}</strong><br />
                  {u.ciudad && <span>{u.ciudad}<br /></span>}
                  XP: {(+u.nivel_xp || 0).toLocaleString()}<br />
                  PJ: {u.partidos_jugados}
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
      <p style={{ color: '#64748b', fontSize: 11 }}>🟢 Sin equipo &nbsp;|&nbsp; 🟣 En equipo</p>
    </div>
  );
}
