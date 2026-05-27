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
               suspendido_hasta = NOW() + INTERVAL '${diasSuspension} days'
             WHERE id = $1`,
            [usuario_id]
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

module.exports = { iniciarCronSanciones };
