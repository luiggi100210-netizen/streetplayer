import { useState, useEffect } from 'react';
import api from '../services/api';

export default function Anuncios() {
  const [anuncios, setAnuncios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState({ titulo: '', imagen_url: '', url_destino: '', fecha_inicio: '', fecha_fin: '' });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const cargar = async () => {
    setCargando(true);
    try {
      const { data } = await api.get('/admin/anuncios');
      setAnuncios(data);
    } catch {}
    setCargando(false);
  };

  useEffect(() => { cargar(); }, []);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleCrear = async (e) => {
    e.preventDefault();
    if (!form.titulo) { setError('El titulo es requerido'); return; }
    setGuardando(true);
    setError('');
    try {
      await api.post('/admin/anuncios', form);
      setForm({ titulo: '', imagen_url: '', url_destino: '', fecha_inicio: '', fecha_fin: '' });
      setMostrarForm(false);
      cargar();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear anuncio');
    }
    setGuardando(false);
  };

  const esActivo = (a) => {
    const ahora = new Date();
    const inicio = a.fecha_inicio ? new Date(a.fecha_inicio) : null;
    const fin = a.fecha_fin ? new Date(a.fecha_fin) : null;
    if (inicio && ahora < inicio) return false;
    if (fin && ahora > fin) return false;
    return true;
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Anuncios</h1>
          <p className="text-gray-400 text-sm mt-1">Publicidad y banners de la plataforma</p>
        </div>
        <button onClick={() => setMostrarForm(!mostrarForm)} className="btn-green text-sm">
          + Nuevo anuncio
        </button>
      </div>

      {mostrarForm && (
        <form onSubmit={handleCrear} className="card mb-6 space-y-4 border-sp-green/30">
          <h2 className="font-semibold text-white">Crear anuncio</h2>
          <div>
            <label className="label">Titulo *</label>
            <input value={form.titulo} onChange={e => set('titulo', e.target.value)} className="input w-full" placeholder="Nombre del anuncio" />
          </div>
          <div>
            <label className="label">URL de imagen</label>
            <input value={form.imagen_url} onChange={e => set('imagen_url', e.target.value)} className="input w-full" placeholder="https://..." />
          </div>
          <div>
            <label className="label">URL destino (click)</label>
            <input value={form.url_destino} onChange={e => set('url_destino', e.target.value)} className="input w-full" placeholder="https://..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Fecha inicio</label>
              <input type="date" value={form.fecha_inicio} onChange={e => set('fecha_inicio', e.target.value)} className="input w-full" />
            </div>
            <div>
              <label className="label">Fecha fin</label>
              <input type="date" value={form.fecha_fin} onChange={e => set('fecha_fin', e.target.value)} className="input w-full" />
            </div>
          </div>
          {form.imagen_url && (
            <div>
              <p className="label">Preview</p>
              <img src={form.imagen_url} alt="Preview" className="w-full max-h-32 object-cover rounded-lg" onError={e => e.target.style.display = 'none'} />
            </div>
          )}
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={() => setMostrarForm(false)} className="btn-ghost flex-1 text-sm">Cancelar</button>
            <button type="submit" disabled={guardando} className="btn-green flex-1 text-sm">
              {guardando ? 'Guardando...' : 'Crear anuncio'}
            </button>
          </div>
        </form>
      )}

      {cargando ? (
        <div className="space-y-3">
          {[1,2].map(i => <div key={i} className="card animate-pulse h-24" />)}
        </div>
      ) : anuncios.length === 0 ? (
        <div className="text-center py-16 card">
          <p className="text-4xl mb-3">📢</p>
          <p className="text-gray-400">Sin anuncios creados</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {anuncios.map(a => (
            <div key={a.id} className={`card ${esActivo(a) ? 'border-sp-green/30' : 'opacity-60'}`}>
              {a.imagen_url && (
                <img src={a.imagen_url} alt={a.titulo} className="w-full h-28 object-cover rounded-lg mb-3" />
              )}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-white text-sm">{a.titulo}</h3>
                  {a.url_destino && <p className="text-gray-500 text-xs truncate mt-0.5">{a.url_destino}</p>}
                </div>
                <span className={esActivo(a) ? 'badge-green' : 'badge-gray'}>
                  {esActivo(a) ? 'activo' : 'inactivo'}
                </span>
              </div>
              {(a.fecha_inicio || a.fecha_fin) && (
                <p className="text-gray-500 text-xs mt-2">
                  {a.fecha_inicio ? new Date(a.fecha_inicio).toLocaleDateString('es-ES') : '∞'}
                  {' → '}
                  {a.fecha_fin ? new Date(a.fecha_fin).toLocaleDateString('es-ES') : '∞'}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
