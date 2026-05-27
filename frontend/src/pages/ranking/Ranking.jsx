import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const DEPORTES = ['', 'futbol', 'basquet', 'tenis', 'padel', 'voley', 'running', 'ciclismo'];

const MEDALLAS = ['🥇', '🥈', '🥉'];

export default function Ranking() {
  const [ranking, setRanking] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtros, setFiltros] = useState({ deporte: '', ciudad: '' });

  const cargar = async () => {
    setCargando(true);
    try {
      const params = new URLSearchParams();
      if (filtros.deporte) params.set('deporte', filtros.deporte);
      if (filtros.ciudad) params.set('ciudad', filtros.ciudad);
      const { data } = await api.get(`/ranking?${params}`);
      setRanking(data);
    } catch {}
    setCargando(false);
  };

  useEffect(() => { cargar(); }, [filtros]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Ranking</h1>
        <p className="text-gray-400 text-sm mt-1">Los mejores jugadores de la comunidad</p>
      </div>

      {/* Filtros */}
      <div className="card mb-6 flex flex-wrap gap-3">
        <div className="flex gap-2 flex-wrap flex-1">
          {DEPORTES.map(d => (
            <button
              key={d || 'todos'}
              onClick={() => setFiltros(p => ({ ...p, deporte: d }))}
              className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${filtros.deporte === d ? 'bg-sp-green text-sp-bg' : 'bg-sp-border text-gray-400 hover:text-white'}`}
            >
              {d || 'Global'}
            </button>
          ))}
        </div>
        <input
          value={filtros.ciudad}
          onChange={e => setFiltros(p => ({ ...p, ciudad: e.target.value }))}
          placeholder="Filtrar por ciudad..."
          className="input text-sm w-40"
        />
      </div>

      {/* Top 3 */}
      {!cargando && ranking.length >= 3 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[ranking[1], ranking[0], ranking[2]].map((item, i) => {
            if (!item) return null;
            const posReal = i === 1 ? 0 : i === 0 ? 1 : 2;
            return (
              <Link
                key={item.usuario_id}
                to={`/perfil/${item.usuario_id}`}
                className={`card text-center hover:border-sp-green/50 transition-all ${i === 1 ? 'border-yellow-400/50 -mt-3' : ''}`}
              >
                <div className="text-2xl mb-2">{MEDALLAS[posReal]}</div>
                {item.foto_url ? (
                  <img src={item.foto_url} className={`rounded-full object-cover mx-auto mb-2 border-2 ${i === 1 ? 'w-16 h-16 border-yellow-400' : 'w-12 h-12 border-sp-border'}`} alt={item.username} />
                ) : (
                  <div className={`rounded-full bg-sp-green/20 flex items-center justify-center text-sp-green font-bold mx-auto mb-2 border-2 ${i === 1 ? 'w-16 h-16 text-xl border-yellow-400' : 'w-12 h-12 border-sp-border'}`}>
                    {item.username?.[0]?.toUpperCase()}
                  </div>
                )}
                <p className="text-white font-semibold text-sm truncate">{item.username}</p>
                <p className="text-sp-green font-bold text-sm">{item.puntos}pts</p>
                {item.ciudad && <p className="text-gray-500 text-xs truncate">{item.ciudad}</p>}
              </Link>
            );
          })}
        </div>
      )}

      {/* Lista completa */}
      {cargando ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => <div key={i} className="card animate-pulse h-16" />)}
        </div>
      ) : ranking.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">🏆</p>
          <p className="text-gray-400">No hay datos de ranking aun</p>
        </div>
      ) : (
        <div className="space-y-2">
          {ranking.map((item, i) => (
            <Link
              key={item.usuario_id}
              to={`/perfil/${item.usuario_id}`}
              className="card flex items-center gap-4 hover:border-sp-green/50 transition-colors"
            >
              <span className={`text-lg font-bold w-8 text-center shrink-0 ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-gray-500'}`}>
                {i < 3 ? MEDALLAS[i] : `#${i + 1}`}
              </span>
              {item.foto_url ? (
                <img src={item.foto_url} className="w-10 h-10 rounded-full object-cover shrink-0" alt={item.username} />
              ) : (
                <div className="w-10 h-10 rounded-full bg-sp-green/20 flex items-center justify-center text-sp-green font-bold shrink-0">
                  {item.username?.[0]?.toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{item.nombre || item.username}</p>
                <p className="text-gray-400 text-xs">@{item.username}{item.ciudad ? ` · ${item.ciudad}` : ''}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sp-green font-bold">{item.puntos}</p>
                <p className="text-gray-500 text-xs">puntos</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
