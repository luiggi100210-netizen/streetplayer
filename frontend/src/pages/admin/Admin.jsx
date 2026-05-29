import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import AdminLogin from './AdminLogin';
import { Analytics, MapaUsuarios } from './AdminAnalytics';
import { Configuracion, Medallas, Sanciones, Finanzas, Notificaciones } from './AdminConfig';
import { AuditLog, Privacidad } from './AdminAuditoria';

function adminApi(token) {
  return axios.create({ baseURL: '/api/admin', headers: { Authorization: `Bearer ${token}` } });
}

// ─── UI helpers ───────────────────────────────────────────────────────────────
const ESTADO_COLOR = {
  activo: '#00e676', suspendido: '#fbbf24', baneado: '#f87171', inactivo: '#64748b',
  abierto: '#00e676', cerrado: '#64748b', cancelado: '#f87171',
  finalizado: '#a78bfa', pendiente: '#fbbf24', aprobado: '#00e676',
  contactado: '#38bdf8', rechazado: '#f87171',
};

function Badge({ estado }) {
  const c = ESTADO_COLOR[estado] || '#64748b';
  return (
    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, padding: '2px 8px', borderRadius: 20, background: c + '22', color: c, border: `1px solid ${c}44` }}>
      {estado}
    </span>
  );
}

function Avatar({ url, nombre, size = 32 }) {
  return url
    ? <img src={url} alt={nombre} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
    : <div style={{ width: size, height: size, borderRadius: '50%', background: '#1e1e2e', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: size * 0.4, fontWeight: 700, flexShrink: 0 }}>
        {(nombre || '?')[0].toUpperCase()}
      </div>;
}

function KpiCard({ label, value, sub, color = '#00e676' }) {
  return (
    <div style={{ background: '#0d0d1a', border: `1px solid ${color}22`, borderRadius: 12, padding: '20px 24px', flex: 1, minWidth: 140 }}>
      <p style={{ color: '#64748b', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</p>
      <p style={{ fontFamily: 'Impact, sans-serif', fontSize: 36, color, margin: '4px 0 0' }}>{value ?? '—'}</p>
      {sub && <p style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>{sub}</p>}
    </div>
  );
}

const TH = ({ children }) => <th style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid #1e1e2e', whiteSpace: 'nowrap' }}>{children}</th>;
const TD = ({ children, style }) => <td style={{ padding: '10px 14px', color: '#cbd5e1', fontSize: 13, borderBottom: '1px solid #0d0d1a', verticalAlign: 'middle', ...style }}>{children}</td>;

function Btn({ children, onClick, color = '#7c3aed', danger, small, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: small ? '3px 8px' : '5px 12px', borderRadius: 6, border: 'none',
      fontSize: small ? 10 : 11, fontWeight: 700, cursor: disabled ? 'default' : 'pointer',
      background: danger ? '#ef444422' : color + '22', color: danger ? '#f87171' : color,
      letterSpacing: 0.5, opacity: disabled ? 0.5 : 1,
    }}>
      {children}
    </button>
  );
}

function Modal({ children, onClose, width = 560 }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: '#000b', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#0d0d1a', border: '1px solid #1e1e2e', borderRadius: 16, width: '100%', maxWidth: width, maxHeight: '90vh', overflowY: 'auto' }}>
        {children}
      </div>
    </div>
  );
}

const inputS = { display: 'block', width: '100%', marginTop: 5, background: '#13131f', border: '1px solid #1e1e2e', borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: 13, boxSizing: 'border-box', outline: 'none' };
const labelS = { color: '#94a3b8', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 };

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ api }) {
  const [data, setData] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    Promise.all([api.get('/dashboard'), api.get('/stats')]).then(([d, s]) => { setData(d.data); setStats(s.data); }).catch(() => {});
  }, []);

  if (!data) return <p style={{ color: '#64748b', padding: 32 }}>Cargando...</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <KpiCard label="Usuarios" value={data.usuarios.total} sub={`${data.usuarios.activos} activos · ${data.usuarios.suspendidos} suspendidos`} color="#00e676" />
        <KpiCard label="Eventos" value={data.eventos.total} sub={`${data.eventos.abiertos} abiertos`} color="#7c3aed" />
        <KpiCard label="Torneos" value={data.torneos.total} sub={`${data.torneos.pendientes} pendientes`} color="#fbbf24" />
        <KpiCard label="Reportes" value={data.reportes.total} sub={`${data.reportes.pendientes} sin resolver`} color="#f87171" />
      </div>

      {stats?.actividad_hoy && (
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <KpiCard label="Nuevos hoy" value={stats.actividad_hoy.nuevos_hoy} color="#00e676" />
          <KpiCard label="Eventos hoy" value={stats.actividad_hoy.eventos_hoy} color="#7c3aed" />
          <KpiCard label="Retos hoy" value={stats.actividad_hoy.retos_hoy} color="#fbbf24" />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ background: '#0d0d1a', border: '1px solid #1e1e2e', borderRadius: 12, padding: 20 }}>
          <p style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Registros últimos 7 días</p>
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

        {stats?.top_xp && (
          <div style={{ background: '#0d0d1a', border: '1px solid #1e1e2e', borderRadius: 12, padding: 20 }}>
            <p style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Top XP</p>
            {stats.top_xp.map((u, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ color: '#64748b', fontSize: 12, width: 16 }}>#{i + 1}</span>
                <Avatar url={u.foto_url} nombre={u.username} size={28} />
                <span style={{ color: '#e2e8f0', fontSize: 13, flex: 1 }}>{u.username}</span>
                <span style={{ color: '#a78bfa', fontSize: 12, fontWeight: 700 }}>{(+u.nivel_xp).toLocaleString()} XP</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {stats?.top_equipos && (
        <div style={{ background: '#0d0d1a', border: '1px solid #1e1e2e', borderRadius: 12, padding: 20 }}>
          <p style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Top Equipos</p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {stats.top_equipos.map((e, i) => (
              <div key={i} style={{ background: '#13131f', border: '1px solid #1e1e2e', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 180 }}>
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

// ─── Modal detalle usuario ────────────────────────────────────────────────────
function ModalUsuario({ api, userId, onClose, onRefresh }) {
  const [data, setData] = useState(null);
  const [modalAccion, setModalAccion] = useState(null);
  const [motivo, setMotivo] = useState('');

  useEffect(() => {
    api.get(`/usuarios/${userId}`).then(r => setData(r.data)).catch(() => {});
  }, [userId]);

  const cambiarEstado = async (estado) => {
    await api.put(`/usuarios/${userId}/estado`, { estado, motivo });
    setModalAccion(null);
    onRefresh();
    api.get(`/usuarios/${userId}`).then(r => setData(r.data));
  };

  const eliminarFoto = async () => {
    await api.delete(`/usuarios/${userId}/foto`);
    onRefresh();
    api.get(`/usuarios/${userId}`).then(r => setData(r.data));
  };

  if (!data) return (
    <Modal onClose={onClose} width={640}>
      <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Cargando...</div>
    </Modal>
  );

  const statBox = (label, value, color = '#e2e8f0') => (
    <div style={{ background: '#13131f', borderRadius: 8, padding: '10px 14px', textAlign: 'center', flex: 1 }}>
      <p style={{ color: '#64748b', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</p>
      <p style={{ color, fontSize: 20, fontFamily: 'Impact, sans-serif', marginTop: 2 }}>{value ?? '—'}</p>
    </div>
  );

  return (
    <Modal onClose={onClose} width={680}>
      <div style={{ padding: 28 }}>
        {/* Header */}
        <div style={{ display: 'flex', gap: 20, marginBottom: 24 }}>
          <div style={{ position: 'relative' }}>
            <Avatar url={data.foto_url} nombre={data.username} size={80} />
            {data.foto_url && (
              <button onClick={eliminarFoto} title="Quitar foto" style={{ position: 'absolute', top: -4, right: -4, width: 20, height: 20, borderRadius: '50%', background: '#ef4444', border: 'none', color: '#fff', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <h2 style={{ color: '#e2e8f0', fontSize: 20, fontWeight: 700 }}>{data.username}</h2>
              <Badge estado={data.estado} />
              {data.verificado && <span style={{ color: '#38bdf8', fontSize: 12 }}>✓ Verificado</span>}
            </div>
            <p style={{ color: '#94a3b8', fontSize: 13 }}>{data.nombre}</p>
            <p style={{ color: '#64748b', fontSize: 12 }}>{data.email}</p>
            <p style={{ color: '#64748b', fontSize: 12 }}>{[data.ciudad, data.departamento].filter(Boolean).join(', ')}</p>
            {data.bio && <p style={{ color: '#94a3b8', fontSize: 12, marginTop: 6, fontStyle: 'italic' }}>"{data.bio}"</p>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ color: '#64748b', fontSize: 11 }}>Registro</p>
            <p style={{ color: '#94a3b8', fontSize: 12 }}>{new Date(data.fecha_registro).toLocaleDateString('es')}</p>
            <p style={{ color: '#64748b', fontSize: 11, marginTop: 8 }}>Rol</p>
            <p style={{ color: '#a78bfa', fontSize: 12, fontWeight: 700, textTransform: 'capitalize' }}>{data.rol}</p>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          {statBox('Nivel XP', (+data.nivel_xp || 0).toLocaleString(), '#a78bfa')}
          {statBox('Partidos', data.partidos_jugados, '#00e676')}
          {statBox('Goles', data.goles_totales, '#fbbf24')}
          {statBox('Ranking', data.ranking_pos ? `#${data.ranking_pos}` : '—', '#38bdf8')}
          {statBox('Puntos', data.ranking_puntos || 0, '#38bdf8')}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          {/* Info adicional */}
          <div style={{ background: '#13131f', borderRadius: 10, padding: 16 }}>
            <p style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Perfil</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                ['Posición', data.posicion],
                ['Nivel', data.nivel],
                ['Deportes', data.deportes?.join(', ')],
                ['Teléfono', data.telefono],
                ['GPS', data.latitud ? `${(+data.latitud).toFixed(4)}, ${(+data.longitud).toFixed(4)}` : null],
              ].map(([k, v]) => v ? (
                <div key={k} style={{ display: 'flex', gap: 8 }}>
                  <span style={{ color: '#64748b', fontSize: 12, width: 70, flexShrink: 0 }}>{k}</span>
                  <span style={{ color: '#e2e8f0', fontSize: 12, textTransform: 'capitalize' }}>{v}</span>
                </div>
              ) : null)}
            </div>
          </div>

          {/* Equipo */}
          <div style={{ background: '#13131f', borderRadius: 10, padding: 16 }}>
            <p style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Equipo</p>
            {data.equipo ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar url={data.equipo.escudo_url} nombre={data.equipo.nombre} size={40} />
                <div>
                  <p style={{ color: '#e2e8f0', fontWeight: 700 }}>{data.equipo.nombre}</p>
                  <p style={{ color: '#64748b', fontSize: 11 }}>{data.equipo.rol} · {data.equipo.deporte}</p>
                </div>
              </div>
            ) : <p style={{ color: '#64748b', fontSize: 13 }}>Sin equipo</p>}

            {/* Medallas */}
            {data.medallas?.length > 0 && (
              <>
                <p style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginTop: 14, marginBottom: 8 }}>Medallas</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {data.medallas.map((m, i) => (
                    <span key={i} title={m.nombre} style={{ fontSize: 20 }}>{m.icono}</span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Eventos recientes */}
        {data.eventos_recientes?.length > 0 && (
          <div style={{ background: '#13131f', borderRadius: 10, padding: 16, marginBottom: 20 }}>
            <p style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Últimos eventos</p>
            {data.eventos_recientes.map((ev, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: i < data.eventos_recientes.length - 1 ? '1px solid #1e1e2e' : 'none' }}>
                <span style={{ color: '#e2e8f0', fontSize: 12 }}>{ev.titulo}</span>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ color: '#64748b', fontSize: 11 }}>{ev.fecha_evento ? new Date(ev.fecha_evento).toLocaleDateString('es') : '—'}</span>
                  <Badge estado={ev.inscripcion_estado} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Acciones */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', borderTop: '1px solid #1e1e2e', paddingTop: 16 }}>
          {data.estado !== 'activo'     && <Btn onClick={() => setModalAccion('activo')}     color="#00e676">Activar</Btn>}
          {data.estado !== 'suspendido' && <Btn onClick={() => setModalAccion('suspendido')} color="#fbbf24">Suspender</Btn>}
          {data.estado !== 'baneado'    && <Btn onClick={() => setModalAccion('baneado')}    danger>Banear</Btn>}
          <Btn onClick={onClose} color="#64748b">Cerrar</Btn>
        </div>
      </div>

      {/* Sub-modal confirmar acción */}
      {modalAccion && (
        <div onClick={e => e.stopPropagation()} style={{ position: 'fixed', inset: 0, background: '#000c', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
          <div style={{ background: '#0d0d1a', border: '1px solid #1e1e2e', borderRadius: 14, padding: 24, width: 360 }}>
            <p style={{ color: '#e2e8f0', fontWeight: 700, marginBottom: 12 }}>
              {modalAccion === 'activo' ? 'Activar' : modalAccion === 'suspendido' ? 'Suspender' : 'Banear'} a {data.username}
            </p>
            {modalAccion !== 'activo' && (
              <textarea value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="Motivo (opcional)" rows={3}
                style={{ ...inputS, resize: 'none', marginBottom: 12 }} />
            )}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Btn onClick={() => { setModalAccion(null); setMotivo(''); }} color="#64748b">Cancelar</Btn>
              <Btn onClick={() => cambiarEstado(modalAccion)} color={modalAccion === 'activo' ? '#00e676' : '#f87171'} danger={modalAccion !== 'activo'}>Confirmar</Btn>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ─── Usuarios ─────────────────────────────────────────────────────────────────
function Usuarios({ api }) {
  const [lista, setLista] = useState([]);
  const [buscar, setBuscar] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [page, setPage] = useState(1);
  const [detalle, setDetalle] = useState(null);
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

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input placeholder="Buscar usuario, email, nombre..." value={buscar} onChange={e => { setBuscar(e.target.value); setPage(1); }}
          style={{ flex: 1, minWidth: 220, background: '#0d0d1a', border: '1px solid #1e1e2e', borderRadius: 8, padding: '8px 14px', color: '#fff', fontSize: 13 }} />
        <select value={estadoFiltro} onChange={e => { setEstadoFiltro(e.target.value); setPage(1); }}
          style={{ background: '#0d0d1a', border: '1px solid #1e1e2e', borderRadius: 8, padding: '8px 14px', color: '#fff', fontSize: 13 }}>
          <option value="">Todos los estados</option>
          <option value="activo">Activo</option>
          <option value="suspendido">Suspendido</option>
          <option value="baneado">Baneado</option>
        </select>
      </div>

      <div style={{ background: '#0d0d1a', border: '1px solid #1e1e2e', borderRadius: 12, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <TH>Usuario</TH><TH>Email</TH><TH>Ciudad</TH><TH>Pos.</TH>
              <TH>PJ</TH><TH>Goles</TH><TH>XP</TH><TH>Equipo</TH>
              <TH>Estado</TH><TH>Registro</TH><TH>Ver</TH>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={11} style={{ textAlign: 'center', padding: 32, color: '#64748b' }}>Cargando...</td></tr>
            ) : lista.map(u => (
              <tr key={u.id}
                onMouseEnter={e => e.currentTarget.style.background = '#13131f'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <TD>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar url={u.foto_url} nombre={u.username} size={36} />
                    <div>
                      <p style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 13 }}>{u.username}</p>
                      <p style={{ color: '#64748b', fontSize: 11 }}>{u.nombre}</p>
                    </div>
                  </div>
                </TD>
                <TD style={{ color: '#94a3b8' }}>{u.email}</TD>
                <TD style={{ color: '#94a3b8' }}>{u.ciudad || '—'}</TD>
                <TD style={{ color: '#64748b', textTransform: 'capitalize' }}>{u.posicion || '—'}</TD>
                <TD style={{ color: '#00e676', fontWeight: 700 }}>{u.partidos_jugados}</TD>
                <TD style={{ color: '#fbbf24', fontWeight: 700 }}>{u.goles_totales}</TD>
                <TD style={{ color: '#a78bfa', fontWeight: 700 }}>{(+u.nivel_xp || 0).toLocaleString()}</TD>
                <TD style={{ color: '#64748b', fontSize: 11 }}>{u.rol === 'capitan' ? '⚡ Capitán' : '—'}</TD>
                <TD><Badge estado={u.estado} /></TD>
                <TD style={{ color: '#64748b', fontSize: 11 }}>{new Date(u.fecha_registro).toLocaleDateString('es')}</TD>
                <TD>
                  <Btn onClick={() => setDetalle(u.id)} color="#38bdf8" small>Ver detalle</Btn>
                </TD>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
        <Btn onClick={() => setPage(p => Math.max(1, p - 1))} color="#64748b" disabled={page === 1}>← Anterior</Btn>
        <span style={{ color: '#64748b', fontSize: 13, lineHeight: '28px' }}>Pág. {page}</span>
        <Btn onClick={() => setPage(p => p + 1)} color="#64748b" disabled={lista.length < 30}>Siguiente →</Btn>
      </div>

      {detalle && <ModalUsuario api={api} userId={detalle} onClose={() => setDetalle(null)} onRefresh={cargar} />}
    </div>
  );
}

// ─── Torneos ──────────────────────────────────────────────────────────────────
function Torneos({ api }) {
  const [lista, setLista] = useState([]);
  const [filtro, setFiltro] = useState('pendiente');

  const cargar = useCallback(async () => {
    const { data } = await api.get('/torneos', { params: { estado: filtro || undefined } });
    setLista(data);
  }, [filtro]);
  useEffect(() => { cargar(); }, [cargar]);

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['pendiente', 'aprobado', 'finalizado', ''].map(f => (
          <button key={f} onClick={() => setFiltro(f)} style={{ padding: '6px 16px', borderRadius: 20, border: '1px solid #1e1e2e', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: filtro === f ? '#7c3aed' : '#0d0d1a', color: filtro === f ? '#fff' : '#64748b' }}>
            {f || 'Todos'}
          </button>
        ))}
      </div>
      <div style={{ background: '#0d0d1a', border: '1px solid #1e1e2e', borderRadius: 12, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr><TH>Torneo</TH><TH>Organizador</TH><TH>Deporte</TH><TH>Ciudad</TH><TH>Inicio</TH><TH>Estado</TH><TH>Acciones</TH></tr></thead>
          <tbody>
            {lista.map(t => (
              <tr key={t.id} onMouseEnter={e => e.currentTarget.style.background = '#13131f'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <TD><p style={{ color: '#e2e8f0', fontWeight: 600 }}>{t.nombre}</p><p style={{ color: '#64748b', fontSize: 11 }}>{t.ciudad}</p></TD>
                <TD style={{ color: '#94a3b8' }}>{t.organizador_username}</TD>
                <TD style={{ color: '#a78bfa', textTransform: 'capitalize' }}>{t.deporte}</TD>
                <TD style={{ color: '#94a3b8' }}>{t.ciudad}</TD>
                <TD style={{ color: '#64748b', fontSize: 11 }}>{t.fecha_inicio ? new Date(t.fecha_inicio).toLocaleDateString('es') : '—'}</TD>
                <TD><Badge estado={t.aprobado ? (t.estado || 'aprobado') : 'pendiente'} /></TD>
                <TD>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {!t.aprobado && <Btn onClick={async () => { await api.put(`/torneos/${t.id}/aprobar`); cargar(); }} color="#00e676">Aprobar</Btn>}
                    {t.aprobado && t.estado !== 'cancelado' && <Btn onClick={async () => { await api.put(`/torneos/${t.id}/rechazar`); cargar(); }} danger>Rechazar</Btn>}
                  </div>
                </TD>
              </tr>
            ))}
            {!lista.length && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: '#64748b', fontSize: 13 }}>Sin torneos</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Equipos ──────────────────────────────────────────────────────────────────
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
      <input placeholder="Buscar equipo o capitán..." value={buscar} onChange={e => { setBuscar(e.target.value); setPage(1); }}
        style={{ marginBottom: 20, width: '100%', maxWidth: 320, background: '#0d0d1a', border: '1px solid #1e1e2e', borderRadius: 8, padding: '8px 14px', color: '#fff', fontSize: 13, boxSizing: 'border-box' }} />
      <div style={{ background: '#0d0d1a', border: '1px solid #1e1e2e', borderRadius: 12, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr><TH>Equipo</TH><TH>Capitán</TH><TH>Deporte</TH><TH>Ciudad</TH><TH>Miembros</TH><TH>Record</TH><TH>Estado</TH><TH>Creado</TH></tr></thead>
          <tbody>
            {lista.map(e => (
              <tr key={e.id} onMouseEnter={ev => ev.currentTarget.style.background = '#13131f'} onMouseLeave={ev => ev.currentTarget.style.background = 'transparent'}>
                <TD><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Avatar url={e.escudo_url} nombre={e.nombre} size={34} /><p style={{ color: '#e2e8f0', fontWeight: 600 }}>{e.nombre}</p></div></TD>
                <TD><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Avatar url={e.capitan_foto} nombre={e.capitan_username} size={24} /><span style={{ color: '#94a3b8' }}>{e.capitan_username}</span></div></TD>
                <TD style={{ color: '#a78bfa', textTransform: 'capitalize' }}>{e.deporte}</TD>
                <TD style={{ color: '#94a3b8' }}>{e.ciudad || '—'}</TD>
                <TD style={{ color: '#00e676', fontWeight: 700 }}>{e.total_miembros}</TD>
                <TD style={{ color: '#64748b', fontSize: 11 }}>{e.wins}W-{e.losses}L-{e.draws}E</TD>
                <TD><Badge estado={e.estado} /></TD>
                <TD style={{ color: '#64748b', fontSize: 11 }}>{new Date(e.fecha_creacion).toLocaleDateString('es')}</TD>
              </tr>
            ))}
            {!lista.length && <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: '#64748b', fontSize: 13 }}>Sin equipos</td></tr>}
          </tbody>
        </table>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
        <Btn onClick={() => setPage(p => Math.max(1, p - 1))} color="#64748b" disabled={page === 1}>← Anterior</Btn>
        <span style={{ color: '#64748b', fontSize: 13, lineHeight: '28px' }}>Pág. {page}</span>
        <Btn onClick={() => setPage(p => p + 1)} color="#64748b" disabled={lista.length < 30}>Siguiente →</Btn>
      </div>
    </div>
  );
}

// ─── Eventos ──────────────────────────────────────────────────────────────────
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
          <button key={f} onClick={() => { setEstadoFiltro(f); setPage(1); }} style={{ padding: '6px 16px', borderRadius: 20, border: '1px solid #1e1e2e', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: estadoFiltro === f ? '#7c3aed' : '#0d0d1a', color: estadoFiltro === f ? '#fff' : '#64748b' }}>
            {f || 'Todos'}
          </button>
        ))}
      </div>
      <div style={{ background: '#0d0d1a', border: '1px solid #1e1e2e', borderRadius: 12, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr><TH>Evento</TH><TH>Creador</TH><TH>Deporte</TH><TH>Ciudad</TH><TH>Inscritos</TH><TH>Precio</TH><TH>Estado</TH><TH>Fecha</TH></tr></thead>
          <tbody>
            {lista.map(ev => (
              <tr key={ev.id} onMouseEnter={e => e.currentTarget.style.background = '#13131f'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <TD><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>{ev.imagen_url && <img src={ev.imagen_url} alt="" style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover' }} />}<p style={{ color: '#e2e8f0', fontWeight: 600 }}>{ev.titulo}</p></div></TD>
                <TD><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Avatar url={ev.creador_foto} nombre={ev.creador_username} size={24} /><span style={{ color: '#94a3b8' }}>{ev.creador_username}</span></div></TD>
                <TD style={{ color: '#a78bfa', textTransform: 'capitalize' }}>{ev.deporte}</TD>
                <TD style={{ color: '#94a3b8' }}>{ev.ciudad || '—'}</TD>
                <TD style={{ color: '#00e676', fontWeight: 700 }}>{ev.total_inscritos}</TD>
                <TD style={{ color: '#fbbf24' }}>{ev.precio_entrada > 0 ? `S/ ${ev.precio_entrada}` : 'Gratis'}</TD>
                <TD><Badge estado={ev.estado} /></TD>
                <TD style={{ color: '#64748b', fontSize: 11 }}>{ev.fecha_evento ? new Date(ev.fecha_evento).toLocaleDateString('es') : '—'}</TD>
              </tr>
            ))}
            {!lista.length && <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: '#64748b', fontSize: 13 }}>Sin eventos</td></tr>}
          </tbody>
        </table>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
        <Btn onClick={() => setPage(p => Math.max(1, p - 1))} color="#64748b" disabled={page === 1}>← Anterior</Btn>
        <span style={{ color: '#64748b', fontSize: 13, lineHeight: '28px' }}>Pág. {page}</span>
        <Btn onClick={() => setPage(p => p + 1)} color="#64748b" disabled={lista.length < 30}>Siguiente →</Btn>
      </div>
    </div>
  );
}

// ─── Reportes ─────────────────────────────────────────────────────────────────
function Reportes({ api }) {
  const [lista, setLista] = useState([]);
  const cargar = async () => { const { data } = await api.get('/reportes'); setLista(data); };
  useEffect(() => { cargar(); }, []);

  return (
    <div style={{ background: '#0d0d1a', border: '1px solid #1e1e2e', borderRadius: 12, overflow: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr><TH>Reportado</TH><TH>Por</TH><TH>Motivo</TH><TH>Descripción</TH><TH>Estado</TH><TH>Fecha</TH><TH>Acción</TH></tr></thead>
        <tbody>
          {lista.map(r => (
            <tr key={r.id} onMouseEnter={e => e.currentTarget.style.background = '#13131f'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <TD style={{ color: '#e2e8f0', fontWeight: 600 }}>{r.usuario_reportado_username || '—'}</TD>
              <TD style={{ color: '#94a3b8' }}>{r.reportado_por_username}</TD>
              <TD style={{ color: '#fbbf24', textTransform: 'capitalize' }}>{r.motivo}</TD>
              <TD style={{ color: '#94a3b8', maxWidth: 200 }}><span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{r.descripcion || '—'}</span></TD>
              <TD><Badge estado={r.estado} /></TD>
              <TD style={{ color: '#64748b', fontSize: 11 }}>{new Date(r.fecha).toLocaleDateString('es')}</TD>
              <TD>{r.estado === 'pendiente' && <div style={{ display: 'flex', gap: 6 }}><Btn onClick={async () => { await api.put(`/reportes/${r.id}`, { estado: 'resuelto' }); cargar(); }} color="#00e676">Resolver</Btn><Btn onClick={async () => { await api.put(`/reportes/${r.id}`, { estado: 'descartado' }); cargar(); }} color="#64748b">Descartar</Btn></div>}</TD>
            </tr>
          ))}
          {!lista.length && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: '#64748b', fontSize: 13 }}>Sin reportes</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

// ─── Anuncios ─────────────────────────────────────────────────────────────────
const EMPTY_FORM = { titulo: '', imagen_url: '', url_destino: '', fecha_inicio: '', fecha_fin: '' };

function FormAnuncio({ inicial, onGuardar, onCancelar, saving, error }) {
  const [form, setForm] = useState(inicial || EMPTY_FORM);
  const today = new Date().toISOString().slice(0, 10);
  const vencido = form.fecha_fin && form.fecha_fin < today;

  return (
    <form onSubmit={e => { e.preventDefault(); onGuardar(form); }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[['Título', 'titulo', 'text'], ['URL Imagen / Video', 'imagen_url', 'text'], ['URL Destino', 'url_destino', 'text'], ['Fecha inicio', 'fecha_inicio', 'date'], ['Fecha fin', 'fecha_fin', 'date']].map(([lbl, key, type]) => (
        <div key={key}>
          <label style={labelS}>{lbl}</label>
          <input type={type} value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
            required={!['url_destino'].includes(key)} style={inputS} />
        </div>
      ))}
      {form.imagen_url && (
        form.imagen_url.match(/\.(mp4|webm|mov)/i)
          ? <video src={form.imagen_url} controls muted style={{ width: '100%', height: 120, borderRadius: 8, objectFit: 'cover' }} />
          : <img src={form.imagen_url} alt="preview" onError={e => e.target.style.display='none'} style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 8 }} />
      )}
      {vencido && <p style={{ color: '#fbbf24', fontSize: 11 }}>⚠️ La fecha de fin ya pasó — el anuncio estará inactivo.</p>}
      {error && <p style={{ color: '#f87171', fontSize: 12 }}>{error}</p>}
      <div style={{ display: 'flex', gap: 8 }}>
        {onCancelar && <Btn onClick={onCancelar} color="#64748b" style={{ flex: 1 }}>Cancelar</Btn>}
        <button type="submit" disabled={saving} style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: saving ? '#1e1e2e' : '#7c3aed', color: '#fff', fontWeight: 700, cursor: saving ? 'wait' : 'pointer' }}>
          {saving ? 'Guardando...' : inicial ? 'Guardar cambios' : '+ Crear anuncio'}
        </button>
      </div>
    </form>
  );
}

function Anuncios({ api }) {
  const [lista, setLista] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editando, setEditando] = useState(null);
  const [filtro, setFiltro] = useState('todos');

  const cargar = async () => { const { data } = await api.get('/anuncios'); setLista(data); };
  useEffect(() => { cargar(); }, []);

  const crear = async (form) => {
    setSaving(true); setError('');
    try { await api.post('/anuncios', form); cargar(); }
    catch (err) { setError(err.response?.data?.error || 'Error'); }
    setSaving(false);
  };

  const guardarEdicion = async (form) => {
    setSaving(true);
    try { await api.put(`/anuncios/${editando.id}`, form); setEditando(null); cargar(); }
    catch {}
    setSaving(false);
  };

  const toggle = async (id) => { await api.put(`/anuncios/${id}/toggle`); cargar(); };
  const eliminar = async (id, titulo) => {
    if (!window.confirm(`¿Eliminar "${titulo}"?`)) return;
    await api.delete(`/anuncios/${id}`); cargar();
  };

  const today = new Date().toISOString().slice(0, 10);
  const filtrados = lista.filter(a => {
    if (filtro === 'activo')  return a.activo && a.fecha_fin >= today;
    if (filtro === 'inactivo') return !a.activo;
    if (filtro === 'vencido')  return a.fecha_fin < today;
    return true;
  });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24, alignItems: 'start' }}>
      {/* Form crear */}
      <div style={{ background: '#0d0d1a', border: '1px solid #1e1e2e', borderRadius: 12, padding: 22, position: 'sticky', top: 0 }}>
        <p style={{ color: '#e2e8f0', fontWeight: 700, marginBottom: 18 }}>Nuevo anuncio</p>
        <FormAnuncio onGuardar={crear} saving={saving} error={error} />
      </div>

      {/* Lista */}
      <div>
        {/* Filtros */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[['todos','Todos'], ['activo','Activos'], ['inactivo','Inactivos'], ['vencido','Vencidos']].map(([v, l]) => (
            <button key={v} onClick={() => setFiltro(v)} style={{ padding: '5px 14px', borderRadius: 20, border: '1px solid #1e1e2e', cursor: 'pointer', fontSize: 11, fontWeight: 600, background: filtro === v ? '#7c3aed' : '#0d0d1a', color: filtro === v ? '#fff' : '#64748b' }}>{l}</button>
          ))}
          <span style={{ color: '#64748b', fontSize: 11, lineHeight: '28px', marginLeft: 4 }}>{filtrados.length} anuncios</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtrados.map(a => {
            const vencido = a.fecha_fin < today;
            const esVideo = a.imagen_url?.match(/\.(mp4|webm|mov)/i);
            return (
              <div key={a.id} style={{ background: '#0d0d1a', border: `1px solid ${a.activo && !vencido ? '#00e67622' : '#1e1e2e'}`, borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ display: 'flex' }}>
                  {/* Miniatura */}
                  <div style={{ width: 140, height: 88, flexShrink: 0, background: '#13131f', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {a.imagen_url ? (
                      esVideo
                        ? <video src={a.imagen_url} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <img src={a.imagen_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : <span style={{ color: '#1e1e2e', fontSize: 32 }}>📢</span>}
                    {esVideo && <span style={{ position: 'absolute', background: '#000a', color: '#fff', fontSize: 10, padding: '2px 6px', borderRadius: 4 }}>🎬 Video</span>}
                  </div>

                  {/* Info */}
                  <div style={{ padding: '12px 16px', flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <p style={{ color: '#e2e8f0', fontWeight: 700, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.titulo}</p>
                      <Badge estado={vencido ? 'vencido' : a.activo ? 'activo' : 'inactivo'} />
                    </div>
                    <p style={{ color: '#64748b', fontSize: 11, marginBottom: 8 }}>
                      {new Date(a.fecha_inicio).toLocaleDateString('es')} — {new Date(a.fecha_fin).toLocaleDateString('es')}
                      {vencido && <span style={{ color: '#f87171', marginLeft: 6 }}>• Vencido</span>}
                    </p>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Btn onClick={() => toggle(a.id)} color={a.activo ? '#fbbf24' : '#00e676'} small>
                        {a.activo ? '⏸ Pausar' : '▶ Activar'}
                      </Btn>
                      <Btn onClick={() => setEditando(a)} color="#7c3aed" small>✏️ Editar</Btn>
                      <Btn onClick={() => eliminar(a.id, a.titulo)} danger small>🗑️</Btn>
                    </div>
                  </div>
                </div>

                {/* Modal editar inline */}
                {editando?.id === a.id && (
                  <div style={{ borderTop: '1px solid #1e1e2e', padding: 16, background: '#13131f' }}>
                    <FormAnuncio
                      inicial={{ titulo: a.titulo, imagen_url: a.imagen_url || '', url_destino: a.url_destino || '', fecha_inicio: a.fecha_inicio?.slice(0,10) || '', fecha_fin: a.fecha_fin?.slice(0,10) || '' }}
                      onGuardar={guardarEdicion}
                      onCancelar={() => setEditando(null)}
                      saving={saving}
                    />
                  </div>
                )}
              </div>
            );
          })}
          {!filtrados.length && <p style={{ color: '#64748b', textAlign: 'center', padding: 32 }}>Sin anuncios en este filtro</p>}
        </div>
      </div>
    </div>
  );
}

// ─── Publicidad ───────────────────────────────────────────────────────────────
const TIPO_COLOR = { foto: '#38bdf8', video: '#a78bfa', banner: '#fbbf24', pack: '#00e676' };
const TIPO_ICON  = { foto: '🖼️', video: '🎬', banner: '📌', pack: '⭐' };

function Publicidad({ api }) {
  const [tarifas, setTarifas] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [detalleId, setDetalleId] = useState(null);
  const [editando, setEditando] = useState(null);
  const [publicarModal, setPublicarModal] = useState(null);
  const [pubSaving, setPubSaving] = useState(false);

  useEffect(() => {
    api.get('/publicidad/tarifas').then(r => setTarifas(r.data)).catch(() => {});
    cargarSolicitudes();
  }, []);

  const cargarSolicitudes = async (estado) => {
    const e = estado !== undefined ? estado : filtroEstado;
    const { data } = await api.get('/publicidad/solicitudes', { params: { estado: e || undefined } });
    setSolicitudes(data);
  };

  const actualizarSolicitud = async (id, campos) => {
    await api.put(`/publicidad/solicitudes/${id}`, campos);
    setEditando(null);
    cargarSolicitudes();
  };

  const iniciarPublicar = (s) => {
    const hoy = new Date().toISOString().slice(0, 10);
    const fin = new Date(Date.now() + (s.duracion_dias || 7) * 86400000).toISOString().slice(0, 10);
    setPublicarModal({ titulo: s.empresa, imagen_url: '', url_destino: '', fecha_inicio: hoy, fecha_fin: fin });
  };

  const publicarAnuncio = async (form) => {
    setPubSaving(true);
    try { await api.post('/anuncios', form); setPublicarModal(null); }
    catch {}
    setPubSaving(false);
  };

  const solicitudDetalle = solicitudes.find(s => s.id === detalleId);
  const solicitudEdit = solicitudes.find(s => s.id === editando);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Tarifas */}
      <div>
        <h2 style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Tarifas vigentes</h2>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          {tarifas.map(t => (
            <div key={t.id} style={{ background: '#0d0d1a', border: `1px solid ${TIPO_COLOR[t.tipo] || '#1e1e2e'}33`, borderRadius: 14, padding: '20px 22px', flex: 1, minWidth: 180, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 12, right: 14, fontSize: 28, opacity: 0.15 }}>{TIPO_ICON[t.tipo]}</div>
              <p style={{ color: TIPO_COLOR[t.tipo] || '#64748b', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                {TIPO_ICON[t.tipo]} {t.tipo}
              </p>
              <p style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 15, marginTop: 4 }}>{t.nombre}</p>
              <p style={{ fontFamily: 'Impact, sans-serif', fontSize: 32, color: '#00e676', margin: '8px 0 4px' }}>
                S/ {parseFloat(t.precio_base).toFixed(0)}
              </p>
              <p style={{ color: '#64748b', fontSize: 11 }}>por {t.duracion_dias} días</p>
              <p style={{ color: '#94a3b8', fontSize: 11, marginTop: 8, lineHeight: 1.5 }}>{t.descripcion}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Solicitudes */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <h2 style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, flex: 1 }}>Solicitudes de empresas</h2>
          {['', 'pendiente', 'contactado', 'activo', 'rechazado'].map(f => (
            <button key={f} onClick={() => { setFiltroEstado(f); cargarSolicitudes(f); }} style={{ padding: '5px 14px', borderRadius: 20, border: '1px solid #1e1e2e', cursor: 'pointer', fontSize: 11, fontWeight: 600, background: filtroEstado === f ? '#7c3aed' : '#0d0d1a', color: filtroEstado === f ? '#fff' : '#64748b' }}>
              {f || 'Todas'}
            </button>
          ))}
        </div>

        <div style={{ background: '#0d0d1a', border: '1px solid #1e1e2e', borderRadius: 12, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr><TH>Empresa</TH><TH>Contacto</TH><TH>Email</TH><TH>Teléfono</TH><TH>Tipo</TH><TH>Días</TH><TH>Precio pactado</TH><TH>Estado</TH><TH>Fecha</TH><TH>Acciones</TH></tr>
            </thead>
            <tbody>
              {solicitudes.map(s => (
                <tr key={s.id} onMouseEnter={e => e.currentTarget.style.background = '#13131f'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <TD style={{ color: '#e2e8f0', fontWeight: 600 }}>{s.empresa}</TD>
                  <TD style={{ color: '#94a3b8' }}>{s.contacto}</TD>
                  <TD style={{ color: '#38bdf8' }}><a href={`mailto:${s.email}`} style={{ color: 'inherit', textDecoration: 'none' }}>{s.email}</a></TD>
                  <TD style={{ color: '#94a3b8' }}>{s.telefono || '—'}</TD>
                  <TD>
                    <span style={{ color: TIPO_COLOR[s.tipo], fontWeight: 700, fontSize: 12 }}>{TIPO_ICON[s.tipo]} {s.tipo}</span>
                  </TD>
                  <TD style={{ color: '#64748b' }}>{s.duracion_dias}d</TD>
                  <TD style={{ color: '#00e676', fontWeight: 700 }}>{s.precio_acordado ? `S/ ${s.precio_acordado}` : '—'}</TD>
                  <TD><Badge estado={s.estado} /></TD>
                  <TD style={{ color: '#64748b', fontSize: 11 }}>{new Date(s.fecha_solicitud).toLocaleDateString('es')}</TD>
                  <TD>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      <Btn onClick={() => setDetalleId(s.id)} color="#38bdf8" small>Ver</Btn>
                      <Btn onClick={() => setEditando(s.id)} color="#7c3aed" small>Gestionar</Btn>
                      {['activo', 'contactado'].includes(s.estado) && (
                        <Btn onClick={() => iniciarPublicar(s)} color="#00e676" small>📢 Publicar</Btn>
                      )}
                    </div>
                  </TD>
                </tr>
              ))}
              {!solicitudes.length && <tr><td colSpan={10} style={{ textAlign: 'center', padding: 32, color: '#64748b', fontSize: 13 }}>Sin solicitudes</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal detalle */}
      {detalleId && solicitudDetalle && (
        <Modal onClose={() => setDetalleId(null)} width={480}>
          <div style={{ padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <span style={{ fontSize: 32 }}>{TIPO_ICON[solicitudDetalle.tipo]}</span>
              <div>
                <h2 style={{ color: '#e2e8f0', fontWeight: 700 }}>{solicitudDetalle.empresa}</h2>
                <Badge estado={solicitudDetalle.estado} />
              </div>
            </div>
            {[
              ['Contacto', solicitudDetalle.contacto],
              ['Email', solicitudDetalle.email],
              ['Teléfono', solicitudDetalle.telefono],
              ['Tipo', `${TIPO_ICON[solicitudDetalle.tipo]} ${solicitudDetalle.tipo}`],
              ['Duración', `${solicitudDetalle.duracion_dias} días`],
              ['Precio pactado', solicitudDetalle.precio_acordado ? `S/ ${solicitudDetalle.precio_acordado}` : 'Sin definir'],
              ['Fecha solicitud', new Date(solicitudDetalle.fecha_solicitud).toLocaleString('es')],
            ].map(([k, v]) => v && (
              <div key={k} style={{ display: 'flex', gap: 12, padding: '7px 0', borderBottom: '1px solid #1e1e2e' }}>
                <span style={{ color: '#64748b', fontSize: 12, width: 120, flexShrink: 0 }}>{k}</span>
                <span style={{ color: '#e2e8f0', fontSize: 13 }}>{v}</span>
              </div>
            ))}
            {solicitudDetalle.mensaje && (
              <div style={{ marginTop: 16, background: '#13131f', borderRadius: 8, padding: 14 }}>
                <p style={{ color: '#64748b', fontSize: 11, marginBottom: 6 }}>MENSAJE</p>
                <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.6 }}>{solicitudDetalle.mensaje}</p>
              </div>
            )}
            {solicitudDetalle.notas_admin && (
              <div style={{ marginTop: 12, background: '#7c3aed11', border: '1px solid #7c3aed33', borderRadius: 8, padding: 14 }}>
                <p style={{ color: '#a78bfa', fontSize: 11, marginBottom: 6 }}>NOTAS ADMIN</p>
                <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.6 }}>{solicitudDetalle.notas_admin}</p>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
              <Btn onClick={() => setDetalleId(null)} color="#64748b">Cerrar</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal gestionar */}
      {editando && solicitudEdit && (
        <Modal onClose={() => setEditando(null)} width={420}>
          <GestionarSolicitud
            solicitud={solicitudEdit}
            onGuardar={campos => actualizarSolicitud(editando, campos)}
            onCerrar={() => setEditando(null)}
          />
        </Modal>
      )}

      {/* Modal publicar como anuncio */}
      {publicarModal && (
        <Modal onClose={() => setPublicarModal(null)} width={440}>
          <div style={{ padding: 28 }}>
            <p style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 16, marginBottom: 4 }}>📢 Publicar como anuncio</p>
            <p style={{ color: '#64748b', fontSize: 12, marginBottom: 22 }}>Añade la URL de la imagen o video y confirma las fechas para publicar.</p>
            <FormAnuncio
              inicial={publicarModal}
              onGuardar={publicarAnuncio}
              onCancelar={() => setPublicarModal(null)}
              saving={pubSaving}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}

function GestionarSolicitud({ solicitud, onGuardar, onCerrar }) {
  const [estado, setEstado] = useState(solicitud.estado);
  const [precio, setPrecio] = useState(solicitud.precio_acordado || '');
  const [notas, setNotas] = useState(solicitud.notas_admin || '');

  return (
    <div style={{ padding: 28 }}>
      <h2 style={{ color: '#e2e8f0', fontWeight: 700, marginBottom: 20 }}>Gestionar — {solicitud.empresa}</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={labelS}>Estado</label>
          <select value={estado} onChange={e => setEstado(e.target.value)} style={{ ...inputS, marginTop: 5 }}>
            <option value="pendiente">Pendiente</option>
            <option value="contactado">Contactado</option>
            <option value="activo">Activo</option>
            <option value="rechazado">Rechazado</option>
          </select>
        </div>
        <div>
          <label style={labelS}>Precio acordado (S/)</label>
          <input type="number" value={precio} onChange={e => setPrecio(e.target.value)} placeholder="0.00" style={inputS} />
        </div>
        <div>
          <label style={labelS}>Notas internas</label>
          <textarea value={notas} onChange={e => setNotas(e.target.value)} rows={4} style={{ ...inputS, resize: 'none', marginTop: 5 }} />
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8 }}>
          <Btn onClick={onCerrar} color="#64748b">Cancelar</Btn>
          <Btn onClick={() => onGuardar({ estado, precio_acordado: precio || null, notas_admin: notas || null })} color="#7c3aed">Guardar</Btn>
        </div>
      </div>
    </div>
  );
}

// ─── Panel principal ──────────────────────────────────────────────────────────
const TABS = [
  { id: 'dashboard',     label: '📊 Dashboard',     group: 'General' },
  { id: 'analytics',     label: '📈 Analytics',     group: 'General' },
  { id: 'mapa',          label: '🗺️ Mapa usuarios',  group: 'General' },
  { id: 'finanzas',      label: '💰 Finanzas',       group: 'General' },
  { id: 'usuarios',      label: '👥 Usuarios',       group: 'Gestión' },
  { id: 'torneos',       label: '🏆 Torneos',        group: 'Gestión' },
  { id: 'equipos',       label: '🛡️ Equipos',        group: 'Gestión' },
  { id: 'eventos',       label: '🗓️ Eventos',        group: 'Gestión' },
  { id: 'reportes',      label: '🚨 Reportes',       group: 'Gestión' },
  { id: 'sanciones',     label: '🔒 Sanciones',      group: 'Gestión' },
  { id: 'medallas',      label: '🏅 Medallas',       group: 'Gestión' },
  { id: 'notificaciones',label: '📣 Notificaciones', group: 'Gestión' },
  { id: 'anuncios',      label: '📢 Anuncios',       group: 'Monetización' },
  { id: 'publicidad',    label: '💼 Publicidad',     group: 'Monetización' },
  { id: 'config',        label: '⚙️ Configuración',  group: 'Sistema' },
  { id: 'audit',         label: '📋 Auditoría',      group: 'Sistema' },
  { id: 'privacidad',    label: '🔐 Privacidad',     group: 'Sistema' },
];

function Panel({ token, admin, onLogout }) {
  const [tab, setTab] = useState('dashboard');
  const api = adminApi(token);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#070710', fontFamily: 'system-ui, sans-serif' }}>
      <aside style={{ width: 220, background: '#0d0d1a', borderRight: '1px solid #1e1e2e', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '24px 20px', borderBottom: '1px solid #1e1e2e' }}>
          <p style={{ fontFamily: 'Impact, sans-serif', fontSize: 18, color: '#00e676', letterSpacing: 3 }}>STREETPLAYER</p>
          <p style={{ color: '#64748b', fontSize: 10, marginTop: 2, textTransform: 'uppercase', letterSpacing: 2 }}>Admin Panel</p>
        </div>
        <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
          {['General','Gestión','Monetización','Sistema'].map(group => (
            <div key={group}>
              <p style={{ color: '#334155', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, padding: '10px 20px 4px' }}>{group}</p>
              {TABS.filter(t => t.group === group).map(t => (
                <button key={t.id} onClick={() => setTab(t.id)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 20px', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: tab === t.id ? 700 : 400, color: tab === t.id ? '#e2e8f0' : '#64748b', borderLeft: tab === t.id ? '3px solid #7c3aed' : '3px solid transparent', background: tab === t.id ? '#7c3aed11' : 'transparent', transition: 'all 0.15s' }}>
                  {t.label}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div style={{ padding: '16px 20px', borderTop: '1px solid #1e1e2e' }}>
          <p style={{ color: '#94a3b8', fontSize: 12, marginBottom: 8 }}>👤 {admin?.username || admin?.email}</p>
          <button onClick={onLogout} style={{ background: 'none', border: '1px solid #1e1e2e', color: '#64748b', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 12, width: '100%' }}>Cerrar sesión</button>
        </div>
      </aside>

      <main style={{ flex: 1, padding: 32, overflowY: 'auto', maxHeight: '100vh' }}>
        <h1 style={{ color: '#e2e8f0', fontSize: 22, fontWeight: 700, marginBottom: 24 }}>
          {TABS.find(t => t.id === tab)?.label}
        </h1>
        {tab === 'dashboard'      && <Dashboard      api={api} />}
        {tab === 'analytics'      && <Analytics      api={api} />}
        {tab === 'mapa'           && <MapaUsuarios   api={api} />}
        {tab === 'finanzas'       && <Finanzas       api={api} />}
        {tab === 'usuarios'       && <Usuarios       api={api} />}
        {tab === 'torneos'        && <Torneos        api={api} />}
        {tab === 'equipos'        && <Equipos        api={api} />}
        {tab === 'eventos'        && <Eventos        api={api} />}
        {tab === 'reportes'       && <Reportes       api={api} />}
        {tab === 'sanciones'      && <Sanciones      api={api} />}
        {tab === 'medallas'       && <Medallas       api={api} />}
        {tab === 'notificaciones' && <Notificaciones api={api} />}
        {tab === 'anuncios'       && <Anuncios       api={api} />}
        {tab === 'publicidad'     && <Publicidad     api={api} />}
        {tab === 'config'         && <Configuracion  api={api} />}
        {tab === 'audit'          && <AuditLog       api={api} />}
        {tab === 'privacidad'     && <Privacidad     api={api} />}
      </main>
    </div>
  );
}

export default function Admin() {
  const [token, setToken] = useState(() => localStorage.getItem('admin_token'));
  const [admin, setAdmin] = useState(null);

  const handleLogin = (tok, adminData) => { setToken(tok); setAdmin(adminData); };
  const handleLogout = () => { localStorage.removeItem('admin_token'); setToken(null); setAdmin(null); };

  if (!token) return <AdminLogin onLogin={handleLogin} />;
  return <Panel token={token} admin={admin} onLogout={handleLogout} />;
}
