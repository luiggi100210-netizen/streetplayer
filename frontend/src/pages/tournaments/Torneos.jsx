import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const DEPORTES = ['futbol', 'basquet', 'tenis', 'padel', 'voley'];

export default function Torneos() {
  const [torneos, setTorneos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtros, setFiltros] = useState({ deporte: '', ciudad: '', estado: 'abierto' });
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const cargar = async () => {
    setCargando(true);
    try {
      const params = new URLSearchParams();
      if (filtros.deporte) params.set('deporte', filtros.deporte);
      if (filtros.ciudad) params.set('ciudad', filtros.ciudad);
      if (filtros.estado) params.set('estado', filtros.estado);
      const { data } = await api.get(`/torneos?${params}`);
      setTorneos(data);
    } catch {}
    setCargando(false);
  };

  useEffect(() => { cargar(); }, [filtros]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Torneos</h1>
          <p className="text-gray-400 text-sm mt-1">Competencias organizadas por la comunidad</p>
        </div>
        <button onClick={() => setMostrarFormulario(!mostrarFormulario)} className="btn-orange text-sm">
          + Proponer torneo
        </button>
      </div>

      {mostrarFormulario && <FormularioTorneo onCerrar={() => setMostrarFormulario(false)} onCreado={() => { setMostrarFormulario(false); cargar(); }} />}

      {/* Filtros */}
      <div className="card mb-6 flex flex-wrap gap-3">
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFiltros(p => ({ ...p, estado: 'abierto' }))} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filtros.estado === 'abierto' ? 'bg-sp-green text-sp-bg' : 'bg-sp-border text-gray-400 hover:text-white'}`}>
            Abiertos
          </button>
          <button onClick={() => setFiltros(p => ({ ...p, estado: 'en_curso' }))} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filtros.estado === 'en_curso' ? 'bg-sp-orange text-white' : 'bg-sp-border text-gray-400 hover:text-white'}`}>
            En curso
          </button>
          <button onClick={() => setFiltros(p => ({ ...p, estado: 'finalizado' }))} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filtros.estado === 'finalizado' ? 'bg-gray-500 text-white' : 'bg-sp-border text-gray-400 hover:text-white'}`}>
            Finalizados
          </button>
        </div>
        <div className="flex gap-2 ml-auto">
          <select value={filtros.deporte} onChange={e => setFiltros(p => ({ ...p, deporte: e.target.value }))} className="input text-sm">
            <option value="">Todos los deportes</option>
            {DEPORTES.map(d => <option key={d} value={d} className="capitalize">{d}</option>)}
          </select>
          <input value={filtros.ciudad} onChange={e => setFiltros(p => ({ ...p, ciudad: e.target.value }))} placeholder="Ciudad..." className="input text-sm w-32" />
        </div>
      </div>

      {cargando ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="card animate-pulse h-52" />)}
        </div>
      ) : torneos.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-5xl mb-4">🏆</p>
          <p className="text-gray-400 text-lg mb-2">No hay torneos disponibles</p>
          <p className="text-gray-500 text-sm">Propone el primero y lo revisaremos</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {torneos.map(t => <TarjetaTorneo key={t.id} torneo={t} />)}
        </div>
      )}
    </div>
  );
}

function TarjetaTorneo({ torneo }) {
  const inscritos = parseInt(torneo.equipos_inscritos) || 0;
  const max = torneo.max_equipos || 8;

  return (
    <Link to={`/torneos/${torneo.id}`} className="card hover:border-sp-orange/50 transition-all hover:-translate-y-0.5 block">
      {torneo.foto_url ? (
        <img src={torneo.foto_url} alt={torneo.nombre} className="w-full h-36 object-cover rounded-lg mb-3" />
      ) : (
        <div className="w-full h-24 rounded-lg mb-3 bg-gradient-to-br from-sp-orange/20 to-sp-green/20 flex items-center justify-center text-4xl">
          🏆
        </div>
      )}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-white text-sm leading-tight">{torneo.nombre}</h3>
        <span className="badge-orange text-xs capitalize shrink-0">{torneo.deporte}</span>
      </div>
      <p className="text-gray-400 text-xs mb-1">{torneo.ciudad}</p>
      <p className="text-gray-500 text-xs mb-3">
        {torneo.fecha_inicio ? new Date(torneo.fecha_inicio).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
        {torneo.fecha_fin ? ` → ${new Date(torneo.fecha_fin).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}` : ''}
      </p>
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-400">{inscritos}/{max} equipos</span>
        {torneo.premio && <span className="text-sp-orange font-medium">{torneo.premio}</span>}
        <span className="capitalize px-2 py-0.5 rounded-full text-xs bg-sp-border text-gray-400">{torneo.formato || 'eliminacion'}</span>
      </div>
    </Link>
  );
}

function FormularioTorneo({ onCerrar, onCreado }) {
  const [form, setForm] = useState({
    nombre: '', descripcion: '', deporte: 'futbol', ciudad: '',
    fecha_inicio: '', fecha_fin: '', max_equipos: 8,
    premio: '', precio_inscripcion: 0, formato: 'eliminacion',
  });
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre || !form.deporte || !form.fecha_inicio) {
      setError('Nombre, deporte y fecha de inicio son requeridos');
      return;
    }
    setCargando(true);
    setError('');
    try {
      await api.post('/torneos', form);
      onCreado();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear torneo');
    }
    setCargando(false);
  };

  return (
    <div className="card mb-6 border-sp-orange/30">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-white">Proponer torneo</h2>
        <button onClick={onCerrar} className="text-gray-400 hover:text-white text-xl">x</button>
      </div>
      <p className="text-gray-500 text-xs mb-4">Tu propuesta sera revisada por el equipo antes de publicarse.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Nombre *</label>
            <input value={form.nombre} onChange={e => set('nombre', e.target.value)} className="input w-full" placeholder="Copa Verano 2026" />
          </div>
          <div>
            <label className="label">Deporte *</label>
            <select value={form.deporte} onChange={e => set('deporte', e.target.value)} className="input w-full">
              {DEPORTES.map(d => <option key={d} value={d} className="capitalize">{d}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Ciudad</label>
            <input value={form.ciudad} onChange={e => set('ciudad', e.target.value)} className="input w-full" />
          </div>
          <div>
            <label className="label">Formato</label>
            <select value={form.formato} onChange={e => set('formato', e.target.value)} className="input w-full">
              <option value="eliminacion">Eliminacion directa</option>
              <option value="grupos">Fase de grupos</option>
              <option value="liguilla">Liguilla</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Inicio *</label>
            <input type="date" value={form.fecha_inicio} onChange={e => set('fecha_inicio', e.target.value)} className="input w-full" />
          </div>
          <div>
            <label className="label">Fin</label>
            <input type="date" value={form.fecha_fin} onChange={e => set('fecha_fin', e.target.value)} className="input w-full" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="label">Max equipos</label>
            <input type="number" min={4} value={form.max_equipos} onChange={e => set('max_equipos', parseInt(e.target.value) || 4)} className="input w-full" />
          </div>
          <div>
            <label className="label">Inscripcion ($)</label>
            <input type="number" min={0} value={form.precio_inscripcion} onChange={e => set('precio_inscripcion', parseFloat(e.target.value) || 0)} className="input w-full" />
          </div>
          <div>
            <label className="label">Premio</label>
            <input value={form.premio} onChange={e => set('premio', e.target.value)} className="input w-full" placeholder="Copa + medallas" />
          </div>
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <div className="flex gap-3">
          <button type="button" onClick={onCerrar} className="btn-ghost flex-1 text-sm">Cancelar</button>
          <button type="submit" disabled={cargando} className="btn-orange flex-1 text-sm">
            {cargando ? 'Enviando...' : 'Enviar propuesta'}
          </button>
        </div>
      </form>
    </div>
  );
}
