-- ============================================================
-- STREETPLAYER — Ciudad y departamento en eventos
-- Se llenan automáticamente con geocoding inverso al crear el
-- evento. Habilitan el filtro por ciudad en /api/eventos.
-- ============================================================

ALTER TABLE eventos ADD COLUMN IF NOT EXISTS ciudad VARCHAR(80);
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS departamento VARCHAR(80);

CREATE INDEX IF NOT EXISTS idx_eventos_ciudad ON eventos (LOWER(ciudad));
