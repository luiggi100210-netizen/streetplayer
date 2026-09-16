-- Ejecutar con: psql $DATABASE_URL -f src/db/medallas_migration.sql

CREATE TABLE IF NOT EXISTS medallas_usuario (
  usuario_id      UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  medalla_id      VARCHAR(30) NOT NULL,
  desbloqueada_en TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (usuario_id, medalla_id)
);

CREATE INDEX IF NOT EXISTS idx_medallas_usuario ON medallas_usuario(usuario_id);

-- Catalogo de medallas personalizadas creadas por el admin (admin.extras.controller.js:
-- listarMedallasAdmin/crearMedalla/otorgarMedalla). Nunca se creo esta tabla — el admin
-- panel referenciaba "medallas" desde el principio sin que existiera.
CREATE TABLE IF NOT EXISTS medallas (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre          VARCHAR(80)  NOT NULL,
  descripcion     TEXT,
  icono           VARCHAR(10)  DEFAULT '🏅',
  tipo            VARCHAR(20)  DEFAULT 'logro' CHECK (tipo IN ('logro','habilidad','participacion','especial')),
  condicion_tipo  VARCHAR(50),
  condicion_valor INTEGER,
  fecha_creacion  TIMESTAMPTZ  DEFAULT NOW()
);

-- medalla_id guardaba IDs cortos hardcodeados ('goleador', 'campeon', etc, VARCHAR(30));
-- las medallas otorgadas manualmente desde este catalogo usan un UUID (36 caracteres).
ALTER TABLE medallas_usuario ALTER COLUMN medalla_id TYPE VARCHAR(40);
