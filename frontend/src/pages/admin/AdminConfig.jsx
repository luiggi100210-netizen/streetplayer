import { useState, useEffect, useCallback } from 'react';

const inputS = { display: 'block', width: '100%', marginTop: 5, background: '#13131f', border: '1px solid #1e1e2e', borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: 13, boxSizing: 'border-box', outline: 'none' };
const labelS = { color: '#94a3b8', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 };

function Btn({ children, onClick, color = '#7c3aed', danger, disabled, small }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ padding: small ? '3px 9px' : '6px 14px', borderRadius: 6, border: 'none', fontSize: small ? 10 : 12, fontWeight: 700, cursor: disabled ? 'default' : 'pointer', background: danger ? '#ef444422' : color + '22', color: danger ? '#f87171' : color, opacity: disabled ? 0.5 : 1 }}>
      {children}
    </button>
  );
}

function Badge({ estado }) {
  const COLORS = { activo: '#00e676', pendiente: '#fbbf24', inactivo: '#64748b', completado: '#a78bfa', rechazado: '#f87171' };
  const c = COLORS[estado] || '#64748b';
  return <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, padding: '2px 8px', borderRadius: 20, background: c + '22', color: c, border: `1px solid ${c}44` }}>{estado}</span>;
}

// ─── Configuración del sistema ────────────────────────────────────────────────
export function Configuracion({ api }) {
  const [config, setConfig] = useState([]);
  const [editando, setEditando] = useState({});
  const [guardando, setGuardando] = useState({});
  const [ok, setOk] = useState({});

  useEffect(() => {
    api.get('/config').then(r => setConfig(r.data)).catch(() => {});
  }, []);

  const guardar = async (clave, valor) => {
    setGuardando(p => ({ ...p, [clave]: true }));
    try {
      await api.put(`/config/${clave}`, { valor });
      setConfig(p => p.map(c => c.clave === clave ? { ...c, valor } : c));
      setEditando(p => { const n = { ...p }; delete n[clave]; return n; });
      setOk(p => ({ ...p, [clave]: true }));
      setTimeout(() => setOk(p => { const n = { ...p }; delete n[clave]; return n; }), 2000);
    } catch {}
    setGuardando(p => ({ ...p, [clave]: false }));
  };

  const tipoIcon = { boolean: '🔘', integer: '🔢', string: '📝', json: '📦' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p style={{ color: '#64748b', fontSize: 12, marginBottom: 8 }}>Cambios se aplican de inmediato. Los valores boolean usan "true" o "false".</p>
      {config.map(c => (
        <div key={c.clave} style={{ background: '#0d0d1a', border: '1px solid #1e1e2e', borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>{tipoIcon[c.tipo] || '⚙️'}</span>
          <div style={{ flex: 1 }}>
            <p style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 13 }}>{c.clave}</p>
            <p style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>{c.descripcion}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {editando[c.clave] !== undefined ? (
              <>
                <input value={editando[c.clave]} onChange={e => setEditando(p => ({ ...p, [c.clave]: e.target.value }))}
                  style={{ ...inputS, width: 160, marginTop: 0 }} />
                <Btn onClick={() => guardar(c.clave, editando[c.clave])} disabled={guardando[c.clave]} color="#00e676" small>Guardar</Btn>
                <Btn onClick={() => setEditando(p => { const n = { ...p }; delete n[c.clave]; return n; })} color="#64748b" small>✕</Btn>
              </>
            ) : (
              <>
                <code style={{ background: '#13131f', color: ok[c.clave] ? '#00e676' : '#a78bfa', padding: '3px 10px', borderRadius: 6, fontSize: 12, fontFamily: 'monospace', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.valor}</code>
                <Btn onClick={() => setEditando(p => ({ ...p, [c.clave]: c.valor }))} color="#7c3aed" small>Editar</Btn>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Medallas ─────────────────────────────────────────────────────────────────
export function Medallas({ api }) {
  const [lista, setLista] = useState([]);
  const [form, setForm] = useState({ nombre: '', descripcion: '', icono: '🏅', tipo: 'logro' });
  const [otorgar, setOtorgar] = useState(null);
  const [usuarioId, setUsuarioId] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const cargar = () => api.get('/medallas').then(r => setLista(r.data)).catch(() => {});
  useEffect(() => { cargar(); }, []);

  const crear = async (e) => {
    e.preventDefault(); setSaving(true); setMsg('');
    try { await api.post('/medallas', form); setForm({ nombre: '', descripcion: '', icono: '🏅', tipo: 'logro' }); cargar(); setMsg('Medalla creada'); }
    catch (err) { setMsg(err.response?.data?.error || 'Error'); }
    setSaving(false);
  };

  const otorgarMedalla = async (id) => {
    if (!usuarioId.trim()) return;
    try { await api.post(`/medallas/${id}/otorgar`, { usuario_id: usuarioId }); setOtorgar(null); setUsuarioId(''); cargar(); }
    catch (err) { alert(err.response?.data?.error || 'Error'); }
  };

  const TIPO_COLOR = { logro: '#fbbf24', habilidad: '#00e676', participacion: '#7c3aed', especial: '#f87171' };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24, alignItems: 'start' }}>
      {/* Formulario */}
      <div style={{ background: '#0d0d1a', border: '1px solid #1e1e2e', borderRadius: 12, padding: 22 }}>
        <p style={{ color: '#e2e8f0', fontWeight: 700, marginBottom: 18 }}>Nueva medalla</p>
        <form onSubmit={crear} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div><label style={labelS}>Ícono (emoji)</label><input value={form.icono} onChange={e => setForm(p => ({ ...p, icono: e.target.value }))} style={inputS} /></div>
          <div><label style={labelS}>Nombre</label><input required value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} style={inputS} /></div>
          <div><label style={labelS}>Descripción</label><textarea value={form.descripcion} onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))} rows={2} style={{ ...inputS, resize: 'none', marginTop: 5 }} /></div>
          <div>
            <label style={labelS}>Tipo</label>
            <select value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))} style={{ ...inputS, marginTop: 5 }}>
              <option value="logro">Logro</option>
              <option value="habilidad">Habilidad</option>
              <option value="participacion">Participación</option>
              <option value="especial">Especial</option>
            </select>
          </div>
          {msg && <p style={{ color: msg.includes('Error') ? '#f87171' : '#00e676', fontSize: 12 }}>{msg}</p>}
          <button type="submit" disabled={saving} style={{ padding: '9px', borderRadius: 8, border: 'none', background: saving ? '#1e1e2e' : '#7c3aed', color: '#fff', fontWeight: 700, cursor: saving ? 'wait' : 'pointer' }}>
            {saving ? 'Creando...' : 'Crear Medalla'}
          </button>
        </form>
      </div>

      {/* Lista */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
        {lista.map(m => (
          <div key={m.id} style={{ background: '#0d0d1a', border: `1px solid ${TIPO_COLOR[m.tipo] || '#1e1e2e'}33`, borderRadius: 10, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <span style={{ fontSize: 32 }}>{m.icono}</span>
              <div style={{ flex: 1 }}>
                <p style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 14 }}>{m.nombre}</p>
                <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, padding: '1px 6px', borderRadius: 10, background: (TIPO_COLOR[m.tipo] || '#64748b') + '22', color: TIPO_COLOR[m.tipo] || '#64748b' }}>{m.tipo}</span>
              </div>
            </div>
            <p style={{ color: '#64748b', fontSize: 11, marginBottom: 10, lineHeight: 1.5 }}>{m.descripcion}</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: '#a78bfa', fontSize: 11 }}>🏅 {m.total_otorgadas} otorgadas</span>
              <Btn onClick={() => setOtorgar(m)} color="#00e676" small>Otorgar</Btn>
            </div>
          </div>
        ))}
      </div>

      {/* Modal otorgar */}
      {otorgar && (
        <div style={{ position: 'fixed', inset: 0, background: '#000b', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#0d0d1a', border: '1px solid #1e1e2e', borderRadius: 14, padding: 26, width: 380 }}>
            <p style={{ color: '#e2e8f0', fontWeight: 700, marginBottom: 16 }}>Otorgar {otorgar.icono} {otorgar.nombre}</p>
            <label style={labelS}>UUID del usuario</label>
            <input value={usuarioId} onChange={e => setUsuarioId(e.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" style={{ ...inputS, marginBottom: 16 }} />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Btn onClick={() => { setOtorgar(null); setUsuarioId(''); }} color="#64748b">Cancelar</Btn>
              <Btn onClick={() => otorgarMedalla(otorgar.id)} color="#00e676">Otorgar</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sanciones ────────────────────────────────────────────────────────────────
export function Sanciones({ api }) {
  const [lista, setLista] = useState([]);
  const cargar = () => api.get('/sanciones').then(r => setLista(r.data)).catch(() => {});
  useEffect(() => { cargar(); }, []);

  const levantar = async (id, username) => {
    if (!window.confirm(`¿Levantar sanción de ${username}?`)) return;
    await api.delete(`/sanciones/${id}`);
    cargar();
  };

  return (
    <div style={{ background: '#0d0d1a', border: '1px solid #1e1e2e', borderRadius: 12, overflow: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {['Usuario','Tipo','Motivo','Admin','Inicio','Fin','Activo','Acción'].map(h => (
              <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid #1e1e2e', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {lista.map(s => (
            <tr key={s.id} onMouseEnter={e => e.currentTarget.style.background = '#13131f'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {s.foto_url && <img src={s.foto_url} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />}
                  <div>
                    <p style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600 }}>{s.username}</p>
                    <p style={{ color: '#64748b', fontSize: 11 }}>{s.email}</p>
                  </div>
                </div>
              </td>
              <td style={{ padding: '10px 14px' }}><Badge estado={s.tipo} /></td>
              <td style={{ padding: '10px 14px', color: '#94a3b8', fontSize: 12, maxWidth: 200 }}>{s.motivo || '—'}</td>
              <td style={{ padding: '10px 14px', color: '#64748b', fontSize: 11 }}>{s.admin_username || '—'}</td>
              <td style={{ padding: '10px 14px', color: '#64748b', fontSize: 11 }}>{s.fecha_inicio ? new Date(s.fecha_inicio).toLocaleDateString('es') : '—'}</td>
              <td style={{ padding: '10px 14px', color: '#64748b', fontSize: 11 }}>{s.fecha_fin ? new Date(s.fecha_fin).toLocaleDateString('es') : '—'}</td>
              <td style={{ padding: '10px 14px' }}><Badge estado={s.activo ? 'activo' : 'inactivo'} /></td>
              <td style={{ padding: '10px 14px' }}>
                {s.activo && <Btn onClick={() => levantar(s.id, s.username)} color="#00e676" small>Levantar</Btn>}
              </td>
            </tr>
          ))}
          {!lista.length && <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: '#64748b', fontSize: 13 }}>Sin sanciones</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

// ─── Finanzas ─────────────────────────────────────────────────────────────────
export function Finanzas({ api }) {
  const [data, setData] = useState(null);
  useEffect(() => { api.get('/finanzas').then(r => setData(r.data)).catch(() => {}); }, []);
  if (!data) return <p style={{ color: '#64748b', padding: 32 }}>Cargando...</p>;

  const max = Math.max(...(data.tendencia_publicidad.map(t => +t.ingresos)), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        {[
          { label: 'Ingresos brutos eventos', value: `S/ ${parseFloat(data.eventos.ingresos_brutos_eventos).toFixed(2)}`, color: '#00e676' },
          { label: 'Ingresos publicidad', value: `S/ ${parseFloat(data.publicidad.ingresos_publicidad).toFixed(2)}`, color: '#7c3aed' },
          { label: 'Publicidad vigente', value: `S/ ${parseFloat(data.publicidad.publicidad_vigente).toFixed(2)}`, color: '#fbbf24' },
          { label: 'Contratos activos', value: data.publicidad.contratos_activos, color: '#38bdf8' },
          { label: 'Eventos de pago', value: data.eventos.eventos_pago, color: '#a78bfa' },
        ].map((k, i) => (
          <div key={i} style={{ background: '#0d0d1a', border: `1px solid ${k.color}22`, borderRadius: 12, padding: '18px 22px', flex: 1, minWidth: 140 }}>
            <p style={{ color: '#64748b', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>{k.label}</p>
            <p style={{ fontFamily: 'Impact, sans-serif', fontSize: 28, color: k.color, marginTop: 4 }}>{k.value}</p>
          </div>
        ))}
      </div>

      {data.tendencia_publicidad.length > 0 && (
        <div style={{ background: '#0d0d1a', border: '1px solid #1e1e2e', borderRadius: 12, padding: 20 }}>
          <p style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Ingresos publicidad — últimos 6 meses</p>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', height: 100 }}>
            {data.tendencia_publicidad.map((t, i) => {
              const h = Math.round((+t.ingresos / max) * 100);
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <span style={{ color: '#7c3aed', fontSize: 10, fontWeight: 700 }}>S/{parseFloat(t.ingresos).toFixed(0)}</span>
                  <div style={{ width: '100%', height: `${h}%`, background: '#7c3aed66', borderRadius: 4, minHeight: 4 }} />
                  <span style={{ color: '#64748b', fontSize: 9 }}>{new Date(t.mes).toLocaleDateString('es', { month: 'short' })}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Notificaciones masivas ───────────────────────────────────────────────────
export function Notificaciones({ api }) {
  const [form, setForm] = useState({ mensaje: '', tipo: 'sistema', filtro_ciudad: '' });
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const enviar = async (e) => {
    e.preventDefault();
    if (!window.confirm(`¿Enviar notificación masiva a todos los usuarios${form.filtro_ciudad ? ` en ${form.filtro_ciudad}` : ''}?`)) return;
    setSending(true); setResult(null);
    try {
      const { data } = await api.post('/notificaciones/masiva', form);
      setResult({ ok: true, msg: data.mensaje });
      setForm(p => ({ ...p, mensaje: '' }));
    } catch (err) {
      setResult({ ok: false, msg: err.response?.data?.error || 'Error al enviar' });
    }
    setSending(false);
  };

  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ background: '#fbbf2411', border: '1px solid #fbbf2433', borderRadius: 10, padding: '12px 16px', marginBottom: 24 }}>
        <p style={{ color: '#fbbf24', fontSize: 12, fontWeight: 600 }}>⚠️ Las notificaciones se envían a TODOS los usuarios activos (hasta 2000). Usa con cuidado.</p>
      </div>

      <form onSubmit={enviar} style={{ background: '#0d0d1a', border: '1px solid #1e1e2e', borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={labelS}>Tipo</label>
          <select value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))} style={{ ...inputS, marginTop: 5 }}>
            <option value="sistema">Sistema</option>
            <option value="evento">Evento</option>
            <option value="torneo">Torneo</option>
            <option value="equipo">Equipo</option>
          </select>
        </div>
        <div>
          <label style={labelS}>Filtrar por ciudad (opcional)</label>
          <input value={form.filtro_ciudad} onChange={e => setForm(p => ({ ...p, filtro_ciudad: e.target.value }))} placeholder="Lima, Arequipa... (vacío = todos)" style={inputS} />
        </div>
        <div>
          <label style={labelS}>Mensaje *</label>
          <textarea required value={form.mensaje} onChange={e => setForm(p => ({ ...p, mensaje: e.target.value }))} rows={4} maxLength={300} placeholder="Escribe el mensaje aquí..." style={{ ...inputS, resize: 'none', marginTop: 5 }} />
          <p style={{ color: '#64748b', fontSize: 11, textAlign: 'right', marginTop: 4 }}>{form.mensaje.length}/300</p>
        </div>

        {result && <p style={{ color: result.ok ? '#00e676' : '#f87171', fontSize: 13, fontWeight: 600 }}>{result.msg}</p>}

        <button type="submit" disabled={sending || !form.mensaje.trim()} style={{ padding: '12px', borderRadius: 8, border: 'none', background: sending ? '#1e1e2e' : '#7c3aed', color: '#fff', fontWeight: 700, fontSize: 14, cursor: sending ? 'wait' : 'pointer' }}>
          {sending ? 'Enviando...' : '📣 Enviar notificación masiva'}
        </button>
      </form>
    </div>
  );
}
