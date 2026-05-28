const pool         = require('../config/database');
const { darXP }    = require('../services/xp.service');
const asyncHandler = require('../middleware/asyncHandler');

const TAGS_POSITIVOS = ['buen_companero','tecnico','puntual','goleador','rapido','lider'];
const TAGS_NEGATIVOS = ['agresivo','no_se_presento','tramposo'];

// GET /api/calificaciones/pendientes
const pendientes = asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT cp.evento_id, e.titulo, e.fecha_evento, cp.vence_en
     FROM calificaciones_pendientes cp
     JOIN eventos e ON e.id = cp.evento_id
     WHERE cp.usuario_id = $1 AND cp.vence_en > NOW()
     ORDER BY cp.vence_en ASC`,
    [req.usuario.id]
  );
  res.json(rows);
});

// GET /api/calificaciones/evento/:eventoId/jugadores
const jugadoresACalificar = asyncHandler(async (req, res) => {
  const { eventoId } = req.params;
  const { rows } = await pool.query(
    `SELECT u.id, u.username, u.nombre, u.foto_url, u.nivel_xp,
            c.estrellas, c.tags_positivos, c.tags_negativos
     FROM evento_participantes ep
     JOIN usuarios u ON u.id = ep.usuario_id
     LEFT JOIN calificaciones c
       ON c.evento_id = ep.evento_id
       AND c.calificador_id = $2
       AND c.calificado_id  = u.id
     WHERE ep.evento_id = $1
       AND ep.usuario_id != $2
       AND ep.estado     = 'asistio'
     ORDER BY u.nombre`,
    [eventoId, req.usuario.id]
  );
  res.json(rows);
});

// POST /api/calificaciones
const calificar = asyncHandler(async (req, res) => {
  const { evento_id, calificaciones } = req.body;
  const { rows: [participo] } = await pool.query(
    'SELECT 1 FROM evento_participantes WHERE evento_id = $1 AND usuario_id = $2',
    [evento_id, req.usuario.id]
  );
  if (!participo) return res.status(403).json({ error: 'No participaste en este evento' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const cal of calificaciones) {
      const { usuario_id, estrellas, tags_positivos = [], tags_negativos = [], goles = 0, asistencias = 0, amarillas = 0, rojas = 0 } = cal;

      if (!estrellas || estrellas < 1 || estrellas > 5) continue;

      await client.query(
        `INSERT INTO calificaciones
          (evento_id, calificador_id, calificado_id, estrellas, tags_positivos, tags_negativos)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (evento_id, calificador_id, calificado_id) DO UPDATE
           SET estrellas      = EXCLUDED.estrellas,
               tags_positivos = EXCLUDED.tags_positivos,
               tags_negativos = EXCLUDED.tags_negativos`,
        [evento_id, req.usuario.id, usuario_id,
         estrellas,
         tags_positivos.filter(t => TAGS_POSITIVOS.includes(t)),
         tags_negativos.filter(t => TAGS_NEGATIVOS.includes(t))]
      );

      await client.query(
        `INSERT INTO jugador_stats (evento_id, usuario_id, goles, asistencias, tarjetas_amarillas, tarjetas_rojas)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (evento_id, usuario_id) DO UPDATE
           SET goles              = jugador_stats.goles + EXCLUDED.goles,
               asistencias        = jugador_stats.asistencias + EXCLUDED.asistencias,
               tarjetas_amarillas = EXCLUDED.tarjetas_amarillas,
               tarjetas_rojas     = EXCLUDED.tarjetas_rojas`,
        [evento_id, usuario_id, goles, asistencias, amarillas, rojas]
      );

      await client.query(
        `UPDATE usuarios SET
           goles_totales       = goles_totales + $1,
           asistencias_totales = asistencias_totales + $2,
           tarjetas_amarillas  = tarjetas_amarillas + $3,
           tarjetas_rojas      = tarjetas_rojas + $4
         WHERE id = $5`,
        [goles, asistencias, amarillas, rojas, usuario_id]
      );

      if (estrellas >= 4) {
        await darXP(usuario_id, 'buena_calificacion', evento_id);
      }
    }

    await darXP(req.usuario.id, 'calificar_jugadores', evento_id);

    await client.query(
      'DELETE FROM calificaciones_pendientes WHERE evento_id = $1 AND usuario_id = $2',
      [evento_id, req.usuario.id]
    );

    await client.query('COMMIT');
    res.json({ mensaje: 'Calificaciones guardadas correctamente' });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

module.exports = { pendientes, jugadoresACalificar, calificar };
