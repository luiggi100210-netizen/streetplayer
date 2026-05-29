import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import AdminLogin from './AdminLogin';

// ─── HTTP helper con token admin ─────────────────────────────────────────────
function adminApi(token) {
  return axios.create({
    baseURL: '/api/admin',
    headers: { Authorization: `Bearer ${token}` },
  });
}

// ─── Helpers UI ──────────────────────────────────────────────────────────────
const ESTADO_COLOR = {
  activo: '#00e676', suspendido: '#fbbf24', baneado: '#f87171',
  abierto: '#00e676', cerrado: '#64748b', cancelado: '#f87171',
  finalizado: '#a78bfa', pendiente: '#fbbf24', aprobado: '#00e676',
};

function Badge({ estado }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1,
      padding: '2px 8px', borderRadius: 20,
      background: (ESTADO_COLOR[estado] || '#64748b') + '22',
      color: ESTADO_COLOR[estado] || '#64748b',
      border: `1px solid ${(ESTADO_COLOR[estado] || '#64748b')}44`,
    }}>
      {estado}
    </span>
  );
}

function Avatar({ url, nombre, size = 32 }) {
  return url
    ? <img src={url} alt={nombre} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
    : <div style={{
        width: size, height: size, borderRadius: '50%', background: '#1e1e2e',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#64748b', fontSize: size * 0.4, fontWeight: 700, flexShrink: 0,
      }}>
        {(nombre || '?')[0].toUpperCase()}
      </div>;
}

function KpiCard({ label, value, sub, color = '#00e676' }) {
  return (
    <div style={{
      background: '#0d0d1a', border: `1px solid ${color}22`,
      borderRadius: 12, padding: '20px 24px', flex: 1, minWidth: 140,
    }}>
      <p style={{ color: '#64748b', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</p>
      <p style={{ fontFamily: 'Impact, sans-serif', fontSize: 36, color, margin: '4px 0 0' }}>{value ?? '—'}</p>
      {sub && <p style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>{sub}</p>}
    </div>
  );
}

function Th({ children }) {
  return <th style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid #1e1e2e', whiteSpace: 'nowrap' }}>{children}</th>;
}
function Td({ children, style }) {
  return <td style={{ padding: '10px 14px', color: '#cbd5e1', fontSize: 13, borderBottom: '1px solid #0d0d1a', verticalAlign: 'middle', ...style }}>{children}</td>;
}

function ActionBtn({ children, onClick, color = '#7c3aed', danger }) {
  return (
    <button onClick={onClick} style={{
      padding: '4px 10px', borderRadius: 6, border: 'none', fontSize: 11, fontWeight: 700,
      cursor: 'pointer', background: (danger ? '#ef444422' : color + '22'),
      color: danger ? '#f87171' : color, letterSpacing: 0.5,
    }}>
      {children}
    </button>
  );
}

// ─── Sección: Dashboard ───────────────────────────────────────────────────────
function Dashboard({ api }) {
  const [data, setData] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    Promise.all([api.get('/dashboard'), api.get('/stats')]).then(([d, s]) => {
      setData(d.data);
      setStats(s.data);
    });
  }, []);

  if (!data) return <p style={{ color: '#64748b', padding: 32 }}>Cargando...</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* KPIs principales */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <KpiCard label="Usuarios totales" value={data.usuarios.total} sub={`${data.usuarios.activos} activos · ${data.usuarios.suspendidos} suspendidos`} color="#00e676" />
        <KpiCard label="Eventos" value={data.eventos.total} sub={`${data.eventos.abiertos} abiertos`} color="#7c3aed" />
        <KpiCard label="Torneos" value={data.torneos.total} sub={`${data.torneos.pendientes} pendientes`} color="#fbbf24" />
        <KpiCard label="Reportes" value={data.reportes.total} sub={`${data.reportes.pendientes} sin resolver`} color="#f87171" />
      </div>

      {/* Actividad hoy */}
      {stats?.actividad_hoy && (
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <KpiCard label="Nuevos hoy" value={stats.actividad_hoy.nuevos_hoy} color="#00e676" />
          <KpiCard label="Eventos hoy" value={stats.actividad_hoy.eventos_hoy} color="#7c3aed" />
          <KpiCard label="Retos hoy" value={stats.actividad_hoy.retos_hoy} color="#fbbf24" />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Registros últimos 7 días */}
        <div style={{ background: '#0d0d1a', border: '1px solid #1e1e2e', borderRadius: 12, padding: 20 }}>
          <p style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
            Registros últimos 7 días
          </p>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 80 }}>
            {data.registros_7_dias.map((r, i) => {
              const max = Math.max(...data.registros_7_dias.map(x => +x.total), 1);
              const h = Math.round((+r.total / max) * 100);
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <span style={{ color: '#00e676', fontSize: 10, fontWeight: 700 }}>{r.total}</span>
                  <div style={{ width: '100%', height: `${h}%`, background: '#00e67633', borderRadius: 4, border: '1px solid #00e67666', minHeight: 4 }} />
                  <span style={{ color: '#64748b', fontSize: 9 }}>{new Date(r.dia).toLocaleDateString('es', { weekday: 'short' })}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top usuarios XP */}
        {stats?.top_xp && (
          <div style={{ background: '#0d0d1a', border: '1px solid #1e1e2e', borderRadius: 12, padding: 20 }}>
            <p style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
              Top XP
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {stats.top_xp.map((u, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: '#64748b', fontSize: 12, width: 16 }}>#{i + 1}</span>
                  <Avatar url={u.foto_url} nombre={u.username} size={28} />
                  <span style={{ color: '#e2e8f0', fontSize: 13, flex: 1 }}>{u.username}</span>
                  <span style={{ color: '#a78bfa', fontSize: 12, fontWeight: 700 }}>{(+u.nivel_xp).toLocaleString()} XP</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Top equipos */}
      {stats?.top_equipos && (
        <div style={{ background: '#0d0d1a', border: '1px solid #1e1e2e', borderRadius: 12, padding: 20 }}>
          <p style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
            Top Equipos
          </p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {stats.top_equipos.map((e, i) => (
              <div key={i} style={{
                background: '#13131f', border: '1px solid #1e1e2e', borderRadius: 10,
                padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 180,
              }}>
                <Avatar url={e.escudo_url} nombre={e.nombre} size={36} />
                <div>
                  <p style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 700 }}>{e.nombre}</p>
                  <p style={{ color: '#64748b', fontSize: 11 }}>{e.wins}W · {e.miembros} miembros</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sección: Usuarios ────────────────────────────────────────────────────────
function Usuarios({ api }) {
  const [lista, setLista] = useState([]);
  const [buscar, setBuscar] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null); // { usuario, accion }
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/usuarios', { params: { buscar: buscar || undefined, estado: estadoFiltro || undefined, page } });
      setLista(data);
    } catch {}
    setLoading(false);
  }, [buscar, estadoFiltro, page]);

  useEffect(() => { cargar(); }, [cargar]);

  const cambiarEstado = async (id, estado) => {
    await api.put(`/usuarios/${id}/estado`, { estado, motivo });
    setModal(null);
    setMotivo('');
    cargar();
  };

  const eliminarFoto = async (id) => {
    await api.delete(`/usuarios/${id}/foto`);
    cargar();
  };

  return (
    <div>
      {/* Filtros */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          placeholder="Buscar usuario, email..."
          value={buscar}
          onChange={e => { setBuscar(e.target.value); setPage(1); }}
          style={{ flex: 1, minWidth: 200, background: '#0d0d1a', border: '1px solid #1e1e2e', borderRadius: 8, padding: '8px 14px', color: '#fff', fontSize: 13 }}
        />
        <select value={estadoFiltro} onChange={e => { setEstadoFiltro(e.target.value); setPage(1); }}
          style={{ background: '#0d0d1a', border: '1px solid #1e1e2e', borderRadius: 8, padding: '8px 14px', color: '#fff', fontSize: 13 }}>
          <option value="">Todos los estados</option>
          <option value="activo">Activo</option>
          <option value="suspendido">Suspendido</option>
          <option value="baneado">Baneado</option>
        </select>
      </div>

      {/* Tabla */}
      <div style={{ background: '#0d0d1a', border: '1px solid #1e1e2e', borderRadius: 12, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <Th>Usuario</Th>
              <Th>Email</Th>
              <Th>Ciudad</Th>
              <Th>PJ</Th>
              <Th>Estado</Th>
              <Th>Registro</Th>
              <Th>Acciones</Th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><Td colSpan={7} style={{ textAlign: 'center', color: '#64748b' }}>Cargando...</Td></tr>
            ) : lista.map(u => (
              <tr key={u.id} style={{ transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#13131f'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <Td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ position: 'relative' }}>
                      <Avatar url={u.foto_url} nombre={u.username} size={34} />
                      {u.verificado && <span style={{ position: 'absolute', bottom: -2, right: -2, fontSize: 10 }}>✓</span>}
                    </div>
                    <div>
                      <p style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 13 }}>{u.username}</p>
                      <p style={{ color: '#64748b', fontSize: 11 }}>{u.nombre}</p>
                    </div>
                  </div>
                </Td>
                <Td style={{ color: '#94a3b8' }}>{u.email}</Td>
                <Td style={{ color: '#94a3b8' }}>{u.ciudad || '—'}</Td>
                <Td style={{ color: '#a78bfa', fontWeight: 700 }}>{u.partidos_jugados}</Td>
                <Td><Badge estado={u.estado} /></Td>
                <Td style={{ color: '#64748b', fontSize: 11 }}>{new Date(u.fecha_registro).toLocaleDateString('es')}</Td>
                <Td>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {u.estado !== 'activo' && (
                      <ActionBtn onClick={() => setModal({ usuario: u, accion: 'activo' })} color="#00e676">Activar</ActionBtn>
                    )}
                    {u.estado !== 'suspendido' && (
                      <ActionBtn onClick={() => setModal({ usuario: u, accion: 'suspendido' })} color="#fbbf24">Suspender</ActionBtn>
                    )}
                    {u.estado !== 'baneado' && (
                      <ActionBtn onClick={() => setModal({ usuario: u, accion: 'baneado' })} danger>Banear</ActionBtn>
                    )}
                    {u.foto_url && (
                      <ActionBtn onClick={() => eliminarFoto(u.id)} color="#64748b">Quitar foto</ActionBtn>
                    )}
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
        <ActionBtn onClick={() => setPage(p => Math.max(1, p - 1))} color="#64748b" disabled={page === 1}>← Anterior</ActionBtn>
        <span style={{ color: '#64748b', fontSize: 13, lineHeight: '28px' }}>Pág. {page}</span>
        <ActionBtn onClick={() => setPage(p => p + 1)} color="#64748b" disabled={lista.length < 30}>Siguiente →</ActionBtn>
      </div>

      {/* Modal confirmar acción */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: '#000a', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#0d0d1a', border: '1px solid #1e1e2e', borderRadius: 16, padding: 28, width: '100%', maxWidth: 400 }}>
            <p style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 16, marginBottom: 8 }}>
              {modal.accion === 'activo' ? 'Activar' : modal.accion === 'suspendido' ? 'Suspender' : 'Banear'} a {modal.usuario.username}
            </p>
            {modal.accion !== 'activo' && (
              <textarea
                placeholder="Motivo (opcional)"
                value={motivo}
                onChange={e => setMotivo(e.target.value)}
                rows={3}
                style={{ width: '100%', background: '#13131f', border: '1px solid #1e1e2e', borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: 13, resize: 'none', boxSizing: 'border-box', marginBottom: 16 }}
              />
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <ActionBtn onClick={() => { setModal(null); setMotivo(''); }} color="#64748b">Cancelar</ActionBtn>
              <ActionBtn onClick={() => cambiarEstado(modal.usuario.id, modal.accion)} color={modal.accion === 'activo' ? '#00e676' : '#f87171'} danger={modal.accion !== 'activo'}>
                Confirmar
              </ActionBtn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sección: Torneos ─────────────────────────────────────────────────────────
function Torneos({ api }) {
  const [lista, setLista] = useState([]);
  const [filtro, setFiltro] = useState('pendiente');

  const cargar = useCallback(async () => {
    const { data } = await api.get('/torneos', { params: { estado: filtro || undefined } });
    setLista(data);
  }, [filtro]);

  useEffect(() => { cargar(); }, [cargar]);

  const aprobar = async (id) => {
    await api.put(`/torneos/${id}/aprobar`);
    cargar();
  };
  const rechazar = async (id) => {
    await api.put(`/torneos/${id}/rechazar`);
    cargar();
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {['pendiente', 'aprobado', 'finalizado', ''].map(f => (
          <button key={f} onClick={() => setFiltro(f)} style={{
            padding: '6px 16px', borderRadius: 20, border: '1px solid #1e1e2e', cursor: 'pointer', fontSize: 12, fontWeight: 600,
            background: filtro === f ? '#7c3aed' : '#0d0d1a', color: filtro === f ? '#fff' : '#64748b',
          }}>
            {f || 'Todos'}
          </button>
        ))}
      </div>

      <div style={{ background: '#0d0d1a', border: '1px solid #1e1e2e', borderRadius: 12, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr><Th>Torneo</Th><Th>Organizador</Th><Th>Deporte</Th><Th>Inicio</Th><Th>Estado</Th><Th>Acciones</Th></tr>
          </thead>
          <tbody>
            {lista.map(t => (
              <tr key={t.id}
                onMouseEnter={e => e.currentTarget.style.background = '#13131f'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <Td>
                  <p style={{ color: '#e2e8f0', fontWeight: 600 }}>{t.nombre}</p>
                  <p style={{ color: '#64748b', fontSize: 11 }}>{t.ciudad}</p>
                </Td>
                <Td style={{ color: '#94a3b8' }}>{t.organizador_username}</Td>
                <Td style={{ color: '#a78bfa', textTransform: 'capitalize' }}>{t.deporte}</Td>
                <Td style={{ color: '#64748b', fontSize: 11 }}>{t.fecha_inicio ? new Date(t.fecha_inicio).toLocaleDateString('es') : '—'}</Td>
                <Td>
                  <Badge estado={t.aprobado ? (t.estado || 'aprobado') : 'pendiente'} />
                </Td>
                <Td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {!t.aprobado && <ActionBtn onClick={() => aprobar(t.id)} color="#00e676">Aprobar</ActionBtn>}
                    {t.aprobado && t.estado !== 'cancelado' && <ActionBtn onClick={() => rechazar(t.id)} danger>Rechazar</ActionBtn>}
                  </div>
                </Td>
              </tr>
            ))}
            {!lista.length && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#64748b', fontSize: 13 }}>Sin torneos</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Sección: Equipos ─────────────────────────────────────────────────────────
function Equipos({ api }) {
  const [lista, setLista] = useState([]);
  const [buscar, setBuscar] = useState('');
  const [page, setPage] = useState(1);

  const cargar = useCallback(async () => {
    const { data } = await api.get('/equipos', { params: { buscar: buscar || undefined, page } });
    setLista(data);
  }, [buscar, page]);

  useEffect(() => { cargar(); }, [cargar]);

  return (
    <div>
      <input
        placeholder="Buscar equipo o capitán..."
        value={buscar}
        onChange={e => { setBuscar(e.target.value); setPage(1); }}
        style={{ marginBottom: 20, width: '100%', maxWidth: 320, background: '#0d0d1a', border: '1px solid #1e1e2e', borderRadius: 8, padding: '8px 14px', color: '#fff', fontSize: 13, boxSizing: 'border-box' }}
      />
      <div style={{ background: '#0d0d1a', border: '1px solid #1e1e2e', borderRadius: 12, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr><Th>Equipo</Th><Th>Capitán</Th><Th>Deporte</Th><Th>Ciudad</Th><Th>Miembros</Th><Th>Record</Th><Th>Estado</Th><Th>Creado</Th></tr>
          </thead>
          <tbody>
            {lista.map(e => (
              <tr key={e.id}
                onMouseEnter={ev => ev.currentTarget.style.background = '#13131f'}
                onMouseLeave={ev => ev.currentTarget.style.background = 'transparent'}>
                <Td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar url={e.escudo_url} nombre={e.nombre} size={34} />
                    <p style={{ color: '#e2e8f0', fontWeight: 600 }}>{e.nombre}</p>
                  </div>
                </Td>
                <Td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Avatar url={e.capitan_foto} nombre={e.capitan_username} size={24} />
                    <span style={{ color: '#94a3b8' }}>{e.capitan_username}</span>
                  </div>
                </Td>
                <Td style={{ color: '#a78bfa', textTransform: 'capitalize' }}>{e.deporte}</Td>
                <Td style={{ color: '#94a3b8' }}>{e.ciudad || '—'}</Td>
                <Td style={{ color: '#00e676', fontWeight: 700 }}>{e.total_miembros}</Td>
                <Td style={{ color: '#64748b', fontSize: 11 }}>{e.wins}W-{e.losses}L-{e.draws}E</Td>
                <Td><Badge estado={e.estado} /></Td>
                <Td style={{ color: '#64748b', fontSize: 11 }}>{new Date(e.fecha_creacion).toLocaleDateString('es')}</Td>
              </tr>
            ))}
            {!lista.length && <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: '#64748b', fontSize: 13 }}>Sin equipos</td></tr>}
          </tbody>
        </table>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
        <ActionBtn onClick={() => setPage(p => Math.max(1, p - 1))} color="#64748b">← Anterior</ActionBtn>
        <span style={{ color: '#64748b', fontSize: 13, lineHeight: '28px' }}>Pág. {page}</span>
        <ActionBtn onClick={() => setPage(p => p + 1)} color="#64748b" disabled={lista.length < 30}>Siguiente →</ActionBtn>
      </div>
    </div>
  );
}

// ─── Sección: Eventos ─────────────────────────────────────────────────────────
function Eventos({ api }) {
  const [lista, setLista] = useState([]);
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [page, setPage] = useState(1);

  const cargar = useCallback(async () => {
    const { data } = await api.get('/eventos', { params: { estado: estadoFiltro || undefined, page } });
    setLista(data);
  }, [estadoFiltro, page]);

  useEffect(() => { cargar(); }, [cargar]);

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {['', 'abierto', 'cerrado', 'cancelado', 'finalizado'].map(f => (
          <button key={f} onClick={() => { setEstadoFiltro(f); setPage(1); }} style={{
            padding: '6px 16px', borderRadius: 20, border: '1px solid #1e1e2e', cursor: 'pointer', fontSize: 12, fontWeight: 600,
            background: estadoFiltro === f ? '#7c3aed' : '#0d0d1a', color: estadoFiltro === f ? '#fff' : '#64748b',
          }}>
            {f || 'Todos'}
          </button>
        ))}
      </div>
      <div style={{ background: '#0d0d1a', border: '1px solid #1e1e2e', borderRadius: 12, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr><Th>Evento</Th><Th>Creador</Th><Th>Deporte</Th><Th>Ciudad</Th><Th>Inscritos</Th><Th>Precio</Th><Th>Estado</Th><Th>Fecha</Th></tr>
          </thead>
          <tbody>
            {lista.map(ev => (
              <tr key={ev.id}
                onMouseEnter={e => e.currentTarget.style.background = '#13131f'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <Td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {ev.imagen_url && <img src={ev.imagen_url} alt="" style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover' }} />}
                    <p style={{ color: '#e2e8f0', fontWeight: 600 }}>{ev.titulo}</p>
                  </div>
                </Td>
                <Td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Avatar url={ev.creador_foto} nombre={ev.creador_username} size={24} />
                    <span style={{ color: '#94a3b8' }}>{ev.creador_username}</span>
                  </div>
                </Td>
                <Td style={{ color: '#a78bfa', textTransform: 'capitalize' }}>{ev.deporte}</Td>
                <Td style={{ color: '#94a3b8' }}>{ev.ciudad || '—'}</Td>
                <Td style={{ color: '#00e676', fontWeight: 700 }}>{ev.total_inscritos}</Td>
                <Td style={{ color: '#fbbf24' }}>{ev.precio_entrada > 0 ? `S/ ${ev.precio_entrada}` : 'Gratis'}</Td>
                <Td><Badge estado={ev.estado} /></Td>
                <Td style={{ color: '#64748b', fontSize: 11 }}>{ev.fecha_evento ? new Date(ev.fecha_evento).toLocaleDateString('es') : '—'}</Td>
              </tr>
            ))}
            {!lista.length && <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: '#64748b', fontSize: 13 }}>Sin eventos</td></tr>}
          </tbody>
        </table>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
        <ActionBtn onClick={() => setPage(p => Math.max(1, p - 1))} color="#64748b">← Anterior</ActionBtn>
        <span style={{ color: '#64748b', fontSize: 13, lineHeight: '28px' }}>Pág. {page}</span>
        <ActionBtn onClick={() => setPage(p => p + 1)} color="#64748b" disabled={lista.length < 30}>Siguiente →</ActionBtn>
      </div>
    </div>
  );
}

// ─── Sección: Reportes ────────────────────────────────────────────────────────
function Reportes({ api }) {
  const [lista, setLista] = useState([]);

  const cargar = async () => {
    const { data } = await api.get('/reportes');
    setLista(data);
  };

  useEffect(() => { cargar(); }, []);

  const resolver = async (id, estado) => {
    await api.put(`/reportes/${id}`, { estado });
    cargar();
  };

  return (
    <div style={{ background: '#0d0d1a', border: '1px solid #1e1e2e', borderRadius: 12, overflow: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr><Th>Reportado</Th><Th>Por</Th><Th>Motivo</Th><Th>Descripción</Th><Th>Estado</Th><Th>Fecha</Th><Th>Acción</Th></tr>
        </thead>
        <tbody>
          {lista.map(r => (
            <tr key={r.id}
              onMouseEnter={e => e.currentTarget.style.background = '#13131f'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <Td style={{ color: '#e2e8f0', fontWeight: 600 }}>{r.usuario_reportado_username || '—'}</Td>
              <Td style={{ color: '#94a3b8' }}>{r.reportado_por_username}</Td>
              <Td style={{ color: '#fbbf24', textTransform: 'capitalize' }}>{r.motivo}</Td>
              <Td style={{ color: '#94a3b8', maxWidth: 220 }}>
                <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {r.descripcion || '—'}
                </span>
              </Td>
              <Td><Badge estado={r.estado} /></Td>
              <Td style={{ color: '#64748b', fontSize: 11 }}>{new Date(r.fecha).toLocaleDateString('es')}</Td>
              <Td>
                {r.estado === 'pendiente' && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <ActionBtn onClick={() => resolver(r.id, 'resuelto')} color="#00e676">Resolver</ActionBtn>
                    <ActionBtn onClick={() => resolver(r.id, 'descartado')} color="#64748b">Descartar</ActionBtn>
                  </div>
                )}
              </Td>
            </tr>
          ))}
          {!lista.length && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: '#64748b', fontSize: 13 }}>Sin reportes</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

// ─── Sección: Anuncios ────────────────────────────────────────────────────────
function Anuncios({ api }) {
  const [lista, setLista] = useState([]);
  const [form, setForm] = useState({ titulo: '', imagen_url: '', url_destino: '', fecha_inicio: '', fecha_fin: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const cargar = async () => {
    const { data } = await api.get('/anuncios');
    setLista(data);
  };
  useEffect(() => { cargar(); }, []);

  const crear = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/anuncios', form);
      setForm({ titulo: '', imagen_url: '', url_destino: '', fecha_inicio: '', fecha_fin: '' });
      cargar();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear anuncio');
    }
    setSaving(false);
  };

  const inputStyle = {
    width: '100%', background: '#13131f', border: '1px solid #1e1e2e', borderRadius: 8,
    padding: '8px 12px', color: '#fff', fontSize: 13, boxSizing: 'border-box', marginTop: 4,
  };
  const labelStyle = { color: '#94a3b8', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24, alignItems: 'start' }}>
      {/* Formulario nuevo anuncio */}
      <div style={{ background: '#0d0d1a', border: '1px solid #1e1e2e', borderRadius: 12, padding: 24 }}>
        <p style={{ color: '#e2e8f0', fontWeight: 700, marginBottom: 20 }}>Nuevo anuncio</p>
        <form onSubmit={crear} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div><label style={labelStyle}>Título</label><input value={form.titulo} onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))} required style={inputStyle} /></div>
          <div><label style={labelStyle}>URL Imagen</label><input value={form.imagen_url} onChange={e => setForm(p => ({ ...p, imagen_url: e.target.value }))} required style={inputStyle} /></div>
          <div><label style={labelStyle}>URL Destino</label><input value={form.url_destino} onChange={e => setForm(p => ({ ...p, url_destino: e.target.value }))} style={inputStyle} /></div>
          <div><label style={labelStyle}>Fecha inicio</label><input type="date" value={form.fecha_inicio} onChange={e => setForm(p => ({ ...p, fecha_inicio: e.target.value }))} required style={inputStyle} /></div>
          <div><label style={labelStyle}>Fecha fin</label><input type="date" value={form.fecha_fin} onChange={e => setForm(p => ({ ...p, fecha_fin: e.target.value }))} required style={inputStyle} /></div>
          {form.imagen_url && (
            <img src={form.imagen_url} alt="preview" onError={e => e.target.style.display='none'} style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 8 }} />
          )}
          {error && <p style={{ color: '#f87171', fontSize: 12 }}>{error}</p>}
          <button type="submit" disabled={saving} style={{ padding: '10px', borderRadius: 8, border: 'none', background: saving ? '#1e1e2e' : '#7c3aed', color: '#fff', fontWeight: 700, cursor: saving ? 'wait' : 'pointer' }}>
            {saving ? 'Guardando...' : 'Crear Anuncio'}
          </button>
        </form>
      </div>

      {/* Lista anuncios */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {lista.map(a => (
          <div key={a.id} style={{ background: '#0d0d1a', border: '1px solid #1e1e2e', borderRadius: 12, overflow: 'hidden', display: 'flex', gap: 0 }}>
            {a.imagen_url && <img src={a.imagen_url} alt="" style={{ width: 120, height: 80, objectFit: 'cover', flexShrink: 0 }} />}
            <div style={{ padding: '12px 16px', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <p style={{ color: '#e2e8f0', fontWeight: 700, flex: 1 }}>{a.titulo}</p>
                <Badge estado={a.activo ? 'activo' : 'inactivo'} />
              </div>
              <p style={{ color: '#64748b', fontSize: 11 }}>
                {new Date(a.fecha_inicio).toLocaleDateString('es')} — {new Date(a.fecha_fin).toLocaleDateString('es')}
              </p>
            </div>
          </div>
        ))}
        {!lista.length && <p style={{ color: '#64748b', textAlign: 'center', padding: 32 }}>Sin anuncios</p>}
      </div>
    </div>
  );
}

// ─── Panel principal ──────────────────────────────────────────────────────────
const TABS = [
  { id: 'dashboard', label: '📊 Dashboard' },
  { id: 'usuarios',  label: '👥 Usuarios'  },
  { id: 'torneos',   label: '🏆 Torneos'   },
  { id: 'equipos',   label: '🛡️ Equipos'   },
  { id: 'eventos',   label: '🗓️ Eventos'   },
  { id: 'reportes',  label: '🚨 Reportes'  },
  { id: 'anuncios',  label: '📢 Anuncios'  },
];

function Panel({ token, admin, onLogout }) {
  const [tab, setTab] = useState('dashboard');
  const api = adminApi(token);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#070710', fontFamily: 'system-ui, sans-serif' }}>
      {/* Sidebar */}
      <aside style={{ width: 220, background: '#0d0d1a', borderRight: '1px solid #1e1e2e', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '24px 20px', borderBottom: '1px solid #1e1e2e' }}>
          <p style={{ fontFamily: 'Impact, sans-serif', fontSize: 18, color: '#00e676', letterSpacing: 3 }}>STREETPLAYER</p>
          <p style={{ color: '#64748b', fontSize: 10, marginTop: 2, textTransform: 'uppercase', letterSpacing: 2 }}>Admin Panel</p>
        </div>
        <nav style={{ flex: 1, padding: '12px 0' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              display: 'block', width: '100%', textAlign: 'left',
              padding: '10px 20px', border: 'none', background: 'none',
              color: tab === t.id ? '#e2e8f0' : '#64748b',
              fontSize: 13, fontWeight: tab === t.id ? 700 : 400,
              cursor: 'pointer',
              borderLeft: tab === t.id ? '3px solid #7c3aed' : '3px solid transparent',
              background: tab === t.id ? '#7c3aed11' : 'transparent',
              transition: 'all 0.15s',
            }}>
              {t.label}
            </button>
          ))}
        </nav>
        <div style={{ padding: '16px 20px', borderTop: '1px solid #1e1e2e' }}>
          <p style={{ color: '#94a3b8', fontSize: 12, marginBottom: 8 }}>👤 {admin?.username || admin?.email}</p>
          <button onClick={onLogout} style={{ background: 'none', border: '1px solid #1e1e2e', color: '#64748b', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 12, width: '100%' }}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Contenido */}
      <main style={{ flex: 1, padding: 32, overflowY: 'auto', maxHeight: '100vh' }}>
        <h1 style={{ color: '#e2e8f0', fontSize: 22, fontWeight: 700, marginBottom: 24 }}>
          {TABS.find(t => t.id === tab)?.label}
        </h1>
        {tab === 'dashboard' && <Dashboard api={api} />}
        {tab === 'usuarios'  && <Usuarios  api={api} />}
        {tab === 'torneos'   && <Torneos   api={api} />}
        {tab === 'equipos'   && <Equipos   api={api} />}
        {tab === 'eventos'   && <Eventos   api={api} />}
        {tab === 'reportes'  && <Reportes  api={api} />}
        {tab === 'anuncios'  && <Anuncios  api={api} />}
      </main>
    </div>
  );
}

// ─── Entry point ──────────────────────────────────────────────────────────────
export default function Admin() {
  const [token, setToken] = useState(() => localStorage.getItem('admin_token'));
  const [admin, setAdmin] = useState(null);

  const handleLogin = (tok, adminData) => {
    setToken(tok);
    setAdmin(adminData);
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setToken(null);
    setAdmin(null);
  };

  if (!token) return <AdminLogin onLogin={handleLogin} />;
  return <Panel token={token} admin={admin} onLogout={handleLogout} />;
}
