-- Audit log de acciones admin
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id        UUID         REFERENCES admins(id) ON DELETE SET NULL,
  admin_username  VARCHAR(60),
  accion          VARCHAR(120) NOT NULL,
  entidad         VARCHAR(50),
  entidad_id      UUID,
  detalles        JSONB,
  ip              VARCHAR(45),
  fecha           TIMESTAMPTZ  DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_log_fecha ON admin_audit_log(fecha DESC);

-- Configuración del sistema
CREATE TABLE IF NOT EXISTS config_sistema (
  clave           VARCHAR(80)  PRIMARY KEY,
  valor           TEXT         NOT NULL,
  descripcion     VARCHAR(255),
  tipo            VARCHAR(20)  DEFAULT 'string' CHECK (tipo IN ('string','boolean','integer','json')),
  actualizado_en  TIMESTAMPTZ  DEFAULT NOW()
);
INSERT INTO config_sistema (clave, valor, descripcion, tipo) VALUES
  ('partidos_para_crear_equipo',  '5',      'Partidos mínimos para crear equipo',          'integer'),
  ('partidos_para_crear_torneo',  '0',      'Partidos mínimos para crear torneo',          'integer'),
  ('xp_por_partido',              '100',    'XP ganado por partido jugado',                'integer'),
  ('xp_por_gol',                  '25',     'XP ganado por gol anotado',                   'integer'),
  ('xp_por_evento',               '50',     'XP ganado por inscribirse a evento',          'integer'),
  ('max_miembros_equipo',         '20',     'Máximo de miembros por equipo',               'integer'),
  ('modo_mantenimiento',          'false',  'Activar modo mantenimiento en la app',        'boolean'),
  ('mensaje_mantenimiento',       'La aplicación está en mantenimiento. Volvemos pronto.','Mensaje de mantenimiento','string'),
  ('registro_abierto',            'true',   'Permitir nuevos registros de usuarios',       'boolean'),
  ('retos_habilitados',           'true',   'Habilitar el sistema de retos entre equipos', 'boolean'),
  ('torneos_habilitados',         'true',   'Habilitar la creación de torneos',            'boolean')
ON CONFLICT DO NOTHING;

-- Solicitudes de privacidad (GDPR)
CREATE TABLE IF NOT EXISTS solicitudes_privacidad (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id       UUID         REFERENCES usuarios(id) ON DELETE CASCADE,
  usuario_username VARCHAR(60),
  usuario_email    VARCHAR(200),
  tipo             VARCHAR(40)  NOT NULL CHECK (tipo IN ('exportar_datos','eliminar_cuenta','rectificar_datos','portabilidad','oposicion_tratamiento')),
  estado           VARCHAR(20)  DEFAULT 'pendiente' CHECK (estado IN ('pendiente','procesando','completado','rechazado')),
  motivo           TEXT,
  respuesta_admin  TEXT,
  fecha_solicitud  TIMESTAMPTZ  DEFAULT NOW(),
  fecha_procesado  TIMESTAMPTZ
);

-- Último acceso (para métricas de retención)
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS ultimo_acceso TIMESTAMPTZ;
