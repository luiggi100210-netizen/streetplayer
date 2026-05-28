-- ============================================================
-- STREETPLAYER — Chat migration
-- Ejecutar: psql $DATABASE_URL -f src/db/chat_migration.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS conversaciones (
  id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario1_id      UUID        NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  usuario2_id      UUID        NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  ultimo_mensaje   TEXT,
  ultima_actividad TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (usuario1_id, usuario2_id),
  CHECK (usuario1_id < usuario2_id)
);

CREATE TABLE IF NOT EXISTS mensajes (
  id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversacion_id  UUID        NOT NULL REFERENCES conversaciones(id) ON DELETE CASCADE,
  remitente_id     UUID        NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  contenido        TEXT        NOT NULL CHECK (char_length(contenido) <= 1000),
  leido            BOOLEAN     DEFAULT false,
  fecha            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mensajes_conv   ON mensajes(conversacion_id, fecha DESC);
CREATE INDEX IF NOT EXISTS idx_conv_usuario1   ON conversaciones(usuario1_id, ultima_actividad DESC);
CREATE INDEX IF NOT EXISTS idx_conv_usuario2   ON conversaciones(usuario2_id, ultima_actividad DESC);
