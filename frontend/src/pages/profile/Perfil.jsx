import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Perfil() {
  const { id } = useParams();
  const { usuario: yo } = useAuth();
  const [perfil, setPerfil] = useState(null);
  const [publicaciones, setPublicaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [siguiendo, setSiguiendo] = useState(false);
  const [accionando, setAccionando] = useState(false);
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({});
  const [guardando, setGuardando] = useState(false);

  const esMiPerfil = yo?.id === id;

  useEffect(() => {
    const cargar = async () => {
      setCargando(true);
      try {
        const [perfilRes, pubRes] = await Promise.all([
          api.get(`/usuarios/${id}`),
          api.get(`/usuarios/${id}/publicaciones`),
        ]);
        setPerfil(perfilRes.data);
        setPublicaciones(pubRes.data);
        setSiguiendo(perfilRes.data.siguiendo_yo || false);
        setForm({
          nombre: perfilRes.data.nombre || '',
          bio: perfilRes.data.bio || '',
          ciudad: perfilRes.data.ciudad || '',
          deportes: perfilRes.data.deportes || [],
          nivel: perfilRes.data.nivel || 'principiante',
          foto_url: perfilRes.data.foto_url || '',
        });
      } catch {}
      setCargando(false);
    };
    cargar();
  }, [id]);

  const handleSeguir = async () => {
    setAccionando(true);
    try {
      await api.post(`/usuarios/${id}/seguir`);
      setSiguiendo(!siguiendo);
      setPerfil(prev => ({
        ...prev,
        seguidores: siguiendo ? prev.seguidores - 1 : prev.seguidores + 1,
      }));
    } catch {}
    setAccionando(false);
  };

  const handleGuardar = async () => {
    setGuardando(true);
    try {
      const { data } = await api.put('/usuarios/perfil', form);
      setPerfil(prev => ({ ...prev, ...data }));
      setEditando(false);
    } catch {}
    setGuardando(false);
  };

  if (cargando) return (
    <div className="max-w-3xl mx-auto px-4 py-6 animate-pulse">
      <div className="card mb-6">
        <div className="flex gap-4 items-start">
          <div className="w-20 h-20 rounded-full bg-sp-border" />
          <div className="flex-1 space-y-2">
            <div className="h-5 bg-sp-border rounded w-1/3" />
            <div className="h-3 bg-sp-border rounded w-1/4" />
            <div className="h-3 bg-sp-border rounded w-1/2" />
          </div>
        </div>
      </div>
    </div>
  );

  if (!perfil) return <div className="text-center py-20 text-gray-400">Usuario no encontrado</div>;

  const DEPORTES_LIST = ['futbol', 'basquet', 'tenis', 'padel', 'voley', 'running', 'ciclismo', 'otro'];

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="card mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-4 items-start flex-1">
            {perfil.foto_url ? (
              <img src={perfil.foto_url} className="w-20 h-20 rounded-full object-cover border-2 border-sp-green" alt={perfil.username} />
            ) : (
              <div className="w-20 h-20 rounded-full bg-sp-green/20 flex items-center justify-center text-sp-green text-3xl font-bold border-2 border-sp-green">
                {perfil.username?.[0]?.toUpperCase()}
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-xl font-bold text-white">{perfil.nombre || perfil.username}</h1>
              <p className="text-gray-400 text-sm">@{perfil.username}</p>
              {perfil.ciudad && <p className="text-gray-500 text-xs mt-1">{perfil.ciudad}</p>}
              {perfil.bio && <p className="text-gray-300 text-sm mt-2 leading-relaxed">{perfil.bio}</p>}
            </div>
          </div>
          {esMiPerfil ? (
            <button onClick={() => setEditando(!editando)} className="btn-ghost text-sm">
              {editando ? 'Cancelar' : 'Editar perfil'}
            </button>
          ) : (
            <button onClick={handleSeguir} disabled={accionando} className={siguiendo ? 'btn-ghost text-sm' : 'btn-green text-sm'}>
              {accionando ? '...' : siguiendo ? 'Siguiendo' : 'Seguir'}
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-sp-border text-center">
          <div>
            <p className="text-sp-green font-bold text-lg">{perfil.partidos_jugados || 0}</p>
            <p className="text-gray-500 text-xs">Partidos</p>
          </div>
          <div>
            <p className="text-white font-bold text-lg">{perfil.seguidores || 0}</p>
            <p className="text-gray-500 text-xs">Seguidores</p>
          </div>
          <div>
            <p className="text-white font-bold text-lg">{perfil.siguiendo || 0}</p>
            <p className="text-gray-500 text-xs">Siguiendo</p>
          </div>
          <div>
            <p className="text-sp-orange font-bold text-lg capitalize">{perfil.nivel || '-'}</p>
            <p className="text-gray-500 text-xs">Nivel</p>
          </div>
        </div>

        {/* Deportes */}
        {perfil.deportes?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {perfil.deportes.map(d => (
              <span key={d} className="badge-green text-xs capitalize">{d}</span>
            ))}
          </div>
        )}
      </div>

      {/* Formulario edicion */}
      {editando && (
        <div className="card mb-6 space-y-4">
          <h2 className="font-semibold text-white">Editar perfil</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Nombre</label>
              <input value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} className="input w-full" />
            </div>
            <div>
              <label className="label">Ciudad</label>
              <input value={form.ciudad} onChange={e => setForm(p => ({ ...p, ciudad: e.target.value }))} className="input w-full" />
            </div>
          </div>
          <div>
            <label className="label">Bio</label>
            <textarea value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} rows={3} className="input w-full resize-none" placeholder="Cuéntanos sobre ti..." />
          </div>
          <div>
            <label className="label">Nivel</label>
            <select value={form.nivel} onChange={e => setForm(p => ({ ...p, nivel: e.target.value }))} className="input w-full">
              {['principiante', 'intermedio', 'avanzado', 'profesional'].map(n => (
                <option key={n} value={n} className="capitalize">{n}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Deportes</label>
            <div className="flex flex-wrap gap-2">
              {DEPORTES_LIST.map(d => {
                const seleccionado = form.deportes?.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setForm(p => ({ ...p, deportes: seleccionado ? p.deportes.filter(x => x !== d) : [...(p.deportes || []), d] }))}
                    className={`px-3 py-1 rounded-full text-xs capitalize border transition-all ${seleccionado ? 'bg-sp-green text-sp-bg border-sp-green' : 'border-sp-border text-gray-400 hover:text-white'}`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="label">URL de foto</label>
            <input value={form.foto_url} onChange={e => setForm(p => ({ ...p, foto_url: e.target.value }))} className="input w-full" placeholder="https://..." />
          </div>
          <button onClick={handleGuardar} disabled={guardando} className="btn-green w-full">
            {guardando ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      )}

      {/* Publicaciones */}
      <div className="space-y-4">
        <h2 className="font-semibold text-white">Publicaciones</h2>
        {publicaciones.length === 0 ? (
          <div className="card text-center py-10">
            <p className="text-gray-400 text-sm">Sin publicaciones aun</p>
          </div>
        ) : (
          publicaciones.map(pub => (
            <div key={pub.id} className="card">
              {pub.contenido && <p className="text-gray-200 text-sm mb-3">{pub.contenido}</p>}
              {pub.imagen_url && <img src={pub.imagen_url} alt="Post" className="w-full rounded-lg mb-3 max-h-80 object-cover" />}
              <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t border-sp-border">
                <span>{pub.likes_count || 0} likes</span>
                <span>{pub.comentarios_count || 0} comentarios</span>
                <span className="ml-auto">{formatDistanceToNow(new Date(pub.fecha), { addSuffix: true, locale: es })}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
