CREATE TABLE IF NOT EXISTS evento_tiempos (
  evento_id   UUID PRIMARY KEY REFERENCES eventos(id) ON DELETE CASCADE,
  inicio_real TIMESTAMPTZ,
  fin_real    TIMESTAMPTZ
);
