const pool          = require('../config/database');
const asyncHandler  = require('../middleware/asyncHandler');
const { notificar } = require('../services/notificaciones.service');

// ── helpers ──────────────────────────────────────────────────────────────────

function getRondaLabel(n) {
  if (n === 1) return 'Final';
  if (n === 2) return 'Semifinal';
  if (n <= 4)  return 'Cuartos de Final';
  if (n <= 8)  return 'Octavos de Final';
  return 'Ronda';
}

async function esOrganizador(torneo_id, usuario_id) {
  const { rows } = await pool.query('SELECT organizador_id FROM torneos WHERE id=$1', [torneo_id]);
  return rows.length > 0 && rows[0].organizador_id === usuario_id;
}

async function notificarEquipo(equipo_id, tipo, mensaje, ref) {
  const { rows } = await pool.query('SELECT usuario_id FROM equipo_miembros WHERE equipo_id=$1', [equipo_id]);
  for (const { usuario_id } of rows) await notificar(usuario_id, tipo, mensaje, ref);
}

async function otorgarMedalla(client, usuario_id, torneo_id, tipo, xp, msg) {
  await client.query(
    'INSERT INTO torneo_medallas (usuario_id, torneo_id, tipo) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING',
    [usuario_id, torneo_id, tipo]
  );
  await client.query('UPDATE usuarios SET xp = xp + $1 WHERE id=$2', [xp, usuario_id]);
  await client.query(
    'INSERT INTO xp_log (usuario_id, cantidad, motivo, referencia_id) VALUES ($1,$2,$3,$4)',
    [usuario_id, xp, 'torneo_' + tipo, torneo_id]
  );
  await notificar(usuario_id, 'torneo', msg, torneo_id);
}

// GET /api/torneos
const listarTorneos = asyncHandler(async (req, res) => {
  const { deporte, ciudad, estado } = req.query;
  let query = `
    SELECT t.*,
      u.username AS organizador_username, u.nombre AS organizador_nombre, u.foto_url AS organizador_foto,
      (SELECT COUNT(*) FROM torneo_equipos WHERE torneo_id = t.id AND estado='confirmado') AS equipos_inscritos,
      (SELECT eq.nombre FROM torneo_equipos te JOIN equipos eq ON te.equipo_id = eq.id WHERE te.torneo_id = t.id AND te.estado='campeon' LIMIT 1) AS campeon_nombre,
      (SELECT eq.escudo_url FROM torneo_equipos te JOIN equipos eq ON te.equipo_id = eq.id WHERE te.torneo_id = t.id AND te.estado='campeon' LIMIT 1) AS campeon_escudo
    FROM torneos t JOIN usuarios u ON t.organizador_id = u.id
    WHERE t.estado != 'pendiente'
  `;
  const params = [];
  let idx = 1;
  if (estado)  { query += ` AND t.estado = $${idx++}`;           params.push(estado); }
  if (deporte) { query += ` AND LOWER(t.deporte) = $${idx++}`;   params.push(deporte.toLowerCase()); }
  if (ciudad)  { query += ` AND LOWER(t.ciudad) LIKE $${idx++}`; params.push('%' + ciudad.toLowerCase() + '%'); }
  query += ' ORDER BY t.fecha_inicio ASC LIMIT 30';
  const { rows } = await pool.query(query, params);
  res.json(rows);
});

// GET /api/torneos/:id
const obtenerTorneo = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows } = await pool.query(
    `SELECT t.*, u.username AS organizador_username, u.nombre AS organizador_nombre, u.foto_url AS organizador_foto
     FROM torneos t JOIN usuarios u ON t.organizador_id = u.id WHERE t.id = $1`,
    [id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Torneo no encontrado' });

  const [eqRes, pRes, prRes] = await Promise.all([
    pool.query(
      `SELECT eq.*, te.estado AS estado_inscripcion, te.fecha AS fecha_inscripcion
       FROM torneo_equipos te JOIN equipos eq ON te.equipo_id = eq.id
       WHERE te.torneo_id=$1 ORDER BY te.fecha ASC`, [id]
    ),
    pool.query(
      `SELECT p.*,
        el.nombre AS equipo_local_nombre, el.escudo_url AS equipo_local_escudo,
        ev.nombre AS equipo_visita_nombre, ev.escudo_url AS equipo_visita_escudo
       FROM partidos p
       JOIN equipos el ON p.equipo_local_id  = el.id
       JOIN equipos ev ON p.equipo_visita_id = ev.id
       WHERE p.torneo_id=$1 ORDER BY p.numero_ronda ASC NULLS FIRST, p.fecha ASC`, [id]
    ),
    pool.query('SELECT puesto, descripcion FROM torneo_premios WHERE torneo_id=$1 ORDER BY puesto ASC', [id]),
  ]);

  res.json({ ...rows[0], equipos: eqRes.rows, partidos: pRes.rows, premios: prRes.rows });
});

// POST /api/torneos
const crearTorneo = asyncHandler(async (req, res) => {
  const { nombre, descripcion, deporte, ciudad, latitud, longitud,
          fecha_inicio, fecha_fin, max_equipos, premio, precio_inscripcion, formato, foto_url } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO torneos (organizador_id, nombre, descripcion, deporte, foto_url, ciudad,
      latitud, longitud, fecha_inicio, fecha_fin, max_equipos, premio, precio_inscripcion, formato)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
    [req.usuario.id, nombre, descripcion, deporte, foto_url || null, ciudad,
     latitud, longitud, fecha_inicio, fecha_fin, max_equipos || 8,
     premio, precio_inscripcion || 0, formato || 'eliminacion']
  );
  res.status(201).json({ ...rows[0], mensaje: 'Torneo enviado para aprobación' });
});

// POST /api/torneos/:id/postular
const postularEquipo = asyncHandler(async (req, res) => {
  const { id: torneo_id } = req.params;
  const { equipo_id } = req.body;
  if (!equipo_id) return res.status(400).json({ error: 'equipo_id requerido' });

  const { rows: [torneo] } = await pool.query('SELECT * FROM torneos WHERE id=$1', [torneo_id]);
  if (!torneo) return res.status(404).json({ error: 'Torneo no encontrado' });
  if (torneo.estado !== 'aprobado') return res.status(400).json({ error: 'El torneo no admite postulaciones' });

  const { rows: cap } = await pool.query('SELECT 1 FROM equipos WHERE id=$1 AND capitan_id=$2', [equipo_id, req.usuario.id]);
  if (!cap.length) return res.status(403).json({ error: 'Solo el capitán puede postular el equipo' });

  const { rows: ya } = await pool.query('SELECT estado FROM torneo_equipos WHERE torneo_id=$1 AND equipo_id=$2', [torneo_id, equipo_id]);
  if (ya.length) return res.status(409).json({ error: 'Tu equipo ya está ' + ya[0].estado + ' en este torneo' });

  const { rows: cnt } = await pool.query(
    `SELECT COUNT(*) FROM torneo_equipos WHERE torneo_id=$1 AND estado NOT IN ('rechazado','eliminado')`, [torneo_id]
  );
  if (parseInt(cnt[0].count) >= torneo.max_equipos) return res.status(400).json({ error: 'El torneo está lleno' });

  await pool.query(`INSERT INTO torneo_equipos (torneo_id, equipo_id, estado) VALUES ($1,$2,'postulante')`, [torneo_id, equipo_id]);
  await notificar(torneo.organizador_id, 'torneo',
    'Equipo postulado a tu torneo "' + torneo.nombre + '". Revisa tu panel.', torneo_id);

  res.status(201).json({ mensaje: 'Postulación enviada. Espera la aprobación del organizador.' });
});

// DELETE /api/torneos/:id/inscribir
const desinscribirEquipo = asyncHandler(async (req, res) => {
  const { id: torneo_id } = req.params;
  const { equipo_id } = req.body;
  if (!equipo_id) return res.status(400).json({ error: 'equipo_id requerido' });
  const { rows: cap } = await pool.query('SELECT 1 FROM equipos WHERE id=$1 AND capitan_id=$2', [equipo_id, req.usuario.id]);
  if (!cap.length) return res.status(403).json({ error: 'Solo el capitán puede retirar el equipo' });
  const { rows: [t] } = await pool.query('SELECT estado FROM torneos WHERE id=$1', [torneo_id]);
  if (t?.estado === 'activo') return res.status(400).json({ error: 'No puedes retirarte de un torneo activo' });
  await pool.query('DELETE FROM torneo_equipos WHERE torneo_id=$1 AND equipo_id=$2', [torneo_id, equipo_id]);
  res.json({ mensaje: 'Equipo retirado del torneo' });
});

// PUT /api/torneos/:id/equipos/:equipoId/aceptar
const aceptarEquipo = asyncHandler(async (req, res) => {
  const { id: torneo_id, equipoId: equipo_id } = req.params;
  if (!await esOrganizador(torneo_id, req.usuario.id)) return res.status(403).json({ error: 'No autorizado' });
  await pool.query(`UPDATE torneo_equipos SET estado='confirmado' WHERE torneo_id=$1 AND equipo_id=$2`, [torneo_id, equipo_id]);
  const [{ rows: [t] }, { rows: [eq] }] = await Promise.all([
    pool.query('SELECT nombre FROM torneos WHERE id=$1', [torneo_id]),
    pool.query('SELECT capitan_id, nombre FROM equipos WHERE id=$1', [equipo_id]),
  ]);
  if (eq?.capitan_id) await notificar(eq.capitan_id, 'torneo', 'Tu equipo "' + eq.nombre + '" fue aceptado en "' + t?.nombre + '". Prepárense!', torneo_id);
  res.json({ mensaje: 'Equipo aceptado' });
});

// PUT /api/torneos/:id/equipos/:equipoId/rechazar
const rechazarEquipo = asyncHandler(async (req, res) => {
  const { id: torneo_id, equipoId: equipo_id } = req.params;
  if (!await esOrganizador(torneo_id, req.usuario.id)) return res.status(403).json({ error: 'No autorizado' });
  await pool.query(`UPDATE torneo_equipos SET estado='rechazado' WHERE torneo_id=$1 AND equipo_id=$2`, [torneo_id, equipo_id]);
  const [{ rows: [t] }, { rows: [eq] }] = await Promise.all([
    pool.query('SELECT nombre FROM torneos WHERE id=$1', [torneo_id]),
    pool.query('SELECT capitan_id, nombre FROM equipos WHERE id=$1', [equipo_id]),
  ]);
  if (eq?.capitan_id) await notificar(eq.capitan_id, 'torneo', 'Tu equipo "' + eq.nombre + '" no fue aceptado en "' + t?.nombre + '".', torneo_id);
  res.json({ mensaje: 'Equipo rechazado' });
});

// PUT /api/torneos/:id/premios
const configurarPremios = asyncHandler(async (req, res) => {
  const { id: torneo_id } = req.params;
  const { premios } = req.body;
  if (!await esOrganizador(torneo_id, req.usuario.id)) return res.status(403).json({ error: 'No autorizado' });
  if (!Array.isArray(premios)) return res.status(400).json({ error: 'premios debe ser un array' });
  await pool.query('DELETE FROM torneo_premios WHERE torneo_id=$1', [torneo_id]);
  for (const { puesto, descripcion } of premios) {
    if (puesto && descripcion) {
      await pool.query('INSERT INTO torneo_premios (torneo_id, puesto, descripcion) VALUES ($1,$2,$3)', [torneo_id, puesto, descripcion]);
    }
  }
  res.json({ mensaje: 'Premios configurados' });
});

// PUT /api/torneos/:id/iniciar
const iniciarTorneo = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows: [torneo] } = await pool.query('SELECT * FROM torneos WHERE id=$1', [id]);
  if (!torneo) return res.status(404).json({ error: 'Torneo no encontrado' });
  if (torneo.organizador_id !== req.usuario.id) return res.status(403).json({ error: 'No autorizado' });
  if (torneo.estado !== 'aprobado') return res.status(400).json({ error: 'El torneo debe estar aprobado' });

  const { rows: confirmados } = await pool.query(
    `SELECT equipo_id FROM torneo_equipos WHERE torneo_id=$1 AND estado='confirmado'`, [id]
  );
  if (confirmados.length < 2) return res.status(400).json({ error: 'Necesitas al menos 2 equipos confirmados' });

  const equipos = confirmados.map(r => r.equipo_id);
  const fechaBase = new Date(torneo.fecha_inicio);
  fechaBase.setUTCHours(12, 0, 0, 0);
  const STEP = 100;
  const partidos = [];

  if (torneo.formato === 'eliminacion') {
    const s = [...equipos].sort(() => Math.random() - 0.5);
    const n = Math.floor(s.length / 2);
    const label = getRondaLabel(n);
    for (let i = 0; i < n; i++) {
      partidos.push({ local: s[i*2], visita: s[i*2+1], ronda: label, nr: 1, fecha: new Date(fechaBase.getTime() + i*STEP*60000) });
    }
  } else {
    const label = torneo.formato === 'grupos' ? 'Fase de Grupos' : 'Jornada';
    let k = 0;
    for (let i = 0; i < equipos.length; i++) {
      for (let j = i+1; j < equipos.length; j++) {
        partidos.push({ local: equipos[i], visita: equipos[j], ronda: label, nr: 1, fecha: new Date(fechaBase.getTime() + k++*STEP*60000) });
      }
    }
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const p of partidos) {
      await client.query(
        `INSERT INTO partidos (torneo_id, equipo_local_id, equipo_visita_id, ronda, numero_ronda, fecha) VALUES ($1,$2,$3,$4,$5,$6)`,
        [id, p.local, p.visita, p.ronda, p.nr, p.fecha]
      );
    }
    await client.query(`UPDATE torneos SET estado='activo' WHERE id=$1`, [id]);
    const { rows: miembros } = await client.query(
      `SELECT DISTINCT em.usuario_id FROM equipo_miembros em JOIN torneo_equipos te ON te.equipo_id=em.equipo_id WHERE te.torneo_id=$1 AND te.estado='confirmado'`, [id]
    );
    for (const { usuario_id } of miembros) {
      await notificar(usuario_id, 'torneo', 'El torneo "' + torneo.nombre + '" comenzó! Revisa tu fixture.', id);
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  res.json({ mensaje: 'Torneo iniciado. Fixture generado.', partidos_generados: partidos.length });
});

// PUT /api/torneos/:id/partidos/:partidoId/resultado
const registrarResultado = asyncHandler(async (req, res) => {
  const { id: torneo_id, partidoId } = req.params;
  const { goles_local, goles_visita } = req.body;
  if (goles_local === undefined || goles_visita === undefined) return res.status(400).json({ error: 'goles_local y goles_visita son requeridos' });
  if (!await esOrganizador(torneo_id, req.usuario.id)) return res.status(403).json({ error: 'No autorizado' });

  const { rows: [partido] } = await pool.query(
    `SELECT p.*, t.nombre AS torneo_nombre, t.formato FROM partidos p JOIN torneos t ON t.id=p.torneo_id WHERE p.id=$1 AND p.torneo_id=$2`,
    [partidoId, torneo_id]
  );
  if (!partido) return res.status(404).json({ error: 'Partido no encontrado' });
  if (partido.estado === 'finalizado') return res.status(400).json({ error: 'Partido ya finalizado' });

  const gl = parseInt(goles_local);
  const gv = parseInt(goles_visita);
  const ganador_id = gl > gv ? partido.equipo_local_id : gv > gl ? partido.equipo_visita_id : partido.equipo_local_id;
  const perdedor_id = ganador_id === partido.equipo_local_id ? partido.equipo_visita_id : partido.equipo_local_id;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`UPDATE partidos SET goles_local=$1, goles_visita=$2, estado='finalizado' WHERE id=$3`, [gl, gv, partidoId]);

    const [{ rows: [eL] }, { rows: [eV] }] = await Promise.all([
      client.query('SELECT nombre FROM equipos WHERE id=$1', [partido.equipo_local_id]),
      client.query('SELECT nombre FROM equipos WHERE id=$1', [partido.equipo_visita_id]),
    ]);
    const resMsg = 'Resultado: ' + eL?.nombre + ' ' + gl + ' - ' + gv + ' ' + eV?.nombre + ' (' + partido.torneo_nombre + ')';
    await notificarEquipo(partido.equipo_local_id, 'torneo', resMsg, torneo_id);
    await notificarEquipo(partido.equipo_visita_id, 'torneo', resMsg, torneo_id);

    const { rows: pendRonda } = await client.query(
      `SELECT id FROM partidos WHERE torneo_id=$1 AND numero_ronda=$2 AND estado!='finalizado' AND id!=$3`,
      [torneo_id, partido.numero_ronda, partidoId]
    );

    if (pendRonda.length === 0 && partido.formato === 'eliminacion') {
      const { rows: rondasRows } = await client.query(
        `SELECT equipo_local_id, equipo_visita_id, goles_local, goles_visita FROM partidos WHERE torneo_id=$1 AND numero_ronda=$2`,
        [torneo_id, partido.numero_ronda]
      );
      const ganadores = rondasRows.map(p => (p.goles_local >= p.goles_visita) ? p.equipo_local_id : p.equipo_visita_id);

      if (ganadores.length === 1) {
        const campeon_id = ganadores[0];
        const { rows: campM } = await client.query('SELECT usuario_id FROM equipo_miembros WHERE equipo_id=$1', [campeon_id]);
        for (const { usuario_id } of campM) {
          await otorgarMedalla(client, usuario_id, torneo_id, 'campeon', 100, 'Campeon del torneo "' + partido.torneo_nombre + '"! +100 XP');
        }
        const { rows: subM } = await client.query('SELECT usuario_id FROM equipo_miembros WHERE equipo_id=$1', [perdedor_id]);
        for (const { usuario_id } of subM) {
          await otorgarMedalla(client, usuario_id, torneo_id, 'subcampeon', 50, 'Subcampeon del torneo "' + partido.torneo_nombre + '". +50 XP');
        }
        const { rows: todos } = await client.query(`SELECT equipo_id FROM torneo_equipos WHERE torneo_id=$1 AND estado='confirmado'`, [torneo_id]);
        for (const { equipo_id } of todos) {
          if (equipo_id === campeon_id || equipo_id === perdedor_id) continue;
          const { rows: members } = await client.query('SELECT usuario_id FROM equipo_miembros WHERE equipo_id=$1', [equipo_id]);
          for (const { usuario_id } of members) {
            await otorgarMedalla(client, usuario_id, torneo_id, 'participante', 10, 'Participaste en el torneo "' + partido.torneo_nombre + '". +10 XP');
          }
        }
        await client.query(`UPDATE torneo_equipos SET estado='campeon' WHERE torneo_id=$1 AND equipo_id=$2`, [torneo_id, campeon_id]);
        await client.query(`UPDATE torneos SET estado='finalizado' WHERE id=$1`, [torneo_id]);

      } else if (ganadores.length > 1) {
        const sig = partido.numero_ronda + 1;
        const nSig = Math.floor(ganadores.length / 2);
        const label = getRondaLabel(nSig);
        const fSig = new Date(); fSig.setDate(fSig.getDate() + 1); fSig.setUTCHours(12, 0, 0, 0);
        for (let i = 0; i < nSig; i++) {
          await client.query(
            `INSERT INTO partidos (torneo_id, equipo_local_id, equipo_visita_id, ronda, numero_ronda, fecha) VALUES ($1,$2,$3,$4,$5,$6)`,
            [torneo_id, ganadores[i*2], ganadores[i*2+1], label, sig, new Date(fSig.getTime() + i*100*60000)]
          );
        }
        const { rows: miembros } = await client.query(
          `SELECT DISTINCT em.usuario_id FROM equipo_miembros em WHERE em.equipo_id = ANY($1::uuid[])`, [ganadores]
        );
        for (const { usuario_id } of miembros) {
          await notificar(usuario_id, 'torneo', 'Avanzaste en "' + partido.torneo_nombre + '"! Hay un nuevo partido programado.', torneo_id);
        }
      }
    }

    if (partido.formato !== 'eliminacion') {
      const { rows: pendTot } = await client.query(`SELECT id FROM partidos WHERE torneo_id=$1 AND estado!='finalizado'`, [torneo_id]);
      if (pendTot.length === 0) {
        await client.query(`UPDATE torneos SET estado='finalizado' WHERE id=$1`, [torneo_id]);
        const { rows: todos } = await client.query(`SELECT equipo_id FROM torneo_equipos WHERE torneo_id=$1 AND estado='confirmado'`, [torneo_id]);
        for (const { equipo_id } of todos) {
          const { rows: members } = await client.query('SELECT usuario_id FROM equipo_miembros WHERE equipo_id=$1', [equipo_id]);
          for (const { usuario_id } of members) {
            await otorgarMedalla(client, usuario_id, torneo_id, 'participante', 10, 'Participaste en el torneo "' + partido.torneo_nombre + '". +10 XP');
          }
        }
      }
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
  res.json({ mensaje: 'Resultado registrado' });
});

// GET /api/torneos/usuario/:id/medallas
const medallasTorneos = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows } = await pool.query(
    `SELECT tm.tipo, tm.desbloqueada_en, t.id AS torneo_id, t.nombre AS torneo_nombre, t.deporte, t.fecha_inicio
     FROM torneo_medallas tm JOIN torneos t ON t.id=tm.torneo_id
     WHERE tm.usuario_id=$1 ORDER BY tm.desbloqueada_en DESC`,
    [id]
  );
  res.json(rows);
});

module.exports = {
  listarTorneos, obtenerTorneo, crearTorneo,
  postularEquipo, desinscribirEquipo,
  aceptarEquipo, rechazarEquipo,
  configurarPremios, iniciarTorneo,
  registrarResultado, medallasTorneos,
};
