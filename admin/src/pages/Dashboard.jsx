import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';
import api from '../services/api';

const STAT_CFG = [
  { key: 'usuarios', label: 'Usuarios',  color: '#1D9E75', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { key: 'eventos',  label: 'Eventos',   color: '#60a5fa', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { key: 'torneos',  label: 'Torneos',   color: '#f0c382', icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z' },
  { key: 'reportes', label: 'Reportes',  color: '#f87171', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
];

function StatCard({ label, value, sub, color, icon }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '20px 20px 18px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: 3, height: '100%', background: color, borderRadius: '12px 0 0 12px' }} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-white/40 text-[11px] uppercase tracking-widest font-semibold mb-2">{label}</p>
          <p className="text-3xl font-bold text-white" style={{ fontFamily: 'Anton, Impact, sans-serif' }}>{value ?? '—'}</p>
          {sub && <p className="text-white/30 text-xs mt-1.5">{sub}</p>}
        </div>
        <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: color + '18', border: `1px solid ${color}28` }}>
          <svg className="w-5 h-5" style={{ color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={icon} />
          </svg>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard').then(({ data }) => setDatos(data)).finally(() => setCargando(false));
  }, []);

  return (
    <div className="p-7 max-w-5xl">
      <div className="mb-7">
        <h1 className="text-xl font-bold text-white"
          style={{ fontFamily: 'Anton, Impact, sans-serif', letterSpacing: '0.05em' }}>
          DASHBOARD
        </h1>
        <p className="text-white/30 text-sm mt-0.5">Resumen general de la plataforma</p>
      </div>

      {/* Stats */}
      {cargando ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="animate-pulse rounded-xl h-28"
              style={{ background: 'rgba(255,255,255,0.04)' }} />
          ))}
        </div>
      ) : datos && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard label="Usuarios"  value={datos.usuarios?.total}  sub={`${datos.usuarios?.activos} activos`}         color="#1D9E75" icon={STAT_CFG[0].icon} />
            <StatCard label="Eventos"   value={datos.eventos?.total}   sub={`${datos.eventos?.abiertos} abiertos`}        color="#60a5fa" icon={STAT_CFG[1].icon} />
            <StatCard label="Torneos"   value={datos.torneos?.total}   sub={`${datos.torneos?.pendientes} pend. revision`} color="#f0c382" icon={STAT_CFG[2].icon} />
            <StatCard label="Reportes"  value={datos.reportes?.total}  sub={`${datos.reportes?.pendientes} sin resolver`}
              color={parseInt(datos.reportes?.pendientes) > 0 ? '#f87171' : '#6b7280'} icon={STAT_CFG[3].icon} />
          </div>

          {/* Grafico */}
          <div className="mb-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '20px 24px' }}>
            <p className="text-white/40 text-[11px] uppercase tracking-widest font-semibold mb-5">Registros — ultimos 7 dias</p>
            {datos.registros_7_dias?.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={datos.registros_7_dias} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="dia" tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 11 }}
                    tickFormatter={v => new Date(v + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' })} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0e0e1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 12 }}
                    labelFormatter={v => new Date(v + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                    cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                  />
                  <Bar dataKey="total" fill="#1D9E75" radius={[4,4,0,0]} name="Registros" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-white/20 text-sm text-center py-10">Sin registros en los ultimos 7 dias</p>
            )}
          </div>

          {/* Alertas */}
          <div className="space-y-3">
            {parseInt(datos.reportes?.pendientes) > 0 && (
              <div className="flex items-center gap-4 px-5 py-4 rounded-xl"
                style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <svg className="w-5 h-5 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="flex-1">
                  <p className="text-red-400 font-semibold text-sm">{datos.reportes.pendientes} reportes pendientes de revision</p>
                  <p className="text-red-400/50 text-xs mt-0.5">Resolver a la brevedad</p>
                </div>
                <Link to="/reportes" className="text-red-400 text-xs font-semibold border border-red-400/30 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors shrink-0">
                  Ver reportes
                </Link>
              </div>
            )}
            {parseInt(datos.torneos?.pendientes) > 0 && (
              <div className="flex items-center gap-4 px-5 py-4 rounded-xl"
                style={{ background: 'rgba(240,195,130,0.07)', border: '1px solid rgba(240,195,130,0.2)' }}>
                <svg className="w-5 h-5 text-yellow-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                <div className="flex-1">
                  <p className="text-yellow-400 font-semibold text-sm">{datos.torneos.pendientes} torneos esperan aprobacion</p>
                  <p className="text-yellow-400/50 text-xs mt-0.5">Revisar detalles antes de publicar</p>
                </div>
                <Link to="/torneos" className="text-yellow-400 text-xs font-semibold border border-yellow-400/30 px-3 py-1.5 rounded-lg hover:bg-yellow-400/10 transition-colors shrink-0">
                  Ver torneos
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
