-- ============================================================
-- STREETPLAYER — Refresh Tokens
-- Ejecutar: psql -U <user> -d <db> -f refresh_tokens_migration.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id  UUID         NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  token_hash  CHAR(64)     NOT NULL UNIQUE,   -- SHA-256 del token crudo
  expires_at  TIMESTAMPTZ  NOT NULL,
  revocado    BOOLEAN      DEFAULT false,
  creado_en   TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_usuario ON refresh_tokens(usuario_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash    ON refresh_tokens(token_hash);
