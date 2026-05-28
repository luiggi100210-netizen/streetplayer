/**
 * Corre el schema completo + migraciones al iniciar en producción.
 * Todos los SQL usan CREATE TABLE IF NOT EXISTS — es idempotente.
 */
const path = require('path');
const fs   = require('fs');
const pool = require('../config/database');

const SQL_FILES = [
  'schema.sql',
  'medallas_migration.sql',
  'chat_migration.sql',
];

async function init() {
  for (const file of SQL_FILES) {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) continue;
    let sql = fs.readFileSync(filePath, 'utf8');
    // Neon no tiene uuid-ossp — reemplazar con gen_random_uuid() nativo de PG13+
    sql = sql.replace(/CREATE EXTENSION IF NOT EXISTS "uuid-ossp";?/g, '');
    sql = sql.replace(/uuid_generate_v4\(\)/g, 'gen_random_uuid()');
    try {
      await pool.query(sql);
      console.log(`[DB] ${file} aplicado`);
    } catch (err) {
      console.error(`[DB] Error en ${file}:`, err.message);
    }
  }
}

module.exports = init;
