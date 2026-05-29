const pool          = require('../config/database');
const { darXP }     = require('../services/xp.service');
const { notificar } = require('../services/notificaciones.service');
const asyncHandler  = require('../middleware/asyncHandler');
const crypto        = require('crypto');

function generarCodigoInvitacion() {
  return crypto.randomBytes(5).toString('hex').toUpperCase();
}

function generarLinkWhatsApp(evento) {
  const url   = `https://streetplayer.pe/eventos/${evento.id}`;
  const texto = `⚽ ¡Te invito a jugar!\n🏟️ ${evento.titulo}\n📍 ${evento.nombre_cancha || evento.direccion || ''}\n📅 ${new Date(evento.fecha_evento).toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}\n👥 ${evento.formato}vs${evento.formato}\n🔗 ${url}\n\nStreetPlayer — Juega. Rankea. Domina.`;
  return `https://wa.me/?text=${encodeURIComponent(texto)}`;
}

// GET /api/eventos
const listarEventos = asyncHandler(async (req, res) => {
  const { tipo, deporte, lat, lng, radio = 20, estado = 'abierto', page = 1 } = req.query;
  const limit  = 20;
  const offset = (page - 1) * limit;
  const params = [];
  let idx = 1;

  let query = `
    SELECT e.*,
      u.username AS creador_username, u.nombre AS creador_nombre, u.foto_url AS creador_foto,
      (SELECT COUNT(*) FROM evento_participantes WHERE evento_id = e.id AND estado = 'confirmado') AS inscritos,
      EXISTS(SELECT 1 FROM evento_participantes WHERE evento_id = e.id AND usuario_id = $${idx++}) AS yo_inscrito
    FROM eventos e
    JOIN usuarios u ON e.creador_id = u.id
    WHERE e.es_privado = false
  `;
  params.push(req.usuario?.id ?? null);

  if (estado)  { query += ` AND e.estado = $${idx++}`;                params.push(estado); }
  if (tipo)    { query += ` AND e.tipo = $${idx++}`;                   params.push(tipo); }
  if (deporte) { query += ` AND LOWER(e.deporte) = $${idx++}`;         params.push(deporte.toLowerCase()); }

  if (lat && lng) {
    query += ` AND (
      6371 * acos(LEAST(1, cos(radians($${idx})) * cos(radians(e.latitud)) *
        cos(radians(e.longitud) - radians($${idx + 1})) +
        sin(radians($${idx})) * sin(radians(e.latitud))))
    ) <= $${idx + 2}`;
    params.push(parseFloat(lat), parseFloat(lng), parseFloat(radio));
    idx += 3;
  }

  query += ` AND e.fecha_evento >= NOW()`;
  query += ` ORDER BY e.fecha_evento ASC LIMIT $${idx++} OFFSET $${idx++}`;
  params.push(limit, offset);

  const { rows } = await pool.query(query, params);
  res.json(rows);
});

// GET /api/eventos/:id
const obtenerEvento = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows } = await pool.query(
    `SELECT e.*,
       u.username AS creador_username, u.nombre AS creador_nombre, u.foto_url AS creador_foto,
       EXISTS(SELECT 1 FROM evento_participantes WHERE evento_id = e.id AND usuario_id = $2) AS yo_inscrito
     FROM eventos e JOIN usuarios u ON e.creador_id = u.id
     WHERE e.id = $1`,
    [id, req.usuario?.id ?? null]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Evento no encontrado' });

  const { rows: participantes } = await pool.query(
    `SELECT u.id, u.username, u.nombre, u.foto_url, u.nivel_xp, ep.equipo, ep.estado
     FROM evento_participantes ep JOIN usuarios u ON ep.usuario_id = u.id
     WHERE ep.evento_id = $1 AND ep.estado IN ('confirmado','asistio')
     ORDER BY ep.fecha ASC`,
    [id]
  );

  res.json({ ...rows[0], participantes });
});

// POST /api/eventos
const crearEvento = asyncHandler(async (req, res) => {
  const {
    titulo, tipo = 'pichanga', descripcion, deporte = 'futbol', nivel = 'todos',
    nombre_cancha, direccion, latitud, longitud,
    fecha_evento, duracion_min = 90, formato = 5, cupos_total = 10,
    precio = 0, es_privado = false, foto_url,
  } = req.body;

  const codigo_invitacion = es_privado ? generarCodigoInvitacion() : null;

  const { rows } = await pool.query(
    `INSERT INTO eventos
       (creador_id, titulo, tipo, descripcion, deporte, nivel, foto_url,
        nombre_cancha, direccion, latitud, longitud, fecha_evento, duracion_min,
        formato, cupos_total, precio, es_privado, codigo_invitacion)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
     RETURNING *`,
    [req.usuario.id, titulo, tipo, descripcion, deporte, nivel, foto_url ?? null,
     nombre_cancha, direccion, latitud, longitud, fecha_evento, duracion_min,
     formato, cupos_total, precio, es_privado, codigo_invitacion]
  );

  const evento    = rows[0];
  const whatsapp  = generarLinkWhatsApp(evento);
  await pool.query('UPDATE eventos SET link_whatsapp = $1 WHERE id = $2', [whatsapp, evento.id]);

  await pool.query(
    'INSERT INTO evento_participantes (evento_id, usuario_id, equipo) VALUES ($1,$2,$3)',
    [evento.id, req.usuario.id, 'A']
  );
  await pool.query('UPDATE eventos SET cupos_ocupados = 1 WHERE id = $1', [evento.id]);
  await darXP(req.usuario.id, 'crear_evento', evento.id);

  // Notificar a usuarios cercanos (radio 10 km) que tengan ubicación guardada
  if (latitud && longitud) {
    const { rows: cercanos } = await pool.query(
      `SELECT id FROM usuarios
       WHERE latitud IS NOT NULL AND longitud IS NOT NULL AND id != $1
         AND 6371 * acos(LEAST(1,
           cos(radians($2)) * cos(radians(latitud)) *
           cos(radians(longitud) - radians($3)) +
           sin(radians($2)) * sin(radians(latitud))
         )) <= 10`,
      [req.usuario.id, parseFloat(latitud), parseFloat(longitud)]
    );
    const lugar = evento.nombre_cancha || evento.direccion || 'una cancha cerca de ti';
    await Promise.all(
      cercanos.map(u => notificar(u.id, 'evento',
        `Nuevo evento cerca de ti: "${evento.titulo}" en ${lugar}`, evento.id))
    );
  }

  res.status(201).json({ ...evento, link_whatsapp: whatsapp });
});

// POST /api/eventos/:id/unirse
const unirseEvento = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { equipo = 'A', codigo } = req.body;

  const { rows: [evento] } = await pool.query('SELECT * FROM eventos WHERE id = $1', [id]);
  if (!evento)                     return res.status(404).json({ error: 'Evento no encontrado' });
  if (evento.estado !== 'abierto') return res.status(400).json({ error: 'El evento no está disponible' });
  if (evento.cupos_ocupados >= evento.cupos_total) return res.status(400).json({ error: 'El evento está lleno' });
  if (evento.es_privado && evento.codigo_invitacion !== codigo) {
    return res.status(403).json({ error: 'Código de invitación incorrecto' });
  }

  const { rows: [yaInscrito] } = await pool.query(
    'SELECT 1 FROM evento_participantes WHERE evento_id = $1 AND usuario_id = $2',
    [id, req.usuario.id]
  );
  if (yaInscrito) return res.status(400).json({ error: 'Ya estás inscrito en este evento' });

  await pool.query(
    'INSERT INTO evento_participantes (evento_id, usuario_id, equipo) VALUES ($1,$2,$3)',
    [id, req.usuario.id, equipo]
  );
  await pool.query('UPDATE eventos SET cupos_ocupados = cupos_ocupados + 1 WHERE id = $1', [id]);

  if (evento.cupos_ocupados + 1 >= evento.cupos_total) {
    await pool.query("UPDATE eventos SET estado = 'lleno' WHERE id = $1", [id]);
  }

  if (evento.creador_id !== req.usuario.id) {
    await notificar(evento.creador_id, 'evento', `${req.usuario.username} se unió a "${evento.titulo}"`, id);
  }

  res.json({ mensaje: 'Te uniste al evento correctamente', link_whatsapp: evento.link_whatsapp });
});

// DELETE /api/eventos/:id/salir
const salirEvento = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows: [ev] } = await pool.query('SELECT estado FROM eventos WHERE id = $1', [id]);
  if (ev?.estado === 'confirmado') {
    return res.status(400).json({ error: 'El evento ya fue confirmado. No puedes salir.' });
  }
  const { rows } = await pool.query(
    'DELETE FROM evento_participantes WHERE evento_id = $1 AND usuario_id = $2 RETURNING *',
    [id, req.usuario.id]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'No estás inscrito en este evento' });
  await pool.query(
    `UPDATE eventos SET
       cupos_ocupados = GREATEST(0, cupos_ocupados - 1),
       estado = CASE WHEN estado = 'lleno' THEN 'abierto' ELSE estado END
     WHERE id = $1`,
    [id]
  );
  res.json({ mensaje: 'Saliste del evento' });
});

// PUT /api/eventos/:id/confirmar — el creador confirma el partido (bloquea salidas)
const confirmarEvento = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows: [ev] } = await pool.query('SELECT * FROM eventos WHERE id = $1', [id]);
  if (!ev) return res.status(404).json({ error: 'Evento no encontrado' });
  if (ev.creador_id !== req.usuario.id) return res.status(403).json({ error: 'Solo el creador puede confirmar el evento' });
  if (!['abierto', 'lleno'].includes(ev.estado)) return res.status(400).json({ error: 'El evento no puede confirmarse en este estado' });

  await pool.query("UPDATE eventos SET estado = 'confirmado' WHERE id = $1", [id]);

  // Notificar a todos los participantes
  const { rows: participantes } = await pool.query(
    "SELECT usuario_id FROM evento_participantes WHERE evento_id = $1",
    [id]
  );
  await Promise.all(
    participantes.map(p =>
      notificar(p.usuario_id, 'evento',
        `⚽ "${ev.titulo}" ha sido confirmado. ¡Prepárate para jugar!`, id)
    )
  );

  res.json({ mensaje: 'Evento confirmado. Los participantes fueron notificados.' });
});

// POST /api/eventos/:id/finalizar
const finalizarEvento = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { goles_a = 0, goles_b = 0, asistentes = [] } = req.body;

  const { rows: [evento] } = await pool.query('SELECT * FROM eventos WHERE id = $1', [id]);
  if (!evento) return res.status(404).json({ error: 'Evento no encontrado' });
  if (evento.creador_id !== req.usuario.id) return res.status(403).json({ error: 'Solo el creador puede finalizar el evento' });

  const resultado = goles_a > goles_b ? 'equipo_a' : goles_b > goles_a ? 'equipo_b' : 'empate';

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `INSERT INTO resultados (evento_id, goles_equipo_a, goles_equipo_b, resultado, registrado_por)
       VALUES ($1,$2,$3,$4,$5) ON CONFLICT (evento_id) DO UPDATE
         SET goles_equipo_a = EXCLUDED.goles_equipo_a,
             goles_equipo_b = EXCLUDED.goles_equipo_b,
             resultado      = EXCLUDED.resultado`,
      [id, goles_a, goles_b, resultado, req.usuario.id]
    );

    await client.query(
      "UPDATE evento_participantes SET estado = 'asistio' WHERE evento_id = $1 AND usuario_id = ANY($2::uuid[])",
      [id, asistentes]
    );
    await client.query(
      "UPDATE evento_participantes SET estado = 'ausente' WHERE evento_id = $1 AND usuario_id != ALL($2::uuid[])",
      [id, asistentes.length > 0 ? asistentes : [null]]
    );

    for (const uid of asistentes) {
      const equipoParticipante = (await client.query(
        'SELECT equipo FROM evento_participantes WHERE evento_id = $1 AND usuario_id = $2',
        [id, uid]
      )).rows[0]?.equipo;

      await darXP(uid, 'asistir_pichanga', id);

      const gano   = (equipoParticipante === 'A' && resultado === 'equipo_a') ||
                     (equipoParticipante === 'B' && resultado === 'equipo_b');
      const empato = resultado === 'empate';

      if (gano)   await darXP(uid, 'ganar_partido', id);
      if (empato) await darXP(uid, 'empatar', id);

      await client.query(
        `UPDATE usuarios SET
           partidos_jugados   = partidos_jugados + 1,
           partidos_ganados   = partidos_ganados   + $1,
           partidos_empatados = partidos_empatados + $2,
           partidos_perdidos  = partidos_perdidos  + $3
         WHERE id = $4`,
        [gano ? 1 : 0, empato ? 1 : 0, (!gano && !empato) ? 1 : 0, uid]
      );
    }

    const vence = new Date(Date.now() + 24 * 60 * 60 * 1000);
    for (const uid of asistentes) {
      await client.query(
        `INSERT INTO calificaciones_pendientes (evento_id, usuario_id, vence_en)
         VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`,
        [id, uid, vence]
      );
    }

    const { rows: ausentes } = await client.query(
      "SELECT usuario_id FROM evento_participantes WHERE evento_id = $1 AND estado = 'ausente'",
      [id]
    );
    for (const { usuario_id } of ausentes) {
      await darXP(usuario_id, 'no_asistir', id);
      await client.query(
        'INSERT INTO sanciones (usuario_id, evento_id, motivo, xp_penalidad) VALUES ($1,$2,$3,15)',
        [usuario_id, id, 'no_show']
      );
      await client.query(
        'UPDATE usuarios SET sanciones_activas = sanciones_activas + 1 WHERE id = $1',
        [usuario_id]
      );
    }

    await client.query("UPDATE eventos SET estado = 'finalizado' WHERE id = $1", [id]);
    await client.query('COMMIT');
    res.json({ mensaje: 'Evento finalizado. Los jugadores tienen 24h para calificar.' });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

// PUT /api/eventos/:id
const editarEvento = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { titulo, descripcion, fecha_evento, duracion_min, cupos_total } = req.body;

  const { rows: [evento] } = await pool.query('SELECT * FROM eventos WHERE id = $1', [id]);
  if (!evento) return res.status(404).json({ error: 'Evento no encontrado' });
  if (evento.creador_id !== req.usuario.id) return res.status(403).json({ error: 'Solo el creador puede editar el evento' });

  const { rows } = await pool.query(
    `UPDATE eventos SET
       titulo       = COALESCE($1, titulo),
       descripcion  = COALESCE($2, descripcion),
       fecha_evento = COALESCE($3, fecha_evento),
       duracion_min = COALESCE($4, duracion_min),
       cupos_total  = COALESCE($5, cupos_total)
     WHERE id = $6 RETURNING *`,
    [titulo, descripcion, fecha_evento, duracion_min, cupos_total, id]
  );
  res.json(rows[0]);
});

// PUT /api/eventos/:id/cancelar — el creador cancela el evento (solo si no está confirmado)
const cancelarEvento = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows: [ev] } = await pool.query('SELECT * FROM eventos WHERE id = $1', [id]);
  if (!ev) return res.status(404).json({ error: 'Evento no encontrado' });
  if (ev.creador_id !== req.usuario.id) return res.status(403).json({ error: 'Solo el creador puede cancelar el evento' });
  if (['confirmado', 'finalizado', 'cancelado'].includes(ev.estado)) {
    return res.status(400).json({ error: 'No se puede cancelar un evento en este estado' });
  }

  await pool.query("UPDATE eventos SET estado = 'cancelado' WHERE id = $1", [id]);

  const { rows: participantes } = await pool.query(
    'SELECT usuario_id FROM evento_participantes WHERE evento_id = $1',
    [id]
  );
  await Promise.all(
    participantes.map(p =>
      notificar(p.usuario_id, 'evento',
        `❌ El evento "${ev.titulo}" fue cancelado por el organizador.`, id)
    )
  );

  res.json({ mensaje: 'Evento cancelado' });
});

module.exports = { listarEventos, obtenerEvento, crearEvento, unirseEvento, salirEvento, finalizarEvento, editarEvento, confirmarEvento, cancelarEvento };
