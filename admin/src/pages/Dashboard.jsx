import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';

function StatCard({ label, value, sub, color = 'text-white' }) {
  return (
    <div className="card">
      <p className="text-gray-500 text-sm mb-1">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-gray-400 text-xs mt-1">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard').then(({ data }) => setDatos(data)).finally(() => setCargando(false));
  }, []);

  if (cargando) return (
    <div className="p-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[1,2,3,4].map(i => <div key={i} className="card animate-pulse h-24" />)}
    </div>
  );

  if (!datos) return <div className="p-6 text-gray-400">Error cargando datos</div>;

  const { usuarios, eventos, torneos, reportes, registros_7_dias } = datos;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">Resumen general de la plataforma</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Usuarios totales" value={usuarios.total} sub={`${usuarios.activos} activos · ${usuarios.suspendidos} suspendidos`} color="text-sp-green" />
        <StatCard label="Eventos" value={eventos.total} sub={`${eventos.abiertos} abiertos`} color="text-blue-400" />
        <StatCard label="Torneos" value={torneos.total} sub={`${torneos.pendientes} pendientes revision`} color="text-sp-orange" />
        <StatCard label="Reportes" value={reportes.total} sub={`${reportes.pendientes} sin resolver`} color={parseInt(reportes.pendientes) > 0 ? 'text-red-400' : 'text-white'} />
      </div>

      {/* Grafico registros */}
      <div className="card">
        <h2 className="font-semibold text-white mb-4">Registros ultimos 7 dias</h2>
        {registros_7_dias?.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={registros_7_dias} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="dia" tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={v => new Date(v + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' })} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#12121a', border: '1px solid #1e1e2e', borderRadius: '8px', color: '#f3f4f6' }}
                labelFormatter={v => new Date(v + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
              />
              <Bar dataKey="total" fill="#00e676" radius={[4, 4, 0, 0]} name="Registros" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-500 text-sm text-center py-8">Sin registros en los ultimos 7 dias</p>
        )}
      </div>

      {/* Alertas */}
      {parseInt(reportes.pendientes) > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-2xl">🚨</span>
          <div>
            <p className="text-red-400 font-medium">Hay {reportes.pendientes} reportes pendientes de revision</p>
            <p className="text-red-400/60 text-sm">Revisar y resolver a la brevedad</p>
          </div>
          <a href="/reportes" className="ml-auto btn-danger text-sm">Ver reportes</a>
        </div>
      )}

      {parseInt(torneos.pendientes) > 0 && (
        <div className="bg-sp-orange/10 border border-sp-orange/30 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-2xl">🏆</span>
          <div>
            <p className="text-sp-orange font-medium">{torneos.pendientes} torneos esperan aprobacion</p>
            <p className="text-sp-orange/60 text-sm">Revisar los detalles antes de publicar</p>
          </div>
          <a href="/torneos" className="ml-auto btn-orange text-sm">Ver torneos</a>
        </div>
      )}
    </div>
  );
}
