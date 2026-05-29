import { useState, useEffect, useCallback } from 'react';

function Badge({ estado }) {
  const COLORS = { pendiente: '#fbbf24', procesando: '#38bdf8', completado: '#00e676', rechazado: '#f87171' };
  const c = COLORS[estado] || '#64748b';
  return <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, padding: '2px 8px', borderRadius: 20, background: c + '22', color: c, border: `1px solid ${c}44` }}>{estado}</span>;
}

function Btn({ children, onClick, color = '#7c3aed', danger, small, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ padding: small ? '3px 9px' : '6px 14px', borderRadius: 6, border: 'none', fontSize: small ? 10 : 12, fontWeight: 700, cursor: disabled ? 'default' : 'pointer', background: danger ? '#ef444422' : color + '22', color: danger ? '#f87171' : color, opacity: disabled ? 0.5 : 1 }}>
      {children}
    </button>
  );
}

const inputS = { display: 'block', width: '100%', marginTop: 5, background: '#13131f', border: '1px solid #1e1e2e', borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: 13, boxSizing: 'border-box', outline: 'none' };
const labelS = { color: '#94a3b8', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 };

// ─── Audit Log ────────────────────────────────────────────────────────────────
export function AuditLog({ api }) {
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);

  const cargar = useCallback(async () => {
    api.get('/audit-log', { params: { page } }).then(r => setLogs(r.data)).catch(() => {});
  }, [page]);

  useEffect(() => { cargar(); }, [cargar]);

  const ACCION_COLOR = {
    levantar_sancion: '#00e676', eliminar_cuenta_usuario: '#f87171',
    notificacion_masiva: '#fbbf24', otorgar_medalla: '#a78bfa',
    update_config: '#38bdf8', exportar_datos_usuario: '#64748b',
    crear_medalla: '#7c3aed', actualizar_solicitud_privacidad: '#94a3b8',
  };

  return (
    <div>
      <p style={{ color: '#64748b', fontSize: 12, marginBottom: 16 }}>Registro de todas las acciones realizadas por administradores.</p>
      <div style={{ background: '#0d0d1a', border: '1px solid #1e1e2e', borderRadius: 12, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Fecha','Admin','Acción','Entidad','Detalles','IP'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid #1e1e2e', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {logs.map(l => (
              <tr key={l.id} onMouseEnter={e => e.currentTarget.style.background = '#13131f'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: '9px 14px', color: '#64748b', fontSize: 11, whiteSpace: 'nowrap', borderBottom: '1px solid #0d0d1a' }}>
                  {new Date(l.fecha).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' })}
                </td>
                <td style={{ padding: '9px 14px', color: '#94a3b8', fontSize: 12, borderBottom: '1px solid #0d0d1a' }}>
                  {l.admin_username || '—'}
                </td>
                <td style={{ padding: '9px 14px', borderBottom: '1px solid #0d0d1a' }}>
                  <code style={{ background: '#13131f', color: ACCION_COLOR[l.accion] || '#94a3b8', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontFamily: 'monospace' }}>
                    {l.accion}
                  </code>
                </td>
                <td style={{ padding: '9px 14px', color: '#64748b', fontSize: 11, borderBottom: '1px solid #0d0d1a' }}>
                  {l.entidad ? `${l.entidad}` : '—'}{l.entidad_id ? ` #${l.entidad_id.split('-')[0]}` : ''}
                </td>
                <td style={{ padding: '9px 14px', color: '#64748b', fontSize: 11, maxWidth: 260, borderBottom: '1px solid #0d0d1a' }}>
                  {l.detalles ? (
                    <span style={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {JSON.stringify(l.detalles)}
                    </span>
                  ) : '—'}
                </td>
                <td style={{ padding: '9px 14px', color: '#64748b', fontSize: 10, borderBottom: '1px solid #0d0d1a' }}>
                  {l.ip || '—'}
                </td>
              </tr>
            ))}
            {!logs.length && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#64748b', fontSize: 13 }}>Sin registros de auditoría aún</td></tr>}
          </tbody>
        </table>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
        <Btn onClick={() => setPage(p => Math.max(1, p - 1))} color="#64748b" disabled={page === 1}>← Anterior</Btn>
        <span style={{ color: '#64748b', fontSize: 13, lineHeight: '28px' }}>Pág. {page}</span>
        <Btn onClick={() => setPage(p => p + 1)} color="#64748b" disabled={logs.length < 50}>Siguiente →</Btn>
      </div>
    </div>
  );
}

// ─── Privacidad / GDPR ────────────────────────────────────────────────────────
const TIPO_PRIVACIDAD = {
  exportar_datos: { label: 'Exportar datos', color: '#38bdf8', icon: '📤' },
  eliminar_cuenta: { label: 'Eliminar cuenta', color: '#f87171', icon: '🗑️' },
  rectificar_datos: { label: 'Rectificar datos', color: '#fbbf24', icon: '✏️' },
  portabilidad: { label: 'Portabilidad', color: '#a78bfa', icon: '📦' },
  oposicion_tratamiento: { label: 'Oposición tratamiento', color: '#64748b', icon: '🚫' },
};

function ModalGestionar({ solicitud, onGuardar, onCerrar }) {
  const [estado, setEstado] = useState(solicitud.estado);
  const [respuesta, setRespuesta] = useState(solicitud.respuesta_admin || '');

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000b', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div style={{ background: '#0d0d1a', border: '1px solid #1e1e2e', borderRadius: 14, padding: 28, width: 440 }}>
        <p style={{ color: '#e2e8f0', fontWeight: 700, marginBottom: 20 }}>
          Gestionar solicitud — {TIPO_PRIVACIDAD[solicitud.tipo]?.icon} {TIPO_PRIVACIDAD[solicitud.tipo]?.label}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelS}>Estado</label>
            <select value={estado} onChange={e => setEstado(e.target.value)} style={{ ...inputS, marginTop: 5 }}>
              <option value="pendiente">Pendiente</option>
              <option value="procesando">Procesando</option>
              <option value="completado">Completado</option>
              <option value="rechazado">Rechazado</option>
            </select>
          </div>
          <div>
            <label style={labelS}>Respuesta al usuario</label>
            <textarea value={respuesta} onChange={e => setRespuesta(e.target.value)} rows={4} placeholder="Explica qué acción tomaste..." style={{ ...inputS, resize: 'none', marginTop: 5 }} />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Btn onClick={onCerrar} color="#64748b">Cancelar</Btn>
            <Btn onClick={() => onGuardar({ estado, respuesta_admin: respuesta || null })} color="#7c3aed">Guardar</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

function ModalExportar({ datos, onCerrar }) {
  const exportar = () => {
    const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `datos_usuario_${datos.datos_personales?.username}_${new Date().toISOString().slice(0,10)}.json`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000b', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div style={{ background: '#0d0d1a', border: '1px solid #1e1e2e', borderRadius: 14, padding: 28, width: 480 }}>
        <p style={{ color: '#e2e8f0', fontWeight: 700, marginBottom: 16 }}>Datos de {datos.datos_personales?.username}</p>
        <div style={{ background: '#13131f', borderRadius: 8, padding: 12, marginBottom: 16, maxHeight: 200, overflowY: 'auto' }}>
          <pre style={{ color: '#94a3b8', fontSize: 10, margin: 0, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(datos.datos_personales, null, 2)}
          </pre>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            ['Partidos', datos.partidos?.length],
            ['Eventos', datos.eventos?.length],
            ['Medallas', datos.medallas?.length],
            ['Publicaciones', datos.publicaciones?.length],
          ].map(([label, count]) => (
            <div key={label} style={{ background: '#13131f', borderRadius: 8, padding: '8px 12px', flex: 1, textAlign: 'center' }}>
              <p style={{ color: '#64748b', fontSize: 10 }}>{label}</p>
              <p style={{ color: '#a78bfa', fontWeight: 700 }}>{count}</p>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
          <Btn onClick={onCerrar} color="#64748b">Cerrar</Btn>
          <Btn onClick={exportar} color="#00e676">⬇️ Descargar JSON</Btn>
        </div>
      </div>
    </div>
  );
}

export function Privacidad({ api }) {
  const [solicitudes, setSolicitudes] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [gestionando, setGestionando] = useState(null);
  const [exportando, setExportando] = useState(null);
  const [loadingExport, setLoadingExport] = useState(null);

  const cargar = useCallback(async () => {
    api.get('/privacidad/solicitudes', { params: { estado: filtroEstado || undefined } }).then(r => setSolicitudes(r.data)).catch(() => {});
  }, [filtroEstado]);

  useEffect(() => { cargar(); }, [cargar]);

  const actualizarSolicitud = async (id, campos) => {
    await api.put(`/privacidad/solicitudes/${id}`, campos);
    setGestionando(null);
    cargar();
  };

  const exportarDatos = async (userId) => {
    setLoadingExport(userId);
    try {
      const { data } = await api.get(`/privacidad/exportar/${userId}`);
      setExportando(data);
    } catch (err) { alert('Error al exportar datos'); }
    setLoadingExport(null);
  };

  const eliminarCuenta = async (userId, username) => {
    const motivo = window.prompt(`¿Anonimizar cuenta de ${username}? Escribe el motivo:`);
    if (motivo === null) return;
    if (!window.confirm(`CONFIRMA: anonimizar permanentemente la cuenta de ${username}. Esto NO se puede deshacer.`)) return;
    await api.delete(`/privacidad/usuarios/${userId}`, { data: { motivo } });
    alert('Cuenta anonimizada');
    cargar();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Info GDPR */}
      <div style={{ background: '#38bdf811', border: '1px solid #38bdf833', borderRadius: 10, padding: '14px 18px' }}>
        <p style={{ color: '#38bdf8', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>🔐 Política de privacidad y GDPR</p>
        <p style={{ color: '#94a3b8', fontSize: 12, lineHeight: 1.7 }}>
          Los usuarios tienen derecho a: <strong>exportar</strong> sus datos, solicitar <strong>eliminación</strong> de cuenta,
          <strong> rectificación</strong> de información incorrecta, <strong>portabilidad</strong> y
          <strong> oposición al tratamiento</strong>. Debes procesar cada solicitud en un máximo de 30 días hábiles según la normativa vigente.
        </p>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {['', 'pendiente', 'procesando', 'completado', 'rechazado'].map(f => (
          <button key={f} onClick={() => setFiltroEstado(f)} style={{ padding: '5px 14px', borderRadius: 20, border: '1px solid #1e1e2e', cursor: 'pointer', fontSize: 11, fontWeight: 600, background: filtroEstado === f ? '#7c3aed' : '#0d0d1a', color: filtroEstado === f ? '#fff' : '#64748b' }}>
            {f || 'Todas'}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div style={{ background: '#0d0d1a', border: '1px solid #1e1e2e', borderRadius: 12, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Usuario','Email','Tipo','Motivo','Estado','Fecha','Acciones'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid #1e1e2e', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {solicitudes.map(s => {
              const tipo = TIPO_PRIVACIDAD[s.tipo] || { label: s.tipo, color: '#64748b', icon: '❓' };
              return (
                <tr key={s.id} onMouseEnter={e => e.currentTarget.style.background = '#13131f'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '10px 14px', color: '#e2e8f0', fontSize: 13, fontWeight: 600, borderBottom: '1px solid #0d0d1a' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {s.foto_url && <img src={s.foto_url} style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover' }} />}
                      {s.username || s.usuario_username || '—'}
                    </div>
                  </td>
                  <td style={{ padding: '10px 14px', color: '#64748b', fontSize: 11, borderBottom: '1px solid #0d0d1a' }}>{s.email || s.usuario_email || '—'}</td>
                  <td style={{ padding: '10px 14px', borderBottom: '1px solid #0d0d1a' }}>
                    <span style={{ color: tipo.color, fontSize: 12, fontWeight: 600 }}>{tipo.icon} {tipo.label}</span>
                  </td>
                  <td style={{ padding: '10px 14px', color: '#94a3b8', fontSize: 11, maxWidth: 180, borderBottom: '1px solid #0d0d1a' }}>
                    <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {s.motivo || '—'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', borderBottom: '1px solid #0d0d1a' }}><Badge estado={s.estado} /></td>
                  <td style={{ padding: '10px 14px', color: '#64748b', fontSize: 11, whiteSpace: 'nowrap', borderBottom: '1px solid #0d0d1a' }}>
                    {new Date(s.fecha_solicitud).toLocaleDateString('es')}
                  </td>
                  <td style={{ padding: '10px 14px', borderBottom: '1px solid #0d0d1a' }}>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      <Btn onClick={() => setGestionando(s)} color="#7c3aed" small>Gestionar</Btn>
                      {s.usuario_id && (
                        <Btn onClick={() => exportarDatos(s.usuario_id)} color="#38bdf8" small disabled={loadingExport === s.usuario_id}>
                          {loadingExport === s.usuario_id ? '...' : '📤 Exportar'}
                        </Btn>
                      )}
                      {s.tipo === 'eliminar_cuenta' && s.usuario_id && (
                        <Btn onClick={() => eliminarCuenta(s.usuario_id, s.username || s.usuario_username)} danger small>🗑️ Anonimizar</Btn>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {!solicitudes.length && (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: '#64748b', fontSize: 13 }}>Sin solicitudes de privacidad</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {gestionando && (
        <ModalGestionar
          solicitud={gestionando}
          onGuardar={campos => actualizarSolicitud(gestionando.id, campos)}
          onCerrar={() => setGestionando(null)}
        />
      )}
      {exportando && (
        <ModalExportar datos={exportando} onCerrar={() => setExportando(null)} />
      )}
    </div>
  );
}
