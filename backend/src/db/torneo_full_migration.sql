-- Columna numero_ronda para ordenar rondas del fixture
ALTER TABLE partidos ADD COLUMN IF NOT EXISTS numero_ronda INTEGER DEFAULT 1;

-- Premios por puesto de torneo
CREATE TABLE IF NOT EXISTS torneo_premios (
  torneo_id   UUID REFERENCES torneos(id) ON DELETE CASCADE,
  puesto      INTEGER NOT NULL,
  descripcion TEXT NOT NULL,
  PRIMARY KEY (torneo_id, puesto)
);

-- Medallas de torneo (campeon, subcampeon, tercero, participante)
CREATE TABLE IF NOT EXISTS torneo_medallas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id      UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  torneo_id       UUID NOT NULL REFERENCES torneos(id) ON DELETE CASCADE,
  tipo            VARCHAR(20) NOT NULL,
  desbloqueada_en TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (usuario_id, torneo_id, tipo)
);

CREATE INDEX IF NOT EXISTS idx_torneo_medallas_usuario ON torneo_medallas(usuario_id);
