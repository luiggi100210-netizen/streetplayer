const pool = require('../config/database');

/**
 * Ejecuta fn(client) dentro de una transacción.
 * Commit si fn resuelve; rollback y re-throw si lanza.
 * Los errores con .status los traduce el error handler de app.js.
 */
async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = withTransaction;
