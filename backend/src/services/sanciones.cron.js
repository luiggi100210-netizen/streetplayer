const cron = require('node-cron');
const pool = require('../config/database');
const { darXP } = require('./xp.service');

// Cada hora: sancionar usuarios que no calificaron en 24h
function iniciarCronSanciones() {
  cron.schedule('0 * * * *', async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Obtener pendientes vencidos
      const { rows: vencidos } = await client.query(
        `SELECT cp.usuario_id, cp.evento_id
         FROM calificaciones_pendientes cp
         WHERE cp.vence_en < NOW()`
      );

      for (const { usuario_id, evento_id } of vencidos) {
        // Restar XP
        await darXP(usuario_id, 'no_calificar', evento_id);

        // Registrar sanción
        await client.query(
          `INSERT INTO sanciones (usuario_id, evento_id, motivo, xp_penalidad)
           VALUES ($1, $2, 'no_calificacion', 10)`,
          [usuario_id, evento_id]
        );

        // Incrementar contador de sanciones
        const { rows: [u] } = await client.query(
          'UPDATE usuarios SET sanciones_activas = sanciones_activas + 1 WHERE id = $1 RETURNING sanciones_activas',
          [usuario_id]
        );

        // Suspensión automática
        let diasSuspension = 0;
        if (u.sanciones_activas === 2) diasSuspension = 3;
        if (u.sanciones_activas >= 3) diasSuspension = 7;

        if (diasSuspension > 0) {
          await client.query(
            `UPDATE usuarios SET
               estado = 'suspendido',
               suspendido_hasta = NOW() + make_interval(days => $2)
             WHERE id = $1`,
            [usuario_id, diasSuspension]
          );
        }

        // Notificar al usuario
        await client.query(
          `INSERT INTO notificaciones (usuario_id, tipo, mensaje, referencia_id)
           VALUES ($1, 'sancion', 'No calificaste a tus compañeros. -10 XP aplicado.', $2)`,
          [usuario_id, evento_id]
        );

        // Eliminar de pendientes
        await client.query(
          'DELETE FROM calificaciones_pendientes WHERE evento_id = $1 AND usuario_id = $2',
          [evento_id, usuario_id]
        );
      }

      // Levantar suspensiones vencidas
      await client.query(
        `UPDATE usuarios SET estado = 'activo', suspendido_hasta = NULL, sanciones_activas = 0
         WHERE estado = 'suspendido' AND suspendido_hasta < NOW()`
      );

      await client.query('COMMIT');
      if (vencidos.length > 0) {
        console.log(`[cron-sanciones] Procesados ${vencidos.length} pendientes vencidos`);
      }
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('[cron-sanciones] Error:', err.message);
    } finally {
      client.release();
    }
  });

  console.log('[cron-sanciones] Iniciado — revisión cada hora');
}

// Cada 15 minutos: enviar recordatorio 2h antes del partido
function iniciarCronRecordatorios() {
  cron.schedule('*/15 * * * *', async () => {
    try {
      // Eventos que empiezan entre 1h55 y 2h05 desde ahora (ventana de 10 min para no duplicar)
      const { rows: proximos } = await pool.query(
        `SELECT e.id, e.titulo, ep.usuario_id
         FROM eventos e
         JOIN evento_participantes ep ON ep.evento_id = e.id
         WHERE e.estado IN ('abierto','lleno','confirmado')
           AND e.fecha_evento BETWEEN NOW() + INTERVAL '115 minutes'
                                    AND NOW() + INTERVAL '125 minutes'
           AND NOT EXISTS (
             SELECT 1 FROM notificaciones n
             WHERE n.usuario_id = ep.usuario_id
               AND n.referencia_id = e.id
               AND n.mensaje LIKE '%⏰%'
               AND n.creado_en > NOW() - INTERVAL '3 hours'
           )`
      );
      for (const { id, titulo, usuario_id } of proximos) {
        await pool.query(
          `INSERT INTO notificaciones (usuario_id, tipo, mensaje, referencia_id)
           VALUES ($1, 'evento', $2, $3)`,
          [usuario_id, `⏰ Tu partido "${titulo}" empieza en 2 horas. ¡Prepárate!`, id]
        );
      }
      if (proximos.length > 0) {
        console.log(`[cron-recordatorios] Enviados ${proximos.length} recordatorios`);
      }
    } catch (err) {
      console.error('[cron-recordatorios] Error:', err.message);
    }
  });
  console.log('[cron-recordatorios] Iniciado — revisión cada 15 min');
}

module.exports = { iniciarCronSanciones, iniciarCronRecordatorios };
