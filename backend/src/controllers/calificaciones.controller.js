const pool = require('../config/database');
const { darXP } = require('../services/xp.service');

const TAGS_POSITIVOS = ['buen_companero','tecnico','puntual','goleador','rapido','lider'];
const TAGS_NEGATIVOS = ['agresivo','no_se_presento','tramposo'];

// GET /api/calificaciones/pendientes
async function pendientes(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT cp.evento_id, e.titulo, e.fecha_evento, cp.vence_en
       FROM calificaciones_pendientes cp
       JOIN eventos e ON e.id = cp.evento_id
       WHERE cp.usuario_id = $1 AND cp.vence_en > NOW()
       ORDER BY cp.vence_en ASC`,
      [req.usuario.id]
    );
    res.json(rows);
  } catch (err) { next(err); }
}

// GET /api/calificaciones/evento/:eventoId/jugadores
async function jugadoresACalificar(req, res, next) {
  try {
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
  } catch (err) { next(err); }
}

// POST /api/calificaciones
// Body: { evento_id, calificaciones: [{ usuario_id, estrellas, tags_positivos, tags_negativos, goles, asistencias, amarillas, rojas }] }
async function calificar(req, res, next) {
  try {
    const { evento_id, calificaciones } = req.body;
    if (!evento_id || !Array.isArray(calificaciones) || calificaciones.length === 0) {
      return res.status(400).json({ error: 'evento_id y calificaciones[] son requeridos' });
    }

    // Verificar que el usuario participó
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

        // Insertar calificación (ON CONFLICT = ya calificó)
        await client.query(
          `INSERT INTO calificaciones
            (evento_id, calificador_id, calificado_id, estrellas, tags_positivos, tags_negativos)
           VALUES ($1,$2,$3,$4,$5,$6)
           ON CONFLICT (evento_id, calificador_id, calificado_id) DO UPDATE
             SET estrellas = EXCLUDED.estrellas,
                 tags_positivos = EXCLUDED.tags_positivos,
                 tags_negativos = EXCLUDED.tags_negativos`,
          [evento_id, req.usuario.id, usuario_id,
           estrellas,
           tags_positivos.filter(t => TAGS_POSITIVOS.includes(t)),
           tags_negativos.filter(t => TAGS_NEGATIVOS.includes(t))]
        );

        // Guardar stats del partido
        await client.query(
          `INSERT INTO jugador_stats (evento_id, usuario_id, goles, asistencias, tarjetas_amarillas, tarjetas_rojas)
           VALUES ($1,$2,$3,$4,$5,$6)
           ON CONFLICT (evento_id, usuario_id) DO UPDATE
             SET goles = jugador_stats.goles + EXCLUDED.goles,
                 asistencias = jugador_stats.asistencias + EXCLUDED.asistencias,
                 tarjetas_amarillas = EXCLUDED.tarjetas_amarillas,
                 tarjetas_rojas = EXCLUDED.tarjetas_rojas`,
          [evento_id, usuario_id, goles, asistencias, amarillas, rojas]
        );

        // Actualizar stats globales del calificado
        await client.query(
          `UPDATE usuarios SET
             goles_totales       = goles_totales + $1,
             asistencias_totales = asistencias_totales + $2,
             tarjetas_amarillas  = tarjetas_amarillas + $3,
             tarjetas_rojas      = tarjetas_rojas + $4
           WHERE id = $5`,
          [goles, asistencias, amarillas, rojas, usuario_id]
        );

        // XP por recibir buena calificación
        if (estrellas >= 4) {
          await darXP(usuario_id, 'buena_calificacion', evento_id);
        }
      }

      // XP al calificador por calificar
      await darXP(req.usuario.id, 'calificar_jugadores', evento_id);

      // Eliminar de pendientes
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
  } catch (err) { next(err); }
}

module.exports = { pendientes, jugadoresACalificar, calificar };
