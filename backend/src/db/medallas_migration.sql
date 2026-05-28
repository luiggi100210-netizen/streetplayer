-- Ejecutar con: psql $DATABASE_URL -f src/db/medallas_migration.sql

CREATE TABLE IF NOT EXISTS medallas_usuario (
  usuario_id      UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  medalla_id      VARCHAR(30) NOT NULL,
  desbloqueada_en TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (usuario_id, medalla_id)
);

CREATE INDEX IF NOT EXISTS idx_medallas_usuario ON medallas_usuario(usuario_id);
