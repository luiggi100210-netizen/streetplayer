-- Nuevos campos en retos
ALTER TABLE retos ADD COLUMN IF NOT EXISTS cancha TEXT;
ALTER TABLE retos ADD COLUMN IF NOT EXISTS hora_propuesta TIMESTAMPTZ;
ALTER TABLE retos ADD COLUMN IF NOT EXISTS formato_reto VARCHAR(20) DEFAULT 'tiempo';
ALTER TABLE retos ADD COLUMN IF NOT EXISTS valor_formato INTEGER DEFAULT 15;
ALTER TABLE retos ADD COLUMN IF NOT EXISTS monto_apuesta NUMERIC(8,2) DEFAULT 0;
ALTER TABLE retos ADD COLUMN IF NOT EXISTS moneda VARCHAR(5) DEFAULT 'PEN';
ALTER TABLE retos ADD COLUMN IF NOT EXISTS rondas_contraoferta INTEGER DEFAULT 0;
ALTER TABLE retos ADD COLUMN IF NOT EXISTS propuesto_por UUID;

-- Estadisticas y ubicacion en equipos
ALTER TABLE equipos ADD COLUMN IF NOT EXISTS latitud NUMERIC(10,7);
ALTER TABLE equipos ADD COLUMN IF NOT EXISTS longitud NUMERIC(10,7);
ALTER TABLE equipos ADD COLUMN IF NOT EXISTS goles_favor INTEGER DEFAULT 0;
ALTER TABLE equipos ADD COLUMN IF NOT EXISTS goles_contra INTEGER DEFAULT 0;
ALTER TABLE equipos ADD COLUMN IF NOT EXISTS racha_actual INTEGER DEFAULT 0;

-- Historial de fichajes y prestamos
CREATE TABLE IF NOT EXISTS equipo_transfers (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipo_id        UUID NOT NULL REFERENCES equipos(id) ON DELETE CASCADE,
  usuario_id       UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo             VARCHAR(20) NOT NULL,
  equipo_origen_id UUID REFERENCES equipos(id),
  fecha_inicio     TIMESTAMPTZ DEFAULT NOW(),
  fecha_fin        TIMESTAMPTZ,
  activo           BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_equipo_transfers_equipo ON equipo_transfers(equipo_id);

-- Chat entre capitanes por reto
CREATE TABLE IF NOT EXISTS reto_mensajes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reto_id    UUID NOT NULL REFERENCES retos(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  contenido  TEXT NOT NULL,
  fecha      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reto_mensajes_reto ON reto_mensajes(reto_id);
