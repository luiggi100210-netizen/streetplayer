CREATE TABLE IF NOT EXISTS mvp_votos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id   UUID NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
  votante_id  UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  votado_id   UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  creado_en   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (evento_id, votante_id)
);
