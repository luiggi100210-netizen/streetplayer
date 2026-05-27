import { useState, useEffect } from 'react';
import api from '../services/api';

const TAGS_POS = ['buen_companero', 'tecnico', 'puntual', 'goleador', 'rapido', 'lider'];
const TAGS_NEG = ['agresivo', 'no_se_presento', 'tramposo'];

function Estrellas({ valor, onChange }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`text-xl transition-colors ${n <= valor ? 'text-yellow-400' : 'text-sp-border'}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function Calificaciones() {
  const [pendientes, setPendientes]   = useState([]);
  const [eventoSel, setEventoSel]     = useState(null);
  const [jugadores, setJugadores]     = useState([]);
  const [califs, setCalifs]           = useState({});   // { usuario_id: { estrellas, tags_pos, tags_neg, goles, asistencias } }
  const [cargando, setCargando]       = useState(true);
  const [enviando, setEnviando]       = useState(false);
  const [ok, setOk]                   = useState(false);

  useEffect(() => {
    api.get('/calificaciones/pendientes')
      .then(({ data }) => { setPendientes(data); if (data.length > 0) seleccionarEvento(data[0]); })
      .finally(() => setCargando(false));
  }, []);

  const seleccionarEvento = async (ev) => {
    setEventoSel(ev);
    const { data } = await api.get(`/calificaciones/evento/${ev.evento_id}/jugadores`);
    setJugadores(data);
    const init = {};
    data.forEach(j => {
      init[j.id] = { estrellas: j.estrellas || 0, tags_pos: j.tags_positivos || [], tags_neg: j.tags_negativos || [], goles: 0, asistencias: 0, amarilla: false, roja: false };
    });
    setCalifs(init);
  };

  const toggleTag = (uid, tipo, tag) => {
    setCalifs(prev => {
      const u = { ...prev[uid] };
      const key = tipo === 'pos' ? 'tags_pos' : 'tags_neg';
      u[key] = u[key].includes(tag) ? u[key].filter(t => t !== tag) : [...u[key], tag];
      return { ...prev, [uid]: u };
    });
  };

  const setEstrella = (uid, val) => setCalifs(prev => ({ ...prev, [uid]: { ...prev[uid], estrellas: val } }));
  const setNum = (uid, key, val) => setCalifs(prev => ({ ...prev, [uid]: { ...prev[uid], [key]: parseInt(val) || 0 } }));

  const enviar = async () => {
    const lista = jugadores.map(j => {
      const c = califs[j.id] || {};
      return {
        usuario_id:    j.id,
        estrellas:     c.estrellas || 3,
        tags_positivos: c.tags_pos || [],
        tags_negativos: c.tags_neg || [],
        goles:         c.goles   || 0,
        asistencias:   c.asistencias || 0,
        amarillas:     c.amarilla ? 1 : 0,
        rojas:         c.roja    ? 1 : 0,
      };
    });

    setEnviando(true);
    try {
      await api.post('/calificaciones', { evento_id: eventoSel.evento_id, calificaciones: lista });
      setOk(true);
      setPendientes(prev => prev.filter(p => p.evento_id !== eventoSel.evento_id));
    } catch {}
    setEnviando(false);
  };

  if (cargando) return (
    <div className="max-w-2xl mx-auto px-4 py-12 text-center text-sp-muted">Cargando...</div>
  );

  if (ok) return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <p className="text-5xl mb-4">⚡</p>
      <h2 className="font-impact text-3xl mb-2">+5 XP GANADOS</h2>
      <p className="text-sp-muted">Calificaciones enviadas correctamente.</p>
      {pendientes.length > 0 && (
        <button onClick={() => { setOk(false); seleccionarEvento(pendientes[0]); }} className="btn-primary mt-6">
          Siguiente partido
        </button>
      )}
    </div>
  );

  if (pendientes.length === 0) return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <p className="text-5xl mb-4">✅</p>
      <h2 className="font-impact text-3xl mb-2">TODO AL DÍA</h2>
      <p className="text-sp-muted">No tienes calificaciones pendientes.</p>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="badge-yellow">OBLIGATORIO · 24H</span>
          {pendientes.length > 1 && <span className="text-sp-muted text-xs">{pendientes.length} partidos pendientes</span>}
        </div>
        <h1 className="font-impact text-3xl">CALIFICA A TUS COMPAÑEROS</h1>
        {eventoSel && <p className="text-sp-muted text-sm mt-1">{eventoSel.titulo}</p>}
      </div>

      {/* Selector de evento si hay varios */}
      {pendientes.length > 1 && (
        <div className="flex gap-2 flex-wrap mb-6">
          {pendientes.map(p => (
            <button
              key={p.evento_id}
              onClick={() => seleccionarEvento(p)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${eventoSel?.evento_id === p.evento_id ? 'border-sp-green text-sp-green' : 'border-sp-border text-sp-muted hover:text-white'}`}
            >
              {p.titulo}
            </button>
          ))}
        </div>
      )}

      {/* Jugadores */}
      <div className="space-y-4">
        {jugadores.map(j => {
          const c = califs[j.id] || {};
          return (
            <div key={j.id} className="card">
              {/* Jugador header */}
              <div className="flex items-center gap-3 mb-4">
                {j.foto_url ? (
                  <img src={j.foto_url} className="w-10 h-10 rounded-full object-cover border border-sp-border" alt="" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-sp-green flex items-center justify-center text-white font-bold">
                    {j.username?.[0]?.toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-white font-semibold">{j.nombre || j.username}</p>
                  <p className="text-sp-muted text-xs">@{j.username}</p>
                </div>
              </div>

              {/* Estrellas */}
              <div className="mb-4">
                <p className="label mb-2">Valoración general</p>
                <Estrellas valor={c.estrellas || 0} onChange={v => setEstrella(j.id, v)} />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div>
                  <p className="label">⚽ Goles</p>
                  <input type="number" min={0} max={20} value={c.goles || 0} onChange={e => setNum(j.id, 'goles', e.target.value)} className="input w-full text-center py-1.5" />
                </div>
                <div>
                  <p className="label">🅰️ Asist.</p>
                  <input type="number" min={0} max={20} value={c.asistencias || 0} onChange={e => setNum(j.id, 'asistencias', e.target.value)} className="input w-full text-center py-1.5" />
                </div>
                <div>
                  <p className="label">Tarjetas</p>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setCalifs(prev => ({ ...prev, [j.id]: { ...prev[j.id], amarilla: !prev[j.id]?.amarilla } }))}
                      className={`flex-1 py-1.5 rounded border text-xs font-bold transition-colors ${c.amarilla ? 'bg-yellow-500 border-yellow-500 text-black' : 'border-sp-border text-sp-muted'}`}
                    >
                      🟨
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalifs(prev => ({ ...prev, [j.id]: { ...prev[j.id], roja: !prev[j.id]?.roja } }))}
                      className={`flex-1 py-1.5 rounded border text-xs font-bold transition-colors ${c.roja ? 'bg-red-500 border-red-500 text-white' : 'border-sp-border text-sp-muted'}`}
                    >
                      🟥
                    </button>
                  </div>
                </div>
              </div>

              {/* Tags positivos */}
              <div className="mb-3">
                <p className="label mb-2 text-sp-green">Puntos positivos</p>
                <div className="flex flex-wrap gap-2">
                  {TAGS_POS.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(j.id, 'pos', tag)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-colors capitalize ${c.tags_pos?.includes(tag) ? 'bg-sp-green border-sp-green text-white' : 'border-sp-border text-sp-muted hover:text-white'}`}
                    >
                      {tag.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags negativos */}
              <div>
                <p className="label mb-2 text-red-400">Comportamiento</p>
                <div className="flex flex-wrap gap-2">
                  {TAGS_NEG.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(j.id, 'neg', tag)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-colors capitalize ${c.tags_neg?.includes(tag) ? 'bg-red-500/30 border-red-500 text-red-400' : 'border-sp-border text-sp-muted hover:text-white'}`}
                    >
                      {tag.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={enviar}
        disabled={enviando}
        className="btn-primary w-full mt-6 py-3 text-base"
      >
        {enviando ? 'ENVIANDO...' : `ENVIAR CALIFICACIONES (+5 XP)`}
      </button>
    </div>
  );
}
