-- ============================================================
-- STREETPLAYER — Recuperación de contraseña
-- Códigos de 6 dígitos enviados por email, hasheados con SHA-256,
-- con expiración y un solo uso.
-- ============================================================

CREATE TABLE IF NOT EXISTS password_resets (
  id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id  UUID         NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  codigo_hash CHAR(64)     NOT NULL,
  expires_at  TIMESTAMPTZ  NOT NULL,
  usado       BOOLEAN      DEFAULT false,
  creado_en   TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_resets_usuario ON password_resets(usuario_id);
