import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import UploadFoto from '../../components/UploadFoto';

export default function EquipoDetalle() {
  const { id }           = useParams();
  const { usuario }      = useAuth();
  const navigate         = useNavigate();
  const [equipo, setEquipo]     = useState(null);
  const [cargando, setCargando] = useState(true);
  const [tab, setTab]           = useState('miembros');

  // Estado edición
  const [editando, setEditando] = useState(false);
  const [formEdit, setFormEdit] = useState({});
  const [guardando, setGuardando] = useState(false);

  // Invitar miembro
  const [busquedaUser, setBusquedaUser] = useState('');
  const [resultados, setResultados]     = useState([]);
  const [invitando, setInvitando]       = useState(null);

  // Retar
  const [retando, setRetando]   = useState(false);
  const [miEquipoId, setMiEquipoId] = useState(null);

  const soyCapitan = equipo?.capitan_id === usuario?.id;

  const cargar = async () => {
    setCargando(true);
    try {
      const { data } = await api.get(`/equipos/${id}`);
      setEquipo(data);
      setFormEdit({
        nombre:     data.nombre     || '',
        ciudad:     data.ciudad     || '',
        deporte:    data.deporte    || 'futbol',
        escudo_url: data.escudo_url || '',
      });
    } catch {
      navigate('/equipos');
    }
    setCargando(false);
  };

  // Obtener si el usuario es capitán de algún equipo (para poder retar)
  useEffect(() => {
    const detectarEquipo = async () => {
      try {
        const { data } = await api.get('/retos');
        if (data.length > 0) setMiEquipoId(data[0].retador_id || data[0].retado_id);
      } catch {}
    };
    detectarEquipo();
  }, []);

  useEffect(() => { cargar(); }, [id]);

  const guardarEdicion = async () => {
    setGuardando(true);
    try {
      const { data } = await api.put(`/equipos/${id}`, formEdit);
      setEquipo(p => ({ ...p, ...data }));
      setEditando(false);
    } catch {}
    setGuardando(false);
  };

  const buscarUsuarios = async (q) => {
    setBusquedaUser(q);
    if (q.length < 2) { setResultados([]); return; }
    try {
      const { data } = await api.get(`/usuarios/buscar?q=${encodeURIComponent(q)}`);
      setResultados(data.slice(0, 5));
    } catch {}
  };

  const invitar = async (usuarioId) => {
    setInvitando(usuarioId);
    try {
      await api.post(`/equipos/${id}/miembros`, { usuario_id: usuarioId });
      setBusquedaUser(''); setResultados([]);
      await cargar();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al invitar');
    }
    setInvitando(null);
  };

  const expulsar = async (usuarioId) => {
    if (!confirm('¿Expulsar a este jugador?')) return;
    try {
      await api.delete(`/equipos/${id}/miembros/${usuarioId}`);
      await cargar();
    } catch (err) {
      alert(err.response?.data?.error || 'Error');
    }
  };

  const salir = async () => {
    if (!confirm('¿Salir del equipo?')) return;
    try {
      await api.delete(`/equipos/${id}/salir`);
      navigate('/equipos');
    } catch (err) {
      alert(err.response?.data?.error || 'Error');
    }
  };

  const disolver = async () => {
    if (!confirm('¿Disolver el equipo? Esta acción no se puede deshacer.')) return;
    try {
      await api.delete(`/equipos/${id}`);
      navigate('/equipos');
    } catch (err) {
      alert(err.response?.data?.error || 'Error');
    }
  };

  const retar = async () => {
    if (!miEquipoId) { alert('Debes ser capitán de un equipo para retar'); return; }
    setRetando(true);
    try {
      await api.post('/retos', { equipo_retado_id: id });
      alert('¡Reto enviado! El capitán rival recibirá una notificación.');
    } catch (err) {
      alert(err.response?.data?.error || 'Error al enviar reto');
    }
    setRetando(false);
  };

  if (cargando) return (
    <div className="max-w-3xl mx-auto px-4 py-6 animate-pulse space-y-4">
      <div className="h-40 bg-sp-card rounded-xl" />
      <div className="h-64 bg-sp-card rounded-xl" />
    </div>
  );

  if (!equipo) return null;

  const wins   = parseInt(equipo.wins)   || 0;
  const losses = parseInt(equipo.losses) || 0;
  const draws  = parseInt(equipo.draws)  || 0;
  const total  = wins + losses + draws;
  const pct    = total > 0 ? Math.round((wins / total) * 100) : null;

  const soyMiembro = equipo.miembros?.some(m => m.id === usuario?.id);
  const puedeRetar = miEquipoId && miEquipoId !== id && !soyCapitan;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      {/* HEADER */}
      <div className="card">
        <div className="flex items-start gap-5">
          {equipo.escudo_url ? (
            <img src={equipo.escudo_url} className="w-20 h-20 rounded-full object-cover border-2 border-sp-green/40 shrink-0" alt="" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-sp-green/20 flex items-center justify-center text-4xl border-2 border-sp-green/30 shrink-0">
              🛡️
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h1 className="font-impact text-2xl">{equipo.nombre}</h1>
                <p className="text-sp-muted text-sm capitalize">{equipo.deporte}{equipo.ciudad ? ` · ${equipo.ciudad}` : ''}</p>
              </div>

              <div className="flex gap-2 shrink-0">
                {puedeRetar && (
                  <button onClick={retar} disabled={retando} className="btn-primary text-xs">
                    {retando ? '...' : '⚔️ RETAR'}
                  </button>
                )}
                {soyCapitan && (
                  <button onClick={() => setEditando(p => !p)} className="btn-ghost text-xs">
                    {editando ? 'Cancelar' : 'Editar'}
                  </button>
                )}
                {soyMiembro && !soyCapitan && (
                  <button onClick={salir} className="btn-ghost text-xs text-red-400 border-red-500/30">
                    Salir
                  </button>
                )}
              </div>
            </div>

            {/* Record */}
            <div className="flex gap-4 mt-3 text-sm">
              <div className="text-center">
                <p className="font-impact text-xl text-sp-green">{wins}</p>
                <p className="text-sp-muted text-xs">Victorias</p>
              </div>
              <div className="text-center">
                <p className="font-impact text-xl text-sp-muted">{draws}</p>
                <p className="text-sp-muted text-xs">Empates</p>
              </div>
              <div className="text-center">
                <p className="font-impact text-xl text-red-400">{losses}</p>
                <p className="text-sp-muted text-xs">Derrotas</p>
              </div>
              {pct !== null && (
                <div className="text-center ml-2">
                  <p className="font-impact text-xl" style={{ color: pct >= 50 ? '#1D9E75' : '#888' }}>{pct}%</p>
                  <p className="text-sp-muted text-xs">Win rate</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Capitán */}
        <div className="mt-4 pt-3 border-t border-sp-border flex items-center gap-2">
          <span className="text-xs text-sp-muted uppercase tracking-wider">Capitán:</span>
          <Link to={`/perfil/${equipo.capitan_id}`} className="flex items-center gap-2 hover:text-sp-green transition-colors">
            {equipo.capitan_foto ? (
              <img src={equipo.capitan_foto} className="w-6 h-6 rounded-full object-cover" alt="" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-sp-green flex items-center justify-center text-xs text-white font-bold">
                {equipo.capitan_username?.[0]?.toUpperCase()}
              </div>
            )}
            <span className="text-sm font-semibold">@{equipo.capitan_username}</span>
          </Link>
          <span className="ml-auto text-xs text-sp-muted">{equipo.miembros?.length || 0} jugadores</span>
        </div>
      </div>

      {/* EDITOR */}
      {editando && soyCapitan && (
        <div className="card border-sp-green/30 space-y-4">
          <h2 className="font-impact text-base">EDITAR EQUIPO</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Nombre</label>
              <input value={formEdit.nombre} onChange={e => setFormEdit(p => ({ ...p, nombre: e.target.value }))} className="input w-full" />
            </div>
            <div>
              <label className="label">Ciudad</label>
              <input value={formEdit.ciudad} onChange={e => setFormEdit(p => ({ ...p, ciudad: e.target.value }))} className="input w-full" />
            </div>
          </div>
          <UploadFoto
            label="Escudo del equipo"
            value={formEdit.escudo_url}
            onChange={url => setFormEdit(p => ({ ...p, escudo_url: url }))}
            rounded
            size={80}
          />
          <div className="flex gap-3">
            <button onClick={guardarEdicion} disabled={guardando} className="btn-primary flex-1 text-sm">
              {guardando ? 'GUARDANDO...' : 'GUARDAR'}
            </button>
            <button onClick={disolver} className="btn-ghost text-sm text-red-400 border-red-500/30">
              Disolver equipo
            </button>
          </div>
        </div>
      )}

      {/* TABS */}
      <div className="flex gap-1 border-b border-sp-border">
        {['miembros', ...(soyCapitan ? ['invitar'] : [])].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 -mb-px ${tab === t ? 'border-sp-green text-sp-green' : 'border-transparent text-sp-muted hover:text-white'}`}
          >
            {t === 'miembros' ? `Miembros (${equipo.miembros?.length || 0})` : 'Invitar jugador'}
          </button>
        ))}
      </div>

      {/* TAB MIEMBROS */}
      {tab === 'miembros' && (
        <div className="space-y-2">
          {equipo.miembros?.length === 0 && (
            <p className="text-center text-sp-muted text-sm py-8">Sin miembros aún</p>
          )}
          {equipo.miembros?.map(m => (
            <div key={m.id} className="card flex items-center gap-3">
              <Link to={`/perfil/${m.id}`} className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity">
                {m.foto_url ? (
                  <img src={m.foto_url} className="w-10 h-10 rounded-full object-cover border border-sp-border shrink-0" alt="" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-sp-green/20 flex items-center justify-center text-base font-bold text-white shrink-0">
                    {m.username?.[0]?.toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{m.nombre || m.username}</p>
                  <p className="text-sp-muted text-xs">@{m.username}</p>
                </div>
              </Link>

              <div className="flex items-center gap-2 shrink-0">
                {m.rol === 'capitan' && <span className="badge-green text-xs">Capitán</span>}
                <span className="text-xs text-sp-muted capitalize">{m.nivel_xp || 'rookie'}</span>
                {soyCapitan && m.id !== usuario?.id && (
                  <button
                    onClick={() => expulsar(m.id)}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors ml-1"
                    title="Expulsar"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB INVITAR */}
      {tab === 'invitar' && soyCapitan && (
        <div className="card space-y-4">
          <div>
            <label className="label">Buscar jugador por nombre o username</label>
            <input
              value={busquedaUser}
              onChange={e => buscarUsuarios(e.target.value)}
              className="input w-full"
              placeholder="Escribe al menos 2 caracteres..."
            />
          </div>

          {resultados.length > 0 && (
            <div className="space-y-2">
              {resultados.map(u => {
                const yaEsMiembro = equipo.miembros?.some(m => m.id === u.id);
                return (
                  <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl bg-sp-bg border border-sp-border">
                    {u.foto_url ? (
                      <img src={u.foto_url} className="w-9 h-9 rounded-full object-cover shrink-0" alt="" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-sp-green/20 flex items-center justify-center text-white font-bold shrink-0">
                        {u.username?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-semibold truncate">{u.nombre || u.username}</p>
                      <p className="text-xs text-sp-muted">@{u.username}</p>
                    </div>
                    {yaEsMiembro ? (
                      <span className="text-xs text-sp-muted">Ya es miembro</span>
                    ) : (
                      <button
                        onClick={() => invitar(u.id)}
                        disabled={invitando === u.id}
                        className="btn-primary text-xs shrink-0"
                      >
                        {invitando === u.id ? '...' : 'Invitar'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {busquedaUser.length >= 2 && resultados.length === 0 && (
            <p className="text-sp-muted text-sm text-center py-4">No se encontraron usuarios</p>
          )}
        </div>
      )}
    </div>
  );
}
