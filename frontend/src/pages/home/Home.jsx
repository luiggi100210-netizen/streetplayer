import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

function TarjetaEvento({ evento }) {
  const inscritos = parseInt(evento.inscritos) || 0;
  const cupos = evento.cupos || 10;
  const porcentaje = Math.min((inscritos / cupos) * 100, 100);

  return (
    <Link to={`/eventos/${evento.id}`} className="card hover:border-sp-green/50 transition-colors block">
      {evento.foto_url && (
        <img src={evento.foto_url} alt={evento.nombre} className="w-full h-32 object-cover rounded-lg mb-3" />
      )}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-white text-sm leading-tight">{evento.nombre}</h3>
        <span className="badge-green text-xs shrink-0">{evento.deporte}</span>
      </div>
      <p className="text-gray-400 text-xs mb-1">{evento.ciudad}</p>
      <p className="text-gray-500 text-xs mb-3">
        {evento.fecha ? new Date(evento.fecha).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
      </p>
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">Cupos</span>
          <span className={porcentaje >= 90 ? 'text-red-400' : 'text-sp-green'}>{inscritos}/{cupos}</span>
        </div>
        <div className="w-full bg-sp-border rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full transition-all ${porcentaje >= 90 ? 'bg-red-500' : 'bg-sp-green'}`}
            style={{ width: `${porcentaje}%` }}
          />
        </div>
      </div>
    </Link>
  );
}

function TarjetaPublicacion({ pub, onLike }) {
  const [liked, setLiked] = useState(pub.liked_by_me || false);
  const [likes, setLikes] = useState(parseInt(pub.likes_count) || 0);
  const [comentarios, setComentarios] = useState([]);
  const [mostrarComentarios, setMostrarComentarios] = useState(false);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [enviando, setEnviando] = useState(false);

  const handleLike = async () => {
    try {
      await api.post(`/feed/${pub.id}/like`);
      setLiked(!liked);
      setLikes(prev => liked ? prev - 1 : prev + 1);
    } catch {}
  };

  const cargarComentarios = async () => {
    if (mostrarComentarios) { setMostrarComentarios(false); return; }
    try {
      const { data } = await api.get(`/feed/${pub.id}/comentarios`);
      setComentarios(data);
      setMostrarComentarios(true);
    } catch {}
  };

  const enviarComentario = async (e) => {
    e.preventDefault();
    if (!nuevoComentario.trim()) return;
    setEnviando(true);
    try {
      const { data } = await api.post(`/feed/${pub.id}/comentarios`, { contenido: nuevoComentario });
      setComentarios(prev => [...prev, data]);
      setNuevoComentario('');
    } catch {}
    setEnviando(false);
  };

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-3">
        <Link to={`/perfil/${pub.usuario_id}`}>
          {pub.foto_url ? (
            <img src={pub.foto_url} alt={pub.username} className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-sp-green/20 flex items-center justify-center text-sp-green font-bold">
              {pub.username?.[0]?.toUpperCase()}
            </div>
          )}
        </Link>
        <div>
          <Link to={`/perfil/${pub.usuario_id}`} className="font-semibold text-white hover:text-sp-green transition-colors text-sm">
            {pub.nombre || pub.username}
          </Link>
          <p className="text-gray-500 text-xs">
            @{pub.username} · {formatDistanceToNow(new Date(pub.fecha), { addSuffix: true, locale: es })}
          </p>
        </div>
        {pub.deporte && <span className="ml-auto badge-orange text-xs">{pub.deporte}</span>}
      </div>

      {pub.contenido && <p className="text-gray-200 text-sm mb-3 leading-relaxed">{pub.contenido}</p>}

      {pub.imagen_url && (
        <img src={pub.imagen_url} alt="Post" className="w-full rounded-lg mb-3 max-h-96 object-cover" />
      )}

      <div className="flex items-center gap-4 pt-3 border-t border-sp-border">
        <button onClick={handleLike} className={`flex items-center gap-1.5 text-sm transition-colors ${liked ? 'text-sp-green' : 'text-gray-400 hover:text-sp-green'}`}>
          <svg className="w-4 h-4" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          {likes}
        </button>
        <button onClick={cargarComentarios} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-sp-green transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {pub.comentarios_count || 0}
        </button>
      </div>

      {mostrarComentarios && (
        <div className="mt-3 pt-3 border-t border-sp-border space-y-3">
          {comentarios.map(c => (
            <div key={c.id} className="flex gap-2">
              <div className="w-7 h-7 rounded-full bg-sp-green/20 flex items-center justify-center text-sp-green text-xs font-bold shrink-0">
                {c.username?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 bg-sp-border/50 rounded-lg px-3 py-2">
                <p className="text-xs font-medium text-sp-green">@{c.username}</p>
                <p className="text-sm text-gray-200">{c.contenido}</p>
              </div>
            </div>
          ))}
          <form onSubmit={enviarComentario} className="flex gap-2">
            <input
              value={nuevoComentario}
              onChange={e => setNuevoComentario(e.target.value)}
              placeholder="Escribe un comentario..."
              className="input flex-1 text-sm py-1.5"
            />
            <button type="submit" disabled={enviando} className="btn-green text-sm px-3 py-1.5">
              {enviando ? '...' : 'Enviar'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function RankingMini({ ranking }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-white text-sm">Top Ranking</h3>
        <Link to="/ranking" className="text-sp-green text-xs hover:underline">Ver todo</Link>
      </div>
      <div className="space-y-2">
        {ranking.slice(0, 5).map((item, i) => (
          <div key={item.usuario_id} className="flex items-center gap-2">
            <span className={`text-xs font-bold w-5 text-center ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-gray-500'}`}>
              {i + 1}
            </span>
            {item.foto_url ? (
              <img src={item.foto_url} className="w-7 h-7 rounded-full object-cover" alt={item.username} />
            ) : (
              <div className="w-7 h-7 rounded-full bg-sp-green/20 flex items-center justify-center text-sp-green text-xs font-bold">
                {item.username?.[0]?.toUpperCase()}
              </div>
            )}
            <span className="text-gray-300 text-xs flex-1 truncate">{item.username}</span>
            <span className="text-sp-green text-xs font-mono">{item.puntos}pts</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const { usuario } = useAuth();
  const [feed, setFeed] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [tab, setTab] = useState('feed');
  const [cargando, setCargando] = useState(true);
  const [nuevaPublicacion, setNuevaPublicacion] = useState('');
  const [publicando, setPublicando] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      setCargando(true);
      try {
        const [feedRes, eventosRes, rankingRes] = await Promise.all([
          api.get('/feed'),
          api.get('/eventos?estado=abierto'),
          api.get('/ranking'),
        ]);
        setFeed(feedRes.data);
        setEventos(eventosRes.data.slice(0, 6));
        setRanking(rankingRes.data);
      } catch {}
      setCargando(false);
    };
    cargar();
  }, []);

  const publicar = async (e) => {
    e.preventDefault();
    if (!nuevaPublicacion.trim()) return;
    setPublicando(true);
    try {
      const { data } = await api.post('/feed', { contenido: nuevaPublicacion });
      setFeed(prev => [data, ...prev]);
      setNuevaPublicacion('');
    } catch {}
    setPublicando(false);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar izquierdo */}
        <aside className="hidden lg:block space-y-4">
          <div className="card">
            <div className="flex items-center gap-3">
              {usuario?.foto_url ? (
                <img src={usuario.foto_url} className="w-12 h-12 rounded-full object-cover" alt={usuario.username} />
              ) : (
                <div className="w-12 h-12 rounded-full bg-sp-green/20 flex items-center justify-center text-sp-green text-xl font-bold">
                  {usuario?.username?.[0]?.toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-semibold text-white">{usuario?.nombre || usuario?.username}</p>
                <p className="text-gray-400 text-sm">@{usuario?.username}</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-sp-border grid grid-cols-2 gap-2 text-center">
              <div>
                <p className="text-sp-green font-bold">{usuario?.partidos_jugados || 0}</p>
                <p className="text-gray-500 text-xs">Partidos</p>
              </div>
              <div>
                <p className="text-sp-green-light font-bold uppercase">{usuario?.nivel_xp || 'rookie'}</p>
                <p className="text-gray-500 text-xs">Nivel</p>
              </div>
            </div>
            <Link to={`/perfil/${usuario?.id}`} className="mt-3 btn-ghost text-sm w-full text-center block">
              Ver perfil
            </Link>
          </div>

          {ranking.length > 0 && <RankingMini ranking={ranking} />}
        </aside>

        {/* Feed principal */}
        <main className="lg:col-span-2 space-y-4">
          {/* Tabs */}
          <div className="flex gap-1 bg-sp-card rounded-xl p-1 border border-sp-border">
            {['feed', 'eventos'].map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all capitalize ${tab === t ? 'bg-sp-green text-sp-bg' : 'text-gray-400 hover:text-white'}`}
              >
                {t === 'feed' ? 'Feed' : 'Eventos cercanos'}
              </button>
            ))}
          </div>

          {tab === 'feed' && (
            <>
              {/* Nueva publicacion */}
              <form onSubmit={publicar} className="card">
                <div className="flex gap-3">
                  {usuario?.foto_url ? (
                    <img src={usuario.foto_url} className="w-10 h-10 rounded-full object-cover shrink-0" alt="" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-sp-green/20 flex items-center justify-center text-sp-green font-bold shrink-0">
                      {usuario?.username?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <textarea
                    value={nuevaPublicacion}
                    onChange={e => setNuevaPublicacion(e.target.value)}
                    placeholder="Comparte algo del deporte..."
                    rows={2}
                    className="input flex-1 resize-none text-sm"
                  />
                </div>
                <div className="flex justify-end mt-3">
                  <button type="submit" disabled={publicando || !nuevaPublicacion.trim()} className="btn-green text-sm">
                    {publicando ? 'Publicando...' : 'Publicar'}
                  </button>
                </div>
              </form>

              {cargando ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="card animate-pulse">
                      <div className="flex gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-sp-border" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 bg-sp-border rounded w-1/3" />
                          <div className="h-2 bg-sp-border rounded w-1/4" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-3 bg-sp-border rounded" />
                        <div className="h-3 bg-sp-border rounded w-3/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : feed.length === 0 ? (
                <div className="card text-center py-12">
                  <p className="text-4xl mb-3">🏃</p>
                  <p className="text-gray-400">Tu feed esta vacio. Sigue a otros jugadores o crea la primera publicacion.</p>
                  <Link to="/eventos" className="btn-green mt-4 inline-block">Explorar eventos</Link>
                </div>
              ) : (
                feed.map(pub => <TarjetaPublicacion key={pub.id} pub={pub} />)
              )}
            </>
          )}

          {tab === 'eventos' && (
            <>
              {cargando ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="card animate-pulse h-44" />
                  ))}
                </div>
              ) : eventos.length === 0 ? (
                <div className="card text-center py-12">
                  <p className="text-4xl mb-3">📍</p>
                  <p className="text-gray-400">No hay eventos abiertos ahora. Crea uno.</p>
                  <Link to="/eventos/crear" className="btn-green mt-4 inline-block">Crear evento</Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {eventos.map(ev => <TarjetaEvento key={ev.id} evento={ev} />)}
                </div>
              )}
              <div className="text-center">
                <Link to="/eventos" className="btn-ghost text-sm">Ver todos los eventos</Link>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
