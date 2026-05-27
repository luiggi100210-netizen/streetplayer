import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const DEPORTES = ['futbol', 'basquet', 'tenis', 'padel', 'voley', 'running', 'ciclismo', 'otro'];

export default function CrearEvento() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nombre: '', descripcion: '', deporte: '', ciudad: '',
    direccion: '', fecha: '', cupos: 10, precio: 0,
    nivel_requerido: 'todos', foto_url: '',
  });
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre || !form.deporte || !form.ciudad || !form.fecha) {
      setError('Nombre, deporte, ciudad y fecha son requeridos');
      return;
    }
    setCargando(true);
    setError('');
    try {
      const { data } = await api.post('/eventos', form);
      navigate(`/eventos/${data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear el evento');
    }
    setCargando(false);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Crear evento</h1>
        <p className="text-gray-400 text-sm mt-1">Organiza un partido o entrenamiento</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="card space-y-4">
          <h2 className="font-semibold text-white">Informacion basica</h2>

          <div>
            <label className="label">Nombre del evento *</label>
            <input value={form.nombre} onChange={e => set('nombre', e.target.value)} className="input w-full" placeholder="Ej: Partido 5v5 futbol domingo" />
          </div>

          <div>
            <label className="label">Deporte *</label>
            <div className="flex flex-wrap gap-2">
              {DEPORTES.map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => set('deporte', d)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all border ${form.deporte === d ? 'bg-sp-green text-sp-bg border-sp-green' : 'border-sp-border text-gray-400 hover:text-white hover:border-gray-500'}`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Descripcion</label>
            <textarea value={form.descripcion} onChange={e => set('descripcion', e.target.value)} rows={3} className="input w-full resize-none" placeholder="Describe el evento, reglas, que traer..." />
          </div>
        </div>

        <div className="card space-y-4">
          <h2 className="font-semibold text-white">Fecha y lugar</h2>

          <div>
            <label className="label">Fecha y hora *</label>
            <input type="datetime-local" value={form.fecha} onChange={e => set('fecha', e.target.value)} className="input w-full" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Ciudad *</label>
              <input value={form.ciudad} onChange={e => set('ciudad', e.target.value)} className="input w-full" placeholder="Buenos Aires" />
            </div>
            <div>
              <label className="label">Direccion</label>
              <input value={form.direccion} onChange={e => set('direccion', e.target.value)} className="input w-full" placeholder="Av. Corrientes 1234" />
            </div>
          </div>
        </div>

        <div className="card space-y-4">
          <h2 className="font-semibold text-white">Detalles</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Cupos maximos</label>
              <input type="number" min={2} max={200} value={form.cupos} onChange={e => set('cupos', parseInt(e.target.value) || 2)} className="input w-full" />
            </div>
            <div>
              <label className="label">Precio por persona ($)</label>
              <input type="number" min={0} value={form.precio} onChange={e => set('precio', parseFloat(e.target.value) || 0)} className="input w-full" />
            </div>
          </div>

          <div>
            <label className="label">Nivel requerido</label>
            <select value={form.nivel_requerido} onChange={e => set('nivel_requerido', e.target.value)} className="input w-full">
              <option value="todos">Todos los niveles</option>
              <option value="principiante">Principiante</option>
              <option value="intermedio">Intermedio</option>
              <option value="avanzado">Avanzado</option>
              <option value="profesional">Profesional</option>
            </select>
          </div>

          <div>
            <label className="label">URL de imagen (opcional)</label>
            <input value={form.foto_url} onChange={e => set('foto_url', e.target.value)} className="input w-full" placeholder="https://..." />
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button type="button" onClick={() => navigate(-1)} className="btn-ghost flex-1">Cancelar</button>
          <button type="submit" disabled={cargando} className="btn-green flex-1">
            {cargando ? 'Creando...' : 'Crear evento'}
          </button>
        </div>
      </form>
    </div>
  );
}
