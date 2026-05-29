import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import { COLORES_NIVEL } from '../constants';

const DEPORTES = ['futbol', 'basquet', 'tenis', 'padel', 'voley', 'running', 'ciclismo'];

export default function Buscar() {
  const { usuario } = useAuth();
  const [q, setQ]               = useState('');
  const [deporte, setDeporte]   = useState('');
  const [ciudad, setCiudad]     = useState('');
  const [resultados, setRes]    = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [buscado, setBuscado]   = useState(false);

  const buscar = useCallback(async () => {
    setBuscando(true);
    setBuscado(true);
    try {
      const params = new URLSearchParams();
      if (q)       params.set('q', q);
      if (deporte) params.set('deporte', deporte);
      if (ciudad)  params.set('ciudad', ciudad);
      const { data } = await api.get(`/usuarios/buscar?${params}`);
      setRes(data);
    } catch {}
    setBuscando(false);
  }, [q, deporte, ciudad]);

  const handleKey = (e) => { if (e.key === 'Enter') buscar(); };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <h1 className="font-impact text-2xl">BUSCAR JUGADORES</h1>

      {/* Filtros */}
      <div className="card space-y-4">
        <div className="flex gap-2">
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Nombre o usuario..."
            className="input flex-1"
            autoFocus
          />
          <button onClick={buscar} disabled={buscando} className="btn-primary px-5">
            {buscando ? '...' : 'Buscar'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Deporte</label>
            <select value={deporte} onChange={e => setDeporte(e.target.value)} className="input">
              <option value="">Todos</option>
              {DEPORTES.map(d => <option key={d} value={d} className="capitalize">{d}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Ciudad</label>
            <input value={ciudad} onChange={e => setCiudad(e.target.value)} onKeyDown={handleKey} placeholder="Lima, Bogotá..." className="input" />
          </div>
        </div>
      </div>

      {/* Resultados */}
      {buscando && (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="card animate-pulse flex gap-4">
              <div className="w-12 h-12 rounded-full bg-sp-border shrink-0" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-3 bg-sp-border rounded w-1/3" />
                <div className="h-2 bg-sp-border rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!buscando && buscado && resultados.length === 0 && (
        <div className="card text-center py-10 text-sp-muted">
          No se encontraron jugadores con esos filtros
        </div>
      )}

      {!buscando && resultados.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-sp-muted uppercase tracking-wider">{resultados.length} jugador{resultados.length !== 1 ? 'es' : ''} encontrado{resultados.length !== 1 ? 's' : ''}</p>
          {resultados.map(u => {
            const nivelColor = COLORES_NIVEL[u.nivel_xp] ?? '#888';
            const esMio = u.id === usuario?.id;
            return (
              <Link
                key={u.id}
                to={`/perfil/${u.id}`}
                className="card flex items-center gap-4 hover:border-sp-green/40 transition-colors"
              >
                <Avatar foto={u.foto_url} username={u.username} size={48} color={nivelColor} />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-white text-sm truncate">{u.nombre || u.username}</p>
                    {esMio && <span className="text-[10px] text-sp-muted">(tú)</span>}
                  </div>
                  <p className="text-sp-muted text-xs">@{u.username}</p>
                  {u.ciudad && <p className="text-sp-muted text-xs">📍 {u.ciudad}</p>}
                </div>

                {/* Stats */}
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold uppercase" style={{ color: nivelColor }}>{u.nivel_xp ?? 'rookie'}</p>
                  {u.deportes?.length > 0 && (
                    <div className="flex gap-1 mt-1 justify-end flex-wrap">
                      {u.deportes.slice(0, 2).map(d => (
                        <span key={d} className="text-[10px] px-1.5 py-0.5 rounded-full bg-sp-green/10 text-sp-green-light border border-sp-green/20 capitalize">{d}</span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {!buscado && (
        <div className="card text-center py-12 text-sp-muted">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-sm">Busca por nombre, usuario, deporte o ciudad</p>
        </div>
      )}
    </div>
  );
}
