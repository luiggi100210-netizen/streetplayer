-- ============================================================
-- STREETPLAYER — Schema de base de datos
-- ============================================================

-- Extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USUARIOS
-- ============================================================
CREATE TABLE IF NOT EXISTS usuarios (
  id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  username        VARCHAR(30)   UNIQUE NOT NULL,
  email           VARCHAR(100)  UNIQUE NOT NULL,
  password_hash   VARCHAR(255)  NOT NULL,
  nombre          VARCHAR(80)   NOT NULL,
  apellidos       VARCHAR(80),
  foto_url        TEXT,
  bio             TEXT,
  ciudad          VARCHAR(80),
  latitud         NUMERIC(10,7),
  longitud        NUMERIC(10,7),
  deportes        TEXT[]        DEFAULT '{}',  -- ['fútbol','básquet']
  posicion        VARCHAR(50),                 -- posición en el deporte principal
  nivel           VARCHAR(20)   DEFAULT 'principiante' CHECK (nivel IN ('principiante','intermedio','avanzado','profesional')),
  puntos          INTEGER       DEFAULT 0,
  partidos_jugados INTEGER      DEFAULT 0,
  partidos_ganados INTEGER      DEFAULT 0,
  estado          VARCHAR(20)   DEFAULT 'activo' CHECK (estado IN ('activo','suspendido','baneado')),
  verificado      BOOLEAN       DEFAULT false,
  fecha_registro  TIMESTAMPTZ   DEFAULT NOW(),
  ultimo_acceso   TIMESTAMPTZ   DEFAULT NOW()
);

-- ============================================================
-- SEGUIDORES
-- ============================================================
CREATE TABLE IF NOT EXISTS seguidores (
  seguidor_id   UUID  REFERENCES usuarios(id) ON DELETE CASCADE,
  seguido_id    UUID  REFERENCES usuarios(id) ON DELETE CASCADE,
  fecha         TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (seguidor_id, seguido_id)
);

-- ============================================================
-- EVENTOS DEPORTIVOS
-- ============================================================
CREATE TABLE IF NOT EXISTS eventos (
  id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  creador_id      UUID          NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  titulo          VARCHAR(120)  NOT NULL,
  descripcion     TEXT,
  deporte         VARCHAR(50)   NOT NULL,
  nivel           VARCHAR(20)   DEFAULT 'todos' CHECK (nivel IN ('todos','principiante','intermedio','avanzado','profesional')),
  foto_url        TEXT,
  direccion       TEXT,
  latitud         NUMERIC(10,7),
  longitud        NUMERIC(10,7),
  fecha_evento    TIMESTAMPTZ   NOT NULL,
  duracion_min    INTEGER       DEFAULT 90,
  cupos_total     INTEGER       DEFAULT 10,
  cupos_ocupados  INTEGER       DEFAULT 0,
  precio          NUMERIC(8,2)  DEFAULT 0,
  estado          VARCHAR(20)   DEFAULT 'abierto' CHECK (estado IN ('abierto','lleno','en_curso','finalizado','cancelado')),
  es_privado      BOOLEAN       DEFAULT false,
  fecha_creacion  TIMESTAMPTZ   DEFAULT NOW()
);

-- ============================================================
-- PARTICIPANTES DE EVENTOS
-- ============================================================
CREATE TABLE IF NOT EXISTS evento_participantes (
  evento_id   UUID  REFERENCES eventos(id) ON DELETE CASCADE,
  usuario_id  UUID  REFERENCES usuarios(id) ON DELETE CASCADE,
  estado      VARCHAR(20) DEFAULT 'confirmado' CHECK (estado IN ('confirmado','pendiente','cancelado')),
  fecha       TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (evento_id, usuario_id)
);

-- ============================================================
-- EQUIPOS
-- ============================================================
CREATE TABLE IF NOT EXISTS equipos (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre        VARCHAR(80) UNIQUE NOT NULL,
  descripcion   TEXT,
  foto_url      TEXT,
  deporte       VARCHAR(50),
  ciudad        VARCHAR(80),
  capitan_id    UUID        REFERENCES usuarios(id),
  puntos        INTEGER     DEFAULT 0,
  partidos_ganados INTEGER  DEFAULT 0,
  partidos_perdidos INTEGER DEFAULT 0,
  estado        VARCHAR(20) DEFAULT 'activo',
  fecha_creacion TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS equipo_miembros (
  equipo_id   UUID  REFERENCES equipos(id) ON DELETE CASCADE,
  usuario_id  UUID  REFERENCES usuarios(id) ON DELETE CASCADE,
  rol         VARCHAR(20) DEFAULT 'jugador' CHECK (rol IN ('capitan','jugador')),
  fecha       TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (equipo_id, usuario_id)
);

-- ============================================================
-- TORNEOS
-- ============================================================
CREATE TABLE IF NOT EXISTS torneos (
  id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizador_id  UUID          NOT NULL REFERENCES usuarios(id),
  nombre          VARCHAR(120)  NOT NULL,
  descripcion     TEXT,
  deporte         VARCHAR(50)   NOT NULL,
  foto_url        TEXT,
  ciudad          VARCHAR(80),
  latitud         NUMERIC(10,7),
  longitud        NUMERIC(10,7),
  fecha_inicio    DATE          NOT NULL,
  fecha_fin       DATE,
  max_equipos     INTEGER       DEFAULT 8,
  premio          TEXT,
  precio_inscripcion NUMERIC(8,2) DEFAULT 0,
  formato         VARCHAR(30)   DEFAULT 'eliminacion' CHECK (formato IN ('eliminacion','grupos','liga')),
  estado          VARCHAR(20)   DEFAULT 'abierto' CHECK (estado IN ('abierto','en_curso','finalizado','cancelado')),
  aprobado        BOOLEAN       DEFAULT false,
  fecha_creacion  TIMESTAMPTZ   DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS torneo_equipos (
  torneo_id   UUID  REFERENCES torneos(id) ON DELETE CASCADE,
  equipo_id   UUID  REFERENCES equipos(id) ON DELETE CASCADE,
  estado      VARCHAR(20) DEFAULT 'inscrito',
  fecha       TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (torneo_id, equipo_id)
);

-- ============================================================
-- PARTIDOS / MATCHES
-- ============================================================
CREATE TABLE IF NOT EXISTS partidos (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  torneo_id       UUID        REFERENCES torneos(id),
  evento_id       UUID        REFERENCES eventos(id),
  equipo_local_id UUID        REFERENCES equipos(id),
  equipo_visita_id UUID       REFERENCES equipos(id),
  goles_local     INTEGER,
  goles_visita    INTEGER,
  fecha           TIMESTAMPTZ,
  estado          VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente','en_curso','finalizado')),
  ronda           VARCHAR(30),
  fecha_creacion  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- RANKING
-- ============================================================
CREATE TABLE IF NOT EXISTS ranking (
  id          UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id  UUID    UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
  puntos      INTEGER DEFAULT 0,
  posicion    INTEGER,
  victorias   INTEGER DEFAULT 0,
  derrotas    INTEGER DEFAULT 0,
  empates     INTEGER DEFAULT 0,
  deporte     VARCHAR(50) DEFAULT 'general',
  actualizado TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PUBLICACIONES (feed social)
-- ============================================================
CREATE TABLE IF NOT EXISTS publicaciones (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id  UUID        NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  contenido   TEXT,
  foto_url    TEXT,
  evento_id   UUID        REFERENCES eventos(id),
  likes       INTEGER     DEFAULT 0,
  fecha       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS publicacion_likes (
  publicacion_id UUID REFERENCES publicaciones(id) ON DELETE CASCADE,
  usuario_id     UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  fecha          TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (publicacion_id, usuario_id)
);

CREATE TABLE IF NOT EXISTS comentarios (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  publicacion_id  UUID        REFERENCES publicaciones(id) ON DELETE CASCADE,
  usuario_id      UUID        REFERENCES usuarios(id) ON DELETE CASCADE,
  contenido       TEXT        NOT NULL,
  fecha           TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- NOTIFICACIONES
-- ============================================================
CREATE TABLE IF NOT EXISTS notificaciones (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id  UUID        NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo        VARCHAR(50) NOT NULL, -- 'evento','seguidor','torneo','like','comentario'
  mensaje     TEXT        NOT NULL,
  leida       BOOLEAN     DEFAULT false,
  referencia_id UUID,
  fecha       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- REPORTES Y SANCIONES
-- ============================================================
CREATE TABLE IF NOT EXISTS reportes (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  reportado_por UUID        REFERENCES usuarios(id),
  usuario_id    UUID        REFERENCES usuarios(id),
  evento_id     UUID        REFERENCES eventos(id),
  motivo        VARCHAR(100) NOT NULL,
  descripcion   TEXT,
  estado        VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente','revisado','resuelto')),
  fecha         TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sanciones (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id  UUID        REFERENCES usuarios(id),
  tipo        VARCHAR(30) NOT NULL, -- 'advertencia','suspension','baneo'
  motivo      TEXT,
  admin_id    UUID,
  hasta       TIMESTAMPTZ,
  fecha       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PUBLICIDAD
-- ============================================================
CREATE TABLE IF NOT EXISTS anuncios (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo      VARCHAR(120),
  imagen_url  TEXT,
  url_destino TEXT,
  activo      BOOLEAN     DEFAULT true,
  impresiones INTEGER     DEFAULT 0,
  clics       INTEGER     DEFAULT 0,
  fecha_inicio DATE,
  fecha_fin   DATE,
  fecha_creacion TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ADMIN
-- ============================================================
CREATE TABLE IF NOT EXISTS admins (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  username      VARCHAR(50) UNIQUE NOT NULL,
  email         VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nombre        VARCHAR(80),
  rol           VARCHAR(20) DEFAULT 'moderador' CHECK (rol IN ('superadmin','moderador')),
  activo        BOOLEAN     DEFAULT true,
  fecha_creacion TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_eventos_deporte    ON eventos(deporte);
CREATE INDEX IF NOT EXISTS idx_eventos_fecha      ON eventos(fecha_evento);
CREATE INDEX IF NOT EXISTS idx_eventos_estado     ON eventos(estado);
CREATE INDEX IF NOT EXISTS idx_eventos_latlon     ON eventos(latitud, longitud);
CREATE INDEX IF NOT EXISTS idx_usuarios_ciudad    ON usuarios(ciudad);
CREATE INDEX IF NOT EXISTS idx_publicaciones_user ON publicaciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notif_usuario      ON notificaciones(usuario_id, leida);
CREATE INDEX IF NOT EXISTS idx_ranking_puntos     ON ranking(puntos DESC);

-- Admin por defecto
INSERT INTO admins (username, email, password_hash, nombre, rol)
VALUES ('admin', 'admin@streetplayer.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrador', 'superadmin')
ON CONFLICT DO NOTHING;
