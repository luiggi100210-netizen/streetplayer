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
  'firebase_migration.sql',
  'tiempos_migration.sql',
  'mvp_migration.sql',
  'torneo_full_migration.sql',
  'retos_full_migration.sql',
  'publicidad_migration.sql',
];

async function init() {
  for (const file of SQL_FILES) {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) continue;

    let sql = fs.readFileSync(filePath, 'utf8');
    // Neon no soporta uuid-ossp — usar gen_random_uuid() nativo de PG13+
    sql = sql.replace(/CREATE EXTENSION IF NOT EXISTS "uuid-ossp";?/g, '');
    sql = sql.replace(/uuid_generate_v4\(\)/g, 'gen_random_uuid()');

    // Neon pooler no acepta multi-statement — ejecutar cada sentencia por separado
    const statements = sql
      .split(';')
      .map(s =>
        // Quitar líneas de comentarios al inicio/medio, dejar solo el SQL
        s.split('\n')
          .filter(line => !line.trim().startsWith('--'))
          .join('\n')
          .trim()
      )
      .filter(s => s.length > 0);

    let ok = 0;
    for (const stmt of statements) {
      try {
        await pool.query(stmt);
        ok++;
      } catch (err) {
        // Ignorar errores de "ya existe" (idempotente)
        if (!err.message.includes('already exists')) {
          console.warn(`[DB] ${file} warning:`, err.message.substring(0, 120));
        }
      }
    }
    console.log(`[DB] ${file} — ${ok}/${statements.length} sentencias OK`);
  }
}

module.exports = init;
