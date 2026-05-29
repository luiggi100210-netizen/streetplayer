-- Solicitudes de publicidad de empresas
CREATE TABLE IF NOT EXISTS publicidad_solicitudes (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa         VARCHAR(100) NOT NULL,
  contacto        VARCHAR(100) NOT NULL,
  email           VARCHAR(200) NOT NULL,
  telefono        VARCHAR(30),
  tipo            VARCHAR(20)  NOT NULL CHECK (tipo IN ('foto', 'video', 'banner', 'pack')),
  duracion_dias   INTEGER      DEFAULT 7,
  mensaje         TEXT,
  estado          VARCHAR(20)  DEFAULT 'pendiente' CHECK (estado IN ('pendiente','contactado','activo','rechazado')),
  precio_acordado DECIMAL(10,2),
  notas_admin     TEXT,
  fecha_solicitud TIMESTAMPTZ  DEFAULT NOW()
);

-- Tarifas configurables desde el admin
CREATE TABLE IF NOT EXISTS publicidad_tarifas (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      VARCHAR(60)  NOT NULL,
  tipo        VARCHAR(20)  NOT NULL CHECK (tipo IN ('foto', 'video', 'banner', 'pack')),
  descripcion TEXT,
  precio_base DECIMAL(10,2) NOT NULL,
  duracion_dias INTEGER     DEFAULT 7,
  activo      BOOLEAN      DEFAULT true
);

-- Tarifas iniciales
INSERT INTO publicidad_tarifas (nombre, tipo, descripcion, precio_base, duracion_dias) VALUES
  ('Banner Foto',     'foto',   'Imagen estática en feed de usuarios activos, 320×100 px',         120.00, 7),
  ('Banner Foto',     'foto',   'Imagen estática en feed de usuarios activos, 320×100 px',         350.00, 30),
  ('Video Promocional','video', 'Video de hasta 30s en feed principal, autoplay muted',             250.00, 7),
  ('Video Promocional','video', 'Video de hasta 30s en feed principal, autoplay muted',             680.00, 30),
  ('Pack Completo',   'pack',   'Foto + Video + destacado en pantalla de búsqueda por 30 días',   1100.00, 30)
ON CONFLICT DO NOTHING;
