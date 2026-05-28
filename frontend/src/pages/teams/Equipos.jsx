import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const DEPORTES = ['futbol', 'basquet', 'tenis', 'padel', 'voley', 'running', 'otro'];

export default function Equipos() {
  const { usuario } = useAuth();
  const [equipos, setEquipos]       = useState([]);
  const [miEquipo, setMiEquipo]     = useState(null);  // equipo donde el user es capitán
  const [retos, setRetos]           = useState([]);
  const [cargando, setCargando]     = useState(true);
  const [filtros, setFiltros]       = useState({ q: '', deporte: '', ciudad: '' });
  const [tab, setTab]               = useState('buscar'); // 'buscar' | 'miequipo' | 'retos'
  const [mostrarCrear, setMostrarCrear] = useState(false);

  const cargarEquipos = useCallback(async () => {
    setCargando(true);
    try {
      const params = new URLSearchParams();
      if (filtros.q)       params.set('q', filtros.q);
      if (filtros.deporte) params.set('deporte', filtros.deporte);
      if (filtros.ciudad)  params.set('ciudad', filtros.ciudad);
      const { data } = await api.get(`/equipos?${params}`);
      setEquipos(data);
    } catch {}
    setCargando(false);
  }, [filtros]);

  const cargarMiEquipo = useCallback(async () => {
    try {
      const { data: retosData } = await api.get('/retos');
      setRetos(retosData);
      // El endpoint de retos requiere ser capitán — si devuelve datos, tenemos equipo
      if (retosData.length > 0) {
        const equipoId = retosData[0].retador_id === retosData[0].retador_id
          ? retosData[0].retador_id || retosData[0].retado_id
          : null;
        if (equipoId) {
          const { data } = await api.get(`/equipos/${retosData[0].retador_id}`);
          setMiEquipo(data);
        }
      }
    } catch {}
    // También intentar obtener equipo del usuario directamente
    try {
      const params = new URLSearchParams({ capitan: usuario?.id || '' });
      // Buscamos equipos donde el usuario es capitán usando buscarEquipos con lógica propia
    } catch {}
  }, [usuario]);

  useEffect(() => { cargarEquipos(); }, [cargarEquipos]);

  // Cargar mi equipo y retos
  useEffect(() => {
    const init = async () => {
      try {
        const { data: retosData } = await api.get('/retos');
        setRetos(retosData);
        if (retosData.length > 0) {
          const id = retosData[0].retador_id;
          const { data } = await api.get(`/equipos/${id}`);
          setMiEquipo(data);
        }
      } catch {}
    };
    init();
  }, []);

  const pendientesRecibidos = retos.filter(r => r.estado === 'pendiente' && miEquipo && r.retado_id === miEquipo.id);
  const pendientesEnviados  = retos.filter(r => r.estado === 'pendiente' && miEquipo && r.retador_id === miEquipo.id);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-impact text-2xl">EQUIPOS</h1>
          <p className="text-sp-muted text-sm mt-0.5">Encuentra tu equipo o crea el tuyo</p>
        </div>
        {!miEquipo && (
          <button onClick={() => setMostrarCrear(p => !p)} className="btn-primary text-xs">
            + CREAR EQUIPO
          </button>
        )}
        {miEquipo && (
          <Link to={`/equipos/${miEquipo.id}`} className="btn-primary text-xs">
            MI EQUIPO
          </Link>
        )}
      </div>

      {/* Formulario crear equipo */}
      {mostrarCrear && (
        <FormularioCrearEquipo
          onCerrar={() => setMostrarCrear(false)}
          onCreado={(eq) => { setMiEquipo(eq); setMostrarCrear(false); }}
        />
      )}

      {/* Tabs */}
      {miEquipo && (
        <div className="flex gap-1 border-b border-sp-border">
          {[
            { key: 'buscar', label: 'Buscar equipos' },
            { key: 'retos', label: `Retos${pendientesRecibidos.length ? ` (${pendientesRecibidos.length})` : ''}` },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 -mb-px ${tab === t.key ? 'border-sp-green text-sp-green' : 'border-transparent text-sp-muted hover:text-white'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* TAB BUSCAR */}
      {tab === 'buscar' && (
        <>
          {/* Filtros */}
          <div className="card flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-36">
              <label className="label">Buscar</label>
              <input
                value={filtros.q}
                onChange={e => setFiltros(p => ({ ...p, q: e.target.value }))}
                placeholder="Nombre del equipo..."
                className="input w-full"
              />
            </div>
            <div>
              <label className="label">Deporte</label>
              <select value={filtros.deporte} onChange={e => setFiltros(p => ({ ...p, deporte: e.target.value }))} className="input">
                <option value="">Todos</option>
                {DEPORTES.map(d => <option key={d} value={d} className="capitalize">{d}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Ciudad</label>
              <input value={filtros.ciudad} onChange={e => setFiltros(p => ({ ...p, ciudad: e.target.value }))} placeholder="Lima..." className="input w-32" />
            </div>
          </div>

          {cargando ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3,4,5,6].map(i => <div key={i} className="card animate-pulse h-40" />)}
            </div>
          ) : equipos.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-5xl mb-4">🛡️</p>
              <p className="text-sp-muted text-lg mb-2">No se encontraron equipos</p>
              {!miEquipo && <button onClick={() => setMostrarCrear(true)} className="btn-primary text-sm mt-2">Crea el primero</button>}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {equipos.map(eq => <TarjetaEquipo key={eq.id} equipo={eq} />)}
            </div>
          )}
        </>
      )}

      {/* TAB RETOS */}
      {tab === 'retos' && miEquipo && (
        <SeccionRetos
          miEquipo={miEquipo}
          retos={retos}
          onRefresh={async () => {
            const { data } = await api.get('/retos');
            setRetos(data);
          }}
        />
      )}
    </div>
  );
}

function TarjetaEquipo({ equipo }) {
  const wins   = parseInt(equipo.wins)   || 0;
  const losses = parseInt(equipo.losses) || 0;
  const draws  = parseInt(equipo.draws)  || 0;
  const total  = wins + losses + draws;
  const pct    = total > 0 ? Math.round((wins / total) * 100) : null;

  return (
    <Link to={`/equipos/${equipo.id}`} className="card hover:border-sp-green/40 transition-all hover:-translate-y-0.5 block">
      <div className="flex items-center gap-3 mb-3">
        {equipo.escudo_url ? (
          <img src={equipo.escudo_url} className="w-12 h-12 rounded-full object-cover border border-sp-border" alt="" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-sp-green/20 flex items-center justify-center text-2xl border border-sp-green/30">
            🛡️
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-impact text-base truncate">{equipo.nombre}</h3>
          <p className="text-sp-muted text-xs capitalize">{equipo.deporte}{equipo.ciudad ? ` · ${equipo.ciudad}` : ''}</p>
        </div>
        {pct !== null && (
          <span className="text-xs font-bold shrink-0" style={{ color: pct >= 50 ? '#1D9E75' : '#888' }}>
            {pct}%W
          </span>
        )}
      </div>

      {/* Record */}
      <div className="flex gap-3 text-xs mb-3">
        <span className="text-sp-green font-bold">{wins}V</span>
        <span className="text-red-400 font-bold">{losses}D</span>
        <span className="text-sp-muted">{draws}E</span>
        <span className="text-sp-muted ml-auto">{equipo.total_miembros} jugadores</span>
      </div>

      {/* Capitán */}
      <div className="flex items-center gap-2 pt-2 border-t border-sp-border">
        {equipo.capitan_foto ? (
          <img src={equipo.capitan_foto} className="w-5 h-5 rounded-full object-cover" alt="" />
        ) : (
          <div className="w-5 h-5 rounded-full bg-sp-green/20 flex items-center justify-center text-xs">👑</div>
        )}
        <span className="text-xs text-sp-muted">@{equipo.capitan_username}</span>
      </div>
    </Link>
  );
}

function SeccionRetos({ miEquipo, retos, onRefresh }) {
  const [respondiendo, setRespondiendo] = useState(null);
  const [enviando, setEnviando]         = useState(false);

  const recibidos  = retos.filter(r => r.retado_id   === miEquipo.id && r.estado === 'pendiente');
  const enviados   = retos.filter(r => r.retador_id  === miEquipo.id && r.estado === 'pendiente');
  const historial  = retos.filter(r => r.estado !== 'pendiente');

  const responder = async (id, accion) => {
    setRespondiendo(id);
    setEnviando(true);
    try {
      await api.put(`/retos/${id}/responder`, { accion });
      await onRefresh();
    } catch {}
    setRespondiendo(null);
    setEnviando(false);
  };

  return (
    <div className="space-y-5">
      {/* Retos recibidos */}
      <div>
        <h2 className="font-impact text-base mb-3 text-yellow-400">RETOS RECIBIDOS {recibidos.length > 0 && `(${recibidos.length})`}</h2>
        {recibidos.length === 0 ? (
          <p className="text-sp-muted text-sm card text-center py-6">Sin retos pendientes</p>
        ) : (
          <div className="space-y-3">
            {recibidos.map(r => (
              <div key={r.id} className="card border-yellow-500/30 flex items-center gap-4">
                {r.retador_escudo ? (
                  <img src={r.retador_escudo} className="w-10 h-10 rounded-full object-cover border border-sp-border shrink-0" alt="" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-sp-green/20 flex items-center justify-center text-xl shrink-0">🛡️</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm">{r.retador_nombre}</p>
                  <p className="text-sp-muted text-xs">te desafía a un partido</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => responder(r.id, 'rechazar')}
                    disabled={enviando && respondiendo === r.id}
                    className="btn-ghost text-xs text-red-400 border-red-500/30 hover:border-red-400"
                  >
                    Rechazar
                  </button>
                  <button
                    onClick={() => responder(r.id, 'aceptar')}
                    disabled={enviando && respondiendo === r.id}
                    className="btn-primary text-xs"
                  >
                    {enviando && respondiendo === r.id ? '...' : 'Aceptar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Retos enviados */}
      {enviados.length > 0 && (
        <div>
          <h2 className="font-impact text-base mb-3 text-sp-muted">ENVIADOS</h2>
          <div className="space-y-3">
            {enviados.map(r => (
              <div key={r.id} className="card flex items-center gap-4 opacity-70">
                {r.retado_escudo ? (
                  <img src={r.retado_escudo} className="w-10 h-10 rounded-full object-cover border border-sp-border shrink-0" alt="" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-sp-green/20 flex items-center justify-center text-xl shrink-0">🛡️</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm">{r.retado_nombre}</p>
                  <p className="text-sp-muted text-xs">esperando respuesta...</p>
                </div>
                <span className="text-xs text-sp-muted shrink-0 badge-white">Pendiente</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Historial */}
      {historial.length > 0 && (
        <div>
          <h2 className="font-impact text-base mb-3 text-sp-muted">HISTORIAL</h2>
          <div className="space-y-2">
            {historial.map(r => {
              const esRetador = r.retador_id === miEquipo.id;
              const rival     = esRetador ? r.retado_nombre : r.retador_nombre;
              const aceptado  = r.estado === 'aceptado';
              return (
                <div key={r.id} className="card flex items-center gap-3">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${aceptado ? 'bg-sp-green/20 text-sp-green' : 'bg-red-900/20 text-red-400'}`}>
                    {aceptado ? 'ACEPTADO' : 'RECHAZADO'}
                  </span>
                  <span className="text-sm text-white flex-1">{rival}</span>
                  <span className="text-xs text-sp-muted">{esRetador ? 'enviado' : 'recibido'}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function FormularioCrearEquipo({ onCerrar, onCreado }) {
  const [form, setForm]     = useState({ nombre: '', deporte: 'futbol', ciudad: '', escudo_url: '' });
  const [cargando, setCargando] = useState(false);
  const [error, setError]   = useState('');
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) { setError('El nombre es requerido'); return; }
    setCargando(true); setError('');
    try {
      const { data } = await api.post('/equipos', form);
      onCreado(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear equipo');
    }
    setCargando(false);
  };

  return (
    <div className="card border-sp-green/30 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-impact text-lg">CREAR EQUIPO</h2>
        <button onClick={onCerrar} className="text-sp-muted hover:text-white text-xl leading-none">×</button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Nombre del equipo *</label>
            <input value={form.nombre} onChange={e => set('nombre', e.target.value)} className="input w-full" placeholder="Los Cracks FC" />
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
            <input value={form.ciudad} onChange={e => set('ciudad', e.target.value)} className="input w-full" placeholder="Lima" />
          </div>
          <div>
            <label className="label">URL del escudo</label>
            <input value={form.escudo_url} onChange={e => set('escudo_url', e.target.value)} className="input w-full" placeholder="https://..." />
          </div>
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <div className="flex gap-3">
          <button type="button" onClick={onCerrar} className="btn-ghost flex-1 text-sm">Cancelar</button>
          <button type="submit" disabled={cargando} className="btn-primary flex-1 text-sm">
            {cargando ? 'CREANDO...' : 'CREAR EQUIPO'}
          </button>
        </div>
      </form>
    </div>
  );
}
