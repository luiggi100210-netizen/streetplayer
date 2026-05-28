import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import api from '../../services/api';
import { format, isToday, isYesterday } from 'date-fns';
import { es } from 'date-fns/locale';

const COLORES_NIVEL = {
  rookie: '#888', amateur: '#9FE1CB', intermedio: '#60a5fa',
  avanzado: '#a78bfa', pro: '#fbbf24', elite: '#f87171', leyenda: '#fde68a',
};

function Avatar({ foto, username, size = 40, color }) {
  const c = color || '#1D9E75';
  return foto ? (
    <img src={foto} alt=""
      style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover',
               border: `2px solid ${c}`, flexShrink: 0 }} />
  ) : (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: c + '22', border: `2px solid ${c}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Anton, Impact, sans-serif', fontSize: size * 0.38, color: c,
    }}>{username?.[0]?.toUpperCase()}</div>
  );
}

function fechaMsg(fecha) {
  const d = new Date(fecha);
  if (isToday(d))     return format(d, 'HH:mm');
  if (isYesterday(d)) return 'Ayer';
  return format(d, 'dd/MM', { locale: es });
}

function separadorFecha(fecha) {
  const d = new Date(fecha);
  if (isToday(d))     return 'Hoy';
  if (isYesterday(d)) return 'Ayer';
  return format(d, "d 'de' MMMM", { locale: es });
}

export default function Mensajes() {
  const { usuario: yo } = useAuth();
  const socket = useSocket();

  const [convs,       setConvs]       = useState([]);
  const [convSel,     setConvSel]     = useState(null);
  const [mensajes,    setMensajes]    = useState([]);
  const [texto,       setTexto]       = useState('');
  const [cargConvs,   setCargConvs]   = useState(true);
  const [cargMsgs,    setCargMsgs]    = useState(false);
  const [enviando,    setEnviando]    = useState(false);
  const [buscarQ,     setBuscarQ]     = useState('');
  const [buscarRes,   setBuscarRes]   = useState([]);
  const [vistaMovil,  setVistaMovil]  = useState('lista'); // 'lista' | 'chat'

  const endRef   = useRef(null);
  const inputRef = useRef(null);

  // ── Cargar conversaciones ────────────────────────────────
  const cargarConvs = useCallback(async () => {
    try {
      const { data } = await api.get('/mensajes');
      setConvs(data);
    } catch {}
    setCargConvs(false);
  }, []);

  useEffect(() => { cargarConvs(); }, [cargarConvs]);

  // ── Abrir conversación ───────────────────────────────────
  const abrirConv = useCallback(async (conv) => {
    setConvSel(conv);
    setVistaMovil('chat');
    setCargMsgs(true);
    setMensajes([]);
    try {
      const { data } = await api.get(`/mensajes/${conv.id}/mensajes`);
      setMensajes(data);
      setConvs(prev => prev.map(c => c.id === conv.id ? { ...c, no_leidos: 0 } : c));
    } catch {}
    setCargMsgs(false);
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'instant' }), 60);
    inputRef.current?.focus();
  }, []);

  // ── Socket: recibir mensajes ─────────────────────────────
  useEffect(() => {
    if (!socket) return;
    const handler = (msg) => {
      if (convSel?.id && msg.conversacion_id === convSel.id) {
        setMensajes(prev => [...prev, msg]);
        setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
        api.put(`/mensajes/${convSel.id}/leer`).catch(() => {});
      }
      setConvs(prev => {
        const existe = prev.find(c => c.id === msg.conversacion_id);
        if (existe) {
          return [...prev.map(c =>
            c.id === msg.conversacion_id
              ? { ...c, ultimo_mensaje: msg.contenido, ultima_actividad: msg.fecha,
                  no_leidos: convSel?.id === msg.conversacion_id ? 0 : (parseInt(c.no_leidos) || 0) + 1 }
              : c
          )].sort((a, b) => new Date(b.ultima_actividad) - new Date(a.ultima_actividad));
        }
        cargarConvs();
        return prev;
      });
    };
    socket.on('nuevo_mensaje', handler);
    return () => socket.off('nuevo_mensaje', handler);
  }, [socket, convSel, cargarConvs]);

  // ── Buscar usuarios para nueva conv ─────────────────────
  useEffect(() => {
    if (!buscarQ.trim()) { setBuscarRes([]); return; }
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get(`/usuarios/buscar?q=${encodeURIComponent(buscarQ)}`);
        setBuscarRes(data.filter(u => u.id !== yo?.id).slice(0, 6));
      } catch {}
    }, 350);
    return () => clearTimeout(t);
  }, [buscarQ, yo]);

  const iniciarConv = (usuario) => {
    setBuscarQ('');
    setBuscarRes([]);
    const existente = convs.find(c => c.otro_id === usuario.id);
    if (existente) { abrirConv(existente); return; }
    // Conv nueva (sin ID hasta que se envíe el primer mensaje)
    setConvSel({ id: null, otro_id: usuario.id, otro_username: usuario.username,
                 otro_nombre: usuario.nombre, otro_foto: usuario.foto_url, otro_nivel: usuario.nivel_xp });
    setMensajes([]);
    setVistaMovil('chat');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // ── Enviar mensaje ───────────────────────────────────────
  const enviar = async () => {
    if (!texto.trim() || enviando || !convSel) return;
    const txt = texto.trim();
    setTexto('');
    setEnviando(true);
    try {
      const { data } = await api.post(`/mensajes/${convSel.otro_id}`, { contenido: txt });
      setMensajes(prev => [...prev, data]);
      const convId = data.conversacion_id;
      if (!convSel.id) {
        setConvSel(prev => ({ ...prev, id: convId }));
        cargarConvs();
      } else {
        setConvs(prev => [...prev.map(c =>
          c.id === convSel.id
            ? { ...c, ultimo_mensaje: txt, ultima_actividad: data.fecha }
            : c
        )].sort((a, b) => new Date(b.ultima_actividad) - new Date(a.ultima_actividad)));
      }
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch {}
    setEnviando(false);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(); }
  };

  // ── Render helpers ───────────────────────────────────────
  const noLeidos = convs.reduce((s, c) => s + (parseInt(c.no_leidos) || 0), 0);

  // Insertar separadores de fecha entre mensajes
  function conSeparadores(msgs) {
    const result = [];
    let lastDate = null;
    for (const m of msgs) {
      const d = new Date(m.fecha).toDateString();
      if (d !== lastDate) {
        result.push({ type: 'sep', key: 'sep-' + m.id, label: separadorFecha(m.fecha) });
        lastDate = d;
      }
      result.push({ type: 'msg', ...m });
    }
    return result;
  }

  // ── Panel izquierdo: conversaciones ─────────────────────
  const PanelLista = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-sp-border shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h1 className="font-impact text-lg tracking-wide">
            MENSAJES
            {noLeidos > 0 && (
              <span className="ml-2 text-xs bg-sp-green text-white px-1.5 py-0.5 rounded-full font-sans font-bold">
                {noLeidos}
              </span>
            )}
          </h1>
        </div>
        {/* Buscador de usuarios */}
        <div className="relative">
          <input
            value={buscarQ}
            onChange={e => setBuscarQ(e.target.value)}
            placeholder="Buscar jugador..."
            className="input w-full text-sm pl-9"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sp-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {/* Resultados búsqueda */}
          {buscarRes.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-sp-card border border-sp-border rounded-xl shadow-2xl z-20 overflow-hidden">
              {buscarRes.map(u => (
                <button key={u.id} onClick={() => iniciarConv(u)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 transition-colors text-left">
                  <Avatar foto={u.foto_url} username={u.username} size={32} color={COLORES_NIVEL[u.nivel_xp]} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{u.nombre || u.username}</p>
                    <p className="text-xs text-sp-muted truncate">@{u.username}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lista de conversaciones */}
      <div className="flex-1 overflow-y-auto">
        {cargConvs ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-5 h-5 border-2 border-sp-green border-t-transparent rounded-full animate-spin" />
          </div>
        ) : convs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 px-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-sp-card border border-sp-border flex items-center justify-center">
              <svg className="w-7 h-7 text-sp-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-sp-muted text-sm">Sin conversaciones aún.<br/>Busca un jugador arriba.</p>
          </div>
        ) : (
          convs.map(c => {
            const activo  = convSel?.id === c.id;
            const color   = COLORES_NIVEL[c.otro_nivel] || '#888';
            const noLeido = parseInt(c.no_leidos) || 0;
            return (
              <button key={c.id} onClick={() => abrirConv(c)}
                className={`w-full flex items-center gap-3 px-4 py-3 border-b border-sp-border/50 transition-colors text-left ${activo ? 'bg-sp-green/10' : 'hover:bg-white/5'}`}>
                <div className="relative shrink-0">
                  <Avatar foto={c.otro_foto} username={c.otro_username} size={44} color={color} />
                  {noLeido > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-sp-green text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {noLeido > 9 ? '9+' : noLeido}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-1">
                    <p className={`text-sm font-semibold truncate ${noLeido > 0 ? 'text-white' : 'text-sp-muted'}`}>
                      {c.otro_nombre || c.otro_username}
                    </p>
                    <span className="text-[10px] text-sp-muted shrink-0">
                      {c.ultima_actividad ? fechaMsg(c.ultima_actividad) : ''}
                    </span>
                  </div>
                  <p className={`text-xs truncate mt-0.5 ${noLeido > 0 ? 'text-sp-green' : 'text-sp-muted'}`}>
                    {c.ultimo_mensaje || 'Iniciar conversación'}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );

  // ── Panel derecho: chat ──────────────────────────────────
  const PanelChat = () => {
    if (!convSel) {
      return (
        <div className="hidden md:flex flex-col items-center justify-center h-full gap-4 text-center px-8">
          <div className="w-20 h-20 rounded-3xl bg-sp-card border border-sp-border flex items-center justify-center">
            <svg className="w-10 h-10 text-sp-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div>
            <p className="font-impact text-xl text-white">TUS MENSAJES</p>
            <p className="text-sp-muted text-sm mt-1">Selecciona una conversación o busca un jugador para empezar.</p>
          </div>
        </div>
      );
    }

    const color = COLORES_NIVEL[convSel.otro_nivel] || '#888';
    const items = conSeparadores(mensajes);

    return (
      <div className="flex flex-col h-full">
        {/* Header del chat */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-sp-border shrink-0 bg-sp-bg/80 backdrop-blur">
          <button onClick={() => setVistaMovil('lista')}
            className="md:hidden p-1.5 rounded-lg hover:bg-white/10 text-sp-muted hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <Avatar foto={convSel.otro_foto} username={convSel.otro_username} size={38} color={color} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">{convSel.otro_nombre || convSel.otro_username}</p>
            <p className="text-xs font-semibold" style={{ color }}>@{convSel.otro_username} · {convSel.otro_nivel}</p>
          </div>
        </div>

        {/* Mensajes */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {cargMsgs ? (
            <div className="flex justify-center py-10">
              <div className="w-5 h-5 border-2 border-sp-green border-t-transparent rounded-full animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
              <p className="text-sp-muted text-sm">Di algo primero 👋</p>
            </div>
          ) : (
            items.map(item => {
              if (item.type === 'sep') {
                return (
                  <div key={item.key} className="flex items-center gap-3 py-3">
                    <div className="flex-1 h-px bg-sp-border" />
                    <span className="text-[10px] text-sp-muted uppercase tracking-wider font-semibold px-2">{item.label}</span>
                    <div className="flex-1 h-px bg-sp-border" />
                  </div>
                );
              }
              const esMio = item.remitente_id === yo?.id;
              return (
                <div key={item.id} className={`flex ${esMio ? 'justify-end' : 'justify-start'} mb-1`}>
                  {!esMio && (
                    <div className="mr-2 mt-auto shrink-0">
                      <Avatar foto={convSel.otro_foto} username={convSel.otro_username} size={26} color={color} />
                    </div>
                  )}
                  <div className={`max-w-[72%] group`}>
                    <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed break-words ${
                      esMio
                        ? 'bg-sp-green text-white rounded-br-sm'
                        : 'bg-sp-card border border-sp-border text-white rounded-bl-sm'
                    }`}>
                      {item.contenido}
                    </div>
                    <div className={`flex items-center gap-1 mt-0.5 ${esMio ? 'justify-end' : 'justify-start'}`}>
                      <span className="text-[10px] text-sp-muted opacity-0 group-hover:opacity-100 transition-opacity">
                        {format(new Date(item.fecha), 'HH:mm')}
                      </span>
                      {esMio && (
                        <svg className={`w-3 h-3 ${item.leido ? 'text-sp-green' : 'text-sp-muted'} opacity-0 group-hover:opacity-100 transition-opacity`}
                          fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-sp-border shrink-0 bg-sp-bg/80 backdrop-blur">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={texto}
              onChange={e => setTexto(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Escribe un mensaje..."
              rows={1}
              className="input flex-1 resize-none text-sm py-2.5 leading-snug"
              style={{ maxHeight: 100, overflowY: 'auto' }}
            />
            <button
              onClick={enviar}
              disabled={!texto.trim() || enviando}
              className="w-10 h-10 rounded-xl bg-sp-green hover:bg-sp-green-dark disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors shrink-0"
            >
              {enviando ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              )}
            </button>
          </div>
          <p className="text-[10px] text-sp-muted mt-1.5">Enter para enviar · Shift+Enter nueva línea</p>
        </div>
      </div>
    );
  };

  // ── Layout responsivo ────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-56px)] flex">
      {/* Lista (siempre visible en desktop, condicional en móvil) */}
      <div className={`${vistaMovil === 'chat' ? 'hidden' : 'flex'} md:flex flex-col w-full md:w-80 lg:w-96 border-r border-sp-border shrink-0`}>
        <PanelLista />
      </div>

      {/* Chat */}
      <div className={`${vistaMovil === 'lista' ? 'hidden' : 'flex'} md:flex flex-col flex-1 min-w-0`}>
        <PanelChat />
      </div>
    </div>
  );
}
