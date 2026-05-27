import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const DEPORTES = ['futbol', 'basquet', 'tenis', 'padel', 'voley', 'running', 'ciclismo', 'otro'];
const TIPOS    = [
  { value: 'pichanga',    label: 'Pichanga',    desc: 'Partido amistoso' },
  { value: 'reto',        label: 'Reto',         desc: 'Desafío entre equipos' },
  { value: 'campeonato',  label: 'Campeonato',   desc: 'Torneo oficial' },
];
const FORMATOS = [5, 6, 7, 8, 9, 10, 11];

export default function CrearEvento() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    titulo: '', tipo: 'pichanga', descripcion: '', deporte: 'futbol',
    nivel: 'todos', nombre_cancha: '', direccion: '',
    fecha_evento: '', formato: 5, cupos_total: 10, precio: 0,
    es_privado: false, foto_url: '',
  });
  const [cargando, setCargando] = useState(false);
  const [error, setError]       = useState('');

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.titulo || !form.deporte || !form.fecha_evento) {
      setError('Título, deporte y fecha son requeridos');
      return;
    }
    setCargando(true);
    setError('');
    try {
      const { data } = await api.post('/eventos', form);
      navigate(`/eventos/${data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear el evento');
      setCargando(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="font-impact text-2xl">Crear evento</h1>
        <p className="text-sp-muted text-sm mt-1">Organiza un partido, reto o campeonato</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Tipo */}
        <div className="card space-y-4">
          <h2 className="font-impact text-base">TIPO DE EVENTO</h2>
          <div className="grid grid-cols-3 gap-3">
            {TIPOS.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => set('tipo', t.value)}
                className={`p-3 rounded-xl border text-left transition-all ${form.tipo === t.value ? 'border-sp-green bg-sp-green/10' : 'border-sp-border hover:border-sp-green/50'}`}
              >
                <p className={`text-sm font-bold ${form.tipo === t.value ? 'text-sp-green' : 'text-white'}`}>{t.label}</p>
                <p className="text-sp-muted text-xs mt-0.5">{t.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Info básica */}
        <div className="card space-y-4">
          <h2 className="font-impact text-base">INFORMACIÓN BÁSICA</h2>

          <div>
            <label className="label">Título del evento *</label>
            <input value={form.titulo} onChange={e => set('titulo', e.target.value)} className="input" placeholder='Ej: "Pichanga dominguera — 5vs5"' />
          </div>

          <div>
            <label className="label">Deporte *</label>
            <div className="flex flex-wrap gap-2">
              {DEPORTES.map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => set('deporte', d)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all border ${form.deporte === d ? 'bg-sp-green text-sp-bg border-sp-green' : 'border-sp-border text-sp-muted hover:text-white hover:border-sp-green/40'}`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Descripción</label>
            <textarea value={form.descripcion} onChange={e => set('descripcion', e.target.value)} rows={3} className="input resize-none" placeholder="Reglas, qué traer, nivel esperado..." />
          </div>
        </div>

        {/* Fecha y lugar */}
        <div className="card space-y-4">
          <h2 className="font-impact text-base">FECHA Y LUGAR</h2>

          <div>
            <label className="label">Fecha y hora *</label>
            <input type="datetime-local" value={form.fecha_evento} onChange={e => set('fecha_evento', e.target.value)} className="input" />
          </div>

          <div>
            <label className="label">Nombre de la cancha</label>
            <input value={form.nombre_cancha} onChange={e => set('nombre_cancha', e.target.value)} className="input" placeholder="Ej: Complejo Deportivo Los Pinos" />
          </div>

          <div>
            <label className="label">Dirección</label>
            <input value={form.direccion} onChange={e => set('direccion', e.target.value)} className="input" placeholder="Av. Principal 1234" />
          </div>
        </div>

        {/* Detalles */}
        <div className="card space-y-4">
          <h2 className="font-impact text-base">DETALLES</h2>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Formato</label>
              <div className="flex flex-wrap gap-1.5">
                {FORMATOS.map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => set('formato', n)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${form.formato === n ? 'bg-sp-green border-sp-green text-white' : 'border-sp-border text-sp-muted hover:text-white'}`}
                  >
                    {n}v{n}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Cupos máx.</label>
              <input type="number" min={2} max={200} value={form.cupos_total} onChange={e => set('cupos_total', parseInt(e.target.value) || 2)} className="input" />
            </div>

            <div>
              <label className="label">Precio (S/)</label>
              <input type="number" min={0} value={form.precio} onChange={e => set('precio', parseFloat(e.target.value) || 0)} className="input" />
            </div>
          </div>

          <div>
            <label className="label">Nivel requerido</label>
            <select value={form.nivel} onChange={e => set('nivel', e.target.value)} className="input">
              <option value="todos">Todos los niveles</option>
              {['rookie','amateur','intermedio','avanzado','pro','elite'].map(n => (
                <option key={n} value={n} className="capitalize">{n}</option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.es_privado} onChange={e => set('es_privado', e.target.checked)} className="w-4 h-4 accent-sp-green" />
            <div>
              <p className="text-sm text-white font-medium">Evento privado</p>
              <p className="text-xs text-sp-muted">Se generará un código de invitación</p>
            </div>
          </label>

          <div>
            <label className="label">URL de imagen (opcional)</label>
            <input value={form.foto_url} onChange={e => set('foto_url', e.target.value)} className="input" placeholder="https://..." />
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="flex gap-3 pb-4">
          <button type="button" onClick={() => navigate(-1)} className="btn-ghost flex-1">Cancelar</button>
          <button type="submit" disabled={cargando} className="btn-primary flex-1">
            {cargando ? 'CREANDO...' : 'CREAR EVENTO'}
          </button>
        </div>
      </form>
    </div>
  );
}
