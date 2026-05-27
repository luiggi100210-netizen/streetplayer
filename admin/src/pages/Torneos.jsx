import { useState, useEffect } from 'react';
import api from '../services/api';

export default function Torneos() {
  const [torneos, setTorneos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [tab, setTab] = useState('pendientes');

  const cargar = async () => {
    setCargando(true);
    try {
      const params = new URLSearchParams({ estado: tab === 'pendientes' ? 'pendiente' : 'abierto' });
      const { data } = await api.get(`/admin/torneos?${params}`);
      setTorneos(data);
    } catch {}
    setCargando(false);
  };

  useEffect(() => { cargar(); }, [tab]);

  const aprobar = async (id) => {
    try {
      await api.put(`/admin/torneos/${id}/aprobar`);
      setTorneos(prev => prev.filter(t => t.id !== id));
    } catch {}
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Torneos</h1>
        <p className="text-gray-400 text-sm mt-1">Revisa y aprueba propuestas de torneos</p>
      </div>

      <div className="flex gap-1 bg-sp-card border border-sp-border rounded-xl p-1 mb-6 w-fit">
        {['pendientes', 'aprobados'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${tab === t ? 'bg-sp-green text-sp-bg' : 'text-gray-400 hover:text-white'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {cargando ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1,2].map(i => <div key={i} className="card animate-pulse h-40" />)}
        </div>
      ) : torneos.length === 0 ? (
        <div className="text-center py-16 card">
          <p className="text-4xl mb-3">🏆</p>
          <p className="text-gray-400">Sin torneos {tab}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {torneos.map(t => (
            <div key={t.id} className={`card ${tab === 'pendientes' ? 'border-sp-orange/30' : ''}`}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-semibold text-white">{t.nombre}</h3>
                <span className="badge-orange text-xs capitalize shrink-0">{t.deporte}</span>
              </div>
              <p className="text-gray-400 text-sm mb-1">{t.ciudad}</p>
              {t.descripcion && <p className="text-gray-500 text-xs mb-3 line-clamp-2">{t.descripcion}</p>}
              <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                <span>Organizador: @{t.organizador_username}</span>
                <span>{t.max_equipos} equipos max</span>
                {t.premio && <span>Premio: {t.premio}</span>}
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
                <span>{t.fecha_inicio ? new Date(t.fecha_inicio).toLocaleDateString('es-ES') : '-'}</span>
                {t.fecha_fin && <span>→ {new Date(t.fecha_fin).toLocaleDateString('es-ES')}</span>}
              </div>
              {tab === 'pendientes' && (
                <div className="flex gap-2">
                  <button onClick={() => aprobar(t.id)} className="btn-green text-sm flex-1">
                    Aprobar y publicar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
