import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const DEPORTES = ['', 'futbol', 'basquet', 'tenis', 'padel', 'voley', 'running', 'ciclismo'];
const DEPORTES_EMOJI = { futbol: '⚽', basquet: '🏀', tenis: '🎾', padel: '🏸', voley: '🏐', running: '🏃', ciclismo: '🚴', otro: '🎯' };

const TIPO_COLOR  = { pichanga: '#1D9E75', reto: '#e5a000', campeonato: '#e05353' };
const TIPO_LABEL  = { pichanga: 'Pichanga', reto: 'Reto', campeonato: 'Campeonato' };

const ESTADO_CFG = {
  abierto:    { color: '#1D9E75', bg: 'rgba(29,158,117,0.12)', label: 'Abierto' },
  lleno:      { color: '#f87171', bg: 'rgba(248,113,113,0.12)', label: 'Lleno' },
  en_curso:   { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  label: 'En curso' },
  finalizado: { color: '#888',    bg: 'rgba(136,136,136,0.12)', label: 'Finalizado' },
  cancelado:  { color: '#888',    bg: 'rgba(136,136,136,0.12)', label: 'Cancelado' },
};

function formatFecha(f) {
  if (!f) return '';
  return new Date(f).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function TarjetaEvento({ evento }) {
  const inscritos   = parseInt(evento.cupos_ocupados) || 0;
  const cupos       = parseInt(evento.cupos_total)    || 10;
  const porcentaje  = Math.min((inscritos / cupos) * 100, 100);
  const tipoColor   = TIPO_COLOR[evento.tipo]  || '#1D9E75';
  const estadoCfg   = ESTADO_CFG[evento.estado] || ESTADO_CFG.abierto;
  const emoji       = DEPORTES_EMOJI[evento.deporte] || '🎯';

  return (
    <Link to={`/eventos/${evento.id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div style={{
        background: '#111', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 12, overflow: 'hidden',
        transition: 'transform .15s, border-color .2s, box-shadow .2s',
      }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.borderColor = tipoColor + '55';
          e.currentTarget.style.boxShadow = `0 8px 32px ${tipoColor}22`;
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        {/* Accent top bar */}
        <div style={{ height: 3, background: tipoColor }} />

        {/* Imagen o placeholder */}
        {evento.foto_url ? (
          <img src={evento.foto_url} alt={evento.titulo} style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }} />
        ) : (
          <div style={{
            height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: `linear-gradient(135deg, ${tipoColor}18 0%, rgba(10,10,10,0) 70%)`,
            fontSize: 56,
          }}>{emoji}</div>
        )}

        <div style={{ padding: '14px 16px 16px' }}>
          {/* Badges */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
            {evento.tipo && (
              <span style={{
                fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em',
                padding: '3px 8px', borderRadius: 4,
                color: tipoColor, background: tipoColor + '18', border: `1px solid ${tipoColor}44`,
              }}>{TIPO_LABEL[evento.tipo] || evento.tipo}</span>
            )}
            <span style={{
              fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em',
              padding: '3px 8px', borderRadius: 4,
              color: estadoCfg.color, background: estadoCfg.bg, border: `1px solid ${estadoCfg.color}44`,
            }}>{estadoCfg.label}</span>
            {evento.nivel && evento.nivel !== 'todos' && (
              <span style={{
                fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
                padding: '3px 8px', borderRadius: 4, color: 'rgba(255,255,255,0.4)',
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              }}>{evento.nivel}</span>
            )}
          </div>

          {/* Título */}
          <h3 style={{
            fontFamily: 'Anton, Impact, sans-serif', fontSize: 17, color: '#fff',
            letterSpacing: '0.02em', marginBottom: 8, lineHeight: 1.2,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{evento.titulo || evento.nombre}</h3>

          {/* Cancha + fecha */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
            {evento.ciudad && (
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 5 }}>
                <svg width={11} height={11} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {evento.nombre_cancha ? `${evento.nombre_cancha} · ${evento.ciudad}` : evento.ciudad}
              </span>
            )}
            {evento.fecha_evento && (
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 5 }}>
                <svg width={11} height={11} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {formatFecha(evento.fecha_evento)}
              </span>
            )}
          </div>

          {/* Cupos + precio */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
              {inscritos}/{cupos} jugadores
            </span>
            {evento.precio > 0 && (
              <span style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 14, color: '#fbbf24' }}>
                S/ {evento.precio}
              </span>
            )}
            {evento.formato && (
              <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {evento.formato}v{evento.formato}
              </span>
            )}
          </div>

          {/* Barra de cupos */}
          <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 2, transition: 'width .3s',
              width: `${porcentaje}%`,
              background: porcentaje >= 100 ? '#f87171' : porcentaje >= 70 ? '#fbbf24' : tipoColor,
            }} />
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function Eventos() {
  const [eventos,  setEventos]  = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtros,  setFiltros]  = useState({ deporte: '', ciudad: '', estado: 'abierto' });

  useEffect(() => {
    const cargar = async () => {
      setCargando(true);
      try {
        const p = new URLSearchParams();
        if (filtros.deporte) p.set('deporte', filtros.deporte);
        if (filtros.ciudad)  p.set('ciudad',  filtros.ciudad);
        if (filtros.estado)  p.set('estado',  filtros.estado);
        const { data } = await api.get(`/eventos?${p}`);
        setEventos(data);
      } catch {}
      setCargando(false);
    };
    cargar();
  }, [filtros]);

  const setF = (k, v) => setFiltros(p => ({ ...p, [k]: v }));

  const ESTADOS = [
    { val: 'abierto',    label: 'Abiertos',    color: '#1D9E75' },
    { val: 'en_curso',   label: 'En curso',    color: '#fbbf24' },
    { val: 'finalizado', label: 'Finalizados', color: '#888'    },
    { val: '',           label: 'Todos',       color: 'rgba(255,255,255,0.4)' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">

      {/* ── HEADER ── */}
      <div style={{
        background: 'linear-gradient(135deg, #111 0%, #1a1a1a 60%, #0f0f0f 100%)',
        border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden',
      }}>
        <div style={{ height: 4, background: 'linear-gradient(to right, #1D9E75, #e5a000, #e05353)' }} />
        <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.18em', color: '#1D9E75', textTransform: 'uppercase' }}>
                ⚽ Eventos deportivos
              </span>
            </div>
            <h1 style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 'clamp(24px, 4vw, 40px)', color: '#fff', letterSpacing: '0.04em', lineHeight: 1 }}>
              ENCUENTRA TU PARTIDO
            </h1>
          </div>
          <Link to="/eventos/nuevo" className="btn-primary text-sm">+ Crear evento</Link>
        </div>

        {/* Filtros */}
        <div style={{ padding: '0 24px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          {/* Estado pills */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {ESTADOS.map(({ val, label, color }) => (
              <button key={val || 'todos'} onClick={() => setF('estado', val)}
                style={{
                  fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
                  padding: '6px 14px', borderRadius: 999, border: `1px solid ${filtros.estado === val ? color : 'rgba(255,255,255,0.08)'}`,
                  background: filtros.estado === val ? color + '22' : 'transparent',
                  color: filtros.estado === val ? color : 'rgba(255,255,255,0.4)',
                  cursor: 'pointer', transition: 'all .2s',
                }}>{label}</button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 6, marginLeft: 'auto', flexWrap: 'wrap' }}>
            {/* Deportes */}
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {DEPORTES.map(d => (
                <button key={d || 'todos'} onClick={() => setF('deporte', d)}
                  style={{
                    fontSize: 10, fontWeight: 700, padding: '5px 10px', borderRadius: 999,
                    border: `1px solid ${filtros.deporte === d ? '#1D9E75' : 'rgba(255,255,255,0.08)'}`,
                    background: filtros.deporte === d ? '#1D9E7520' : 'transparent',
                    color: filtros.deporte === d ? '#1D9E75' : 'rgba(255,255,255,0.35)',
                    cursor: 'pointer', textTransform: 'capitalize', transition: 'all .15s',
                  }}>{d || 'Todos'} {d && DEPORTES_EMOJI[d]}</button>
              ))}
            </div>
            <input value={filtros.ciudad} onChange={e => setF('ciudad', e.target.value)}
              placeholder="Ciudad..." className="input text-sm" style={{ width: 120 }} />
          </div>
        </div>
      </div>

      {/* ── GRID ── */}
      {cargando ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} style={{ height: 280, borderRadius: 12, background: 'rgba(255,255,255,0.03)', animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      ) : eventos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 24px' }}>
          <p style={{ fontSize: 48, marginBottom: 12 }}>📍</p>
          <p style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 22, color: '#fff', marginBottom: 8 }}>SIN EVENTOS</p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginBottom: 24 }}>Intenta con otros filtros o crea el primero</p>
          <Link to="/eventos/nuevo" className="btn-primary">+ Crear evento</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {eventos.map(ev => <TarjetaEvento key={ev.id} evento={ev} />)}
        </div>
      )}
    </div>
  );
}
