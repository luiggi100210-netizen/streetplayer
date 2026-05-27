import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import api from '../services/api';

const ESTADOS = ['pendiente', 'revisado', 'resuelto', 'desestimado'];

export default function Reportes() {
  const [reportes, setReportes] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargar = async () => {
    setCargando(true);
    try {
      const { data } = await api.get('/admin/reportes');
      setReportes(data);
    } catch {}
    setCargando(false);
  };

  useEffect(() => { cargar(); }, []);

  const cambiarEstado = async (id, estado) => {
    try {
      await api.put(`/admin/reportes/${id}`, { estado });
      setReportes(prev => prev.map(r => r.id === id ? { ...r, estado } : r));
    } catch {}
  };

  const estadoBadge = (estado) => {
    if (estado === 'pendiente') return <span className="badge-red">pendiente</span>;
    if (estado === 'revisado') return <span className="badge-orange">revisado</span>;
    if (estado === 'resuelto') return <span className="badge-green">resuelto</span>;
    return <span className="badge-gray">desestimado</span>;
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Reportes</h1>
        <p className="text-gray-400 text-sm mt-1">Incidencias reportadas por usuarios</p>
      </div>

      {cargando ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="card animate-pulse h-20" />)}
        </div>
      ) : reportes.length === 0 ? (
        <div className="text-center py-16 card">
          <p className="text-4xl mb-3">✅</p>
          <p className="text-gray-400">Sin reportes pendientes</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reportes.map(r => (
            <div key={r.id} className={`card ${r.estado === 'pendiente' ? 'border-red-500/30' : ''}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {estadoBadge(r.estado)}
                    <span className="text-gray-500 text-xs">
                      {r.fecha ? formatDistanceToNow(new Date(r.fecha), { addSuffix: true, locale: es }) : ''}
                    </span>
                  </div>
                  <p className="text-white font-medium text-sm">{r.tipo || 'Reporte'}</p>
                  {r.descripcion && <p className="text-gray-300 text-sm mt-1">{r.descripcion}</p>}
                  <div className="flex gap-4 mt-2 text-xs text-gray-500">
                    {r.reportado_por_username && (
                      <span>Reportado por: <span className="text-gray-300">@{r.reportado_por_username}</span></span>
                    )}
                    {r.usuario_reportado_username && (
                      <span>Contra: <span className="text-gray-300">@{r.usuario_reportado_username}</span></span>
                    )}
                  </div>
                </div>
                <select
                  value={r.estado}
                  onChange={e => cambiarEstado(r.id, e.target.value)}
                  className="input text-xs py-1 px-2 shrink-0"
                >
                  {ESTADOS.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
