import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const DEPORTES = ['Futbol', 'Basquet', 'Tenis', 'Padel', 'Voley', 'Running', 'Ciclismo', 'Otro'];

export default function Eventos() {
  const [eventos, setEventos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtros, setFiltros] = useState({ deporte: '', ciudad: '', estado: 'abierto' });

  const cargar = async () => {
    setCargando(true);
    try {
      const params = new URLSearchParams();
      if (filtros.deporte) params.set('deporte', filtros.deporte);
      if (filtros.ciudad) params.set('ciudad', filtros.ciudad);
      if (filtros.estado) params.set('estado', filtros.estado);
      const { data } = await api.get(`/eventos?${params}`);
      setEventos(data);
    } catch {}
    setCargando(false);
  };

  useEffect(() => { cargar(); }, [filtros]);

  const setFiltro = (key, val) => setFiltros(prev => ({ ...prev, [key]: val }));

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Eventos</h1>
        <Link to="/eventos/crear" className="btn-green text-sm">+ Crear evento</Link>
      </div>

      {/* Filtros */}
      <div className="card mb-6 flex flex-wrap gap-3">
        <div className="flex-1 min-w-48">
          <input
            type="text"
            placeholder="Buscar ciudad..."
            value={filtros.ciudad}
            onChange={e => setFiltro('ciudad', e.target.value)}
            className="input w-full text-sm"
          />
        </div>
        <select
          value={filtros.deporte}
          onChange={e => setFiltro('deporte', e.target.value)}
          className="input text-sm min-w-36"
        >
          <option value="">Todos los deportes</option>
          {DEPORTES.map(d => <option key={d} value={d.toLowerCase()}>{d}</option>)}
        </select>
        <select
          value={filtros.estado}
          onChange={e => setFiltro('estado', e.target.value)}
          className="input text-sm min-w-32"
        >
          <option value="abierto">Abiertos</option>
          <option value="lleno">Llenos</option>
          <option value="finalizado">Finalizados</option>
          <option value="">Todos</option>
        </select>
      </div>

      {/* Deportes pills */}
      <div className="flex gap-2 flex-wrap mb-6">
        <button
          onClick={() => setFiltro('deporte', '')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${!filtros.deporte ? 'bg-sp-green text-sp-bg' : 'bg-sp-card border border-sp-border text-gray-400 hover:text-white'}`}
        >
          Todos
        </button>
        {DEPORTES.map(d => (
          <button
            key={d}
            onClick={() => setFiltro('deporte', filtros.deporte === d.toLowerCase() ? '' : d.toLowerCase())}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filtros.deporte === d.toLowerCase() ? 'bg-sp-green text-sp-bg' : 'bg-sp-card border border-sp-border text-gray-400 hover:text-white'}`}
          >
            {d}
          </button>
        ))}
      </div>

      {cargando ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="card animate-pulse h-52" />)}
        </div>
      ) : eventos.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-5xl mb-4">📍</p>
          <p className="text-gray-400 text-lg mb-2">No se encontraron eventos</p>
          <p className="text-gray-500 text-sm mb-6">Intenta con otros filtros o crea el primero</p>
          <Link to="/eventos/crear" className="btn-green">Crear evento</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {eventos.map(ev => <TarjetaEvento key={ev.id} evento={ev} />)}
        </div>
      )}
    </div>
  );
}

function TarjetaEvento({ evento }) {
  const inscritos = parseInt(evento.inscritos) || 0;
  const cupos = evento.cupos || 10;
  const porcentaje = Math.min((inscritos / cupos) * 100, 100);

  const estadoColor = {
    abierto: 'bg-sp-green/20 text-sp-green',
    lleno: 'bg-red-500/20 text-red-400',
    finalizado: 'bg-gray-500/20 text-gray-400',
  };

  return (
    <Link to={`/eventos/${evento.id}`} className="card hover:border-sp-green/50 transition-all hover:-translate-y-0.5 block">
      {evento.foto_url ? (
        <img src={evento.foto_url} alt={evento.nombre} className="w-full h-36 object-cover rounded-lg mb-3" />
      ) : (
        <div className="w-full h-36 rounded-lg mb-3 bg-sp-border flex items-center justify-center text-4xl">
          {evento.deporte === 'futbol' ? '⚽' : evento.deporte === 'basquet' ? '🏀' : evento.deporte === 'tenis' ? '🎾' : '🏃'}
        </div>
      )}
      <div className="flex items-start justify-between gap-2 mb-1">
        <h3 className="font-semibold text-white text-sm leading-tight">{evento.nombre}</h3>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${estadoColor[evento.estado] || estadoColor.abierto}`}>
          {evento.estado}
        </span>
      </div>
      <p className="text-gray-400 text-xs mb-1 flex items-center gap-1">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        </svg>
        {evento.ciudad}
      </p>
      <p className="text-gray-500 text-xs mb-3 flex items-center gap-1">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        {evento.fecha ? new Date(evento.fecha).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
      </p>
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">{inscritos}/{cupos} jugadores</span>
          {evento.precio > 0 && <span className="text-sp-orange">${evento.precio}</span>}
        </div>
        <div className="w-full bg-sp-border rounded-full h-1.5">
          <div className={`h-1.5 rounded-full ${porcentaje >= 100 ? 'bg-red-500' : porcentaje >= 70 ? 'bg-sp-orange' : 'bg-sp-green'}`} style={{ width: `${porcentaje}%` }} />
        </div>
      </div>
    </Link>
  );
}
