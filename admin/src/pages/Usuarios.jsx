import { useState, useEffect } from 'react';
import api from '../services/api';

const ESTADOS = ['activo', 'suspendido', 'baneado'];

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [buscar, setBuscar] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null); // { usuario, estado, motivo }

  const cargar = async () => {
    setCargando(true);
    try {
      const params = new URLSearchParams({ page });
      if (buscar) params.set('buscar', buscar);
      if (filtroEstado) params.set('estado', filtroEstado);
      const { data } = await api.get(`/admin/usuarios?${params}`);
      setUsuarios(data);
    } catch {}
    setCargando(false);
  };

  useEffect(() => { cargar(); }, [buscar, filtroEstado, page]);

  const handleCambiarEstado = async () => {
    if (!modal) return;
    try {
      await api.put(`/admin/usuarios/${modal.usuario.id}/estado`, { estado: modal.estado, motivo: modal.motivo });
      setModal(null);
      cargar();
    } catch {}
  };

  const estadoBadge = (estado) => {
    if (estado === 'activo') return <span className="badge-green">activo</span>;
    if (estado === 'suspendido') return <span className="badge-orange">suspendido</span>;
    return <span className="badge-red">baneado</span>;
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Usuarios</h1>
        <p className="text-gray-400 text-sm mt-1">Gestiona los usuarios de la plataforma</p>
      </div>

      {/* Filtros */}
      <div className="card mb-4 flex flex-wrap gap-3">
        <input
          value={buscar}
          onChange={e => { setBuscar(e.target.value); setPage(1); }}
          placeholder="Buscar por nombre, email, usuario..."
          className="input flex-1 min-w-48 text-sm"
        />
        <div className="flex gap-2">
          <button onClick={() => { setFiltroEstado(''); setPage(1); }} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${!filtroEstado ? 'bg-sp-green text-sp-bg' : 'bg-sp-border text-gray-400 hover:text-white'}`}>
            Todos
          </button>
          {ESTADOS.map(e => (
            <button key={e} onClick={() => { setFiltroEstado(e); setPage(1); }} className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${filtroEstado === e ? 'bg-sp-green text-sp-bg' : 'bg-sp-border text-gray-400 hover:text-white'}`}>
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-sp-border">
                <th className="text-left text-gray-500 font-medium px-4 py-3">Usuario</th>
                <th className="text-left text-gray-500 font-medium px-4 py-3">Email</th>
                <th className="text-left text-gray-500 font-medium px-4 py-3">Ciudad</th>
                <th className="text-left text-gray-500 font-medium px-4 py-3">Partidos</th>
                <th className="text-left text-gray-500 font-medium px-4 py-3">Estado</th>
                <th className="text-left text-gray-500 font-medium px-4 py-3">Registro</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-sp-border">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-sp-border animate-pulse rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : usuarios.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-500">Sin resultados</td></tr>
              ) : (
                usuarios.map(u => (
                  <tr key={u.id} className="table-row">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-white font-medium">{u.nombre || u.username}</p>
                        <p className="text-gray-500 text-xs">@{u.username}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-300">{u.email}</td>
                    <td className="px-4 py-3 text-gray-400">{u.ciudad || '-'}</td>
                    <td className="px-4 py-3 text-gray-300">{u.partidos_jugados || 0}</td>
                    <td className="px-4 py-3">{estadoBadge(u.estado)}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{u.fecha_registro ? new Date(u.fecha_registro).toLocaleDateString('es-ES') : '-'}</td>
                    <td className="px-4 py-3">
                      <select
                        value={u.estado}
                        onChange={e => setModal({ usuario: u, estado: e.target.value, motivo: '' })}
                        className="input text-xs py-1 px-2"
                      >
                        {ESTADOS.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-sp-border">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost text-xs py-1.5">Anterior</button>
          <span className="text-gray-400 text-sm">Pagina {page}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={usuarios.length < 30} className="btn-ghost text-xs py-1.5">Siguiente</button>
        </div>
      </div>

      {/* Modal confirmacion */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-sm">
            <h3 className="font-semibold text-white mb-2">Cambiar estado de usuario</h3>
            <p className="text-gray-400 text-sm mb-4">
              Cambiar <span className="text-white">@{modal.usuario.username}</span> a <span className="font-medium capitalize text-sp-orange">{modal.estado}</span>
            </p>
            {modal.estado !== 'activo' && (
              <div className="mb-4">
                <label className="label">Motivo (opcional)</label>
                <textarea
                  value={modal.motivo}
                  onChange={e => setModal(p => ({ ...p, motivo: e.target.value }))}
                  rows={3}
                  className="input w-full resize-none text-sm"
                  placeholder="Describe el motivo..."
                />
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setModal(null)} className="btn-ghost flex-1 text-sm">Cancelar</button>
              <button onClick={handleCambiarEstado} className="btn-orange flex-1 text-sm">Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
