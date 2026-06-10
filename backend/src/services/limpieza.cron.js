const cron = require('node-cron');
const pool = require('../config/database');

/**
 * Diario a las 04:00 — borra residuos de autenticación:
 * refresh tokens revocados/vencidos (cada login y renovación inserta
 * una fila nueva) y códigos de recuperación usados o expirados.
 */
function iniciarCronLimpieza() {
  cron.schedule('0 4 * * *', async () => {
    try {
      const rt = await pool.query(
        "DELETE FROM refresh_tokens WHERE revocado = true OR expires_at < NOW() - INTERVAL '7 days'"
      );
      const pr = await pool.query(
        'DELETE FROM password_resets WHERE usado = true OR expires_at < NOW()'
      );
      if (rt.rowCount > 0 || pr.rowCount > 0) {
        console.log(`[cron-limpieza] refresh_tokens: ${rt.rowCount} borrados | password_resets: ${pr.rowCount} borrados`);
      }
    } catch (err) {
      console.error('[cron-limpieza] Error:', err.message);
    }
  });
  console.log('[cron-limpieza] Iniciado — diario a las 04:00');
}

module.exports = { iniciarCronLimpieza };
