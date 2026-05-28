-- ============================================================
-- STREETPLAYER — Schema completo v2
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USUARIOS
-- ============================================================
CREATE TABLE IF NOT EXISTS usuarios (
  id                UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  firebase_uid      VARCHAR(128)  UNIQUE,             -- Firebase Auth UID
  username          VARCHAR(30)   UNIQUE NOT NULL,
  email             VARCHAR(100)  UNIQUE NOT NULL,
  password_hash     VARCHAR(255),                     -- null si usa Firebase
  nombre            VARCHAR(80)   NOT NULL,
  apodo             VARCHAR(50),
  foto_url          TEXT,
  bio               TEXT,
  pais              VARCHAR(50)   DEFAULT 'Peru',
  departamento      VARCHAR(80),
  ciudad            VARCHAR(80),
  distrito          VARCHAR(80),
  latitud           NUMERIC(10,7),
  longitud          NUMERIC(10,7),
  -- Datos deportivos
  deportes          TEXT[]        DEFAULT '{}',
  posicion          VARCHAR(30)   CHECK (posicion IN ('portero','defensa','mediocampista','delantero',NULL)),
  pie_dominante     VARCHAR(10)   CHECK (pie_dominante IN ('derecho','izquierdo','ambos',NULL)),
  formato_preferido INTEGER       CHECK (formato_preferido IN (5,7,8,9,10,11,NULL)),
  -- Rol en plataforma
  rol               VARCHAR(20)   DEFAULT 'jugador' CHECK (rol IN ('jugador','capitan','organizador','admin')),
  -- Gamificación
  xp                INTEGER       DEFAULT 0,
  nivel_xp          VARCHAR(20)   DEFAULT 'rookie' CHECK (nivel_xp IN ('rookie','amateur','intermedio','avanzado','pro','elite','leyenda')),
  puntos_ranking    INTEGER       DEFAULT 0,
  -- Estadísticas acumuladas
  partidos_jugados  INTEGER       DEFAULT 0,
  partidos_ganados  INTEGER       DEFAULT 0,
  partidos_empatados INTEGER      DEFAULT 0,
  partidos_perdidos INTEGER       DEFAULT 0,
  goles_totales     INTEGER       DEFAULT 0,
  asistencias_totales INTEGER     DEFAULT 0,
  tarjetas_amarillas INTEGER      DEFAULT 0,
  tarjetas_rojas    INTEGER       DEFAULT 0,
  -- Estado
  sanciones_activas INTEGER       DEFAULT 0,
  suspendido_hasta  TIMESTAMPTZ,
  estado            VARCHAR(20)   DEFAULT 'activo' CHECK (estado IN ('activo','suspendido','baneado')),
  verificado        BOOLEAN       DEFAULT false,
  auth_provider     VARCHAR(20)   DEFAULT 'email' CHECK (auth_provider IN ('email','google','facebook')),
  fecha_registro    TIMESTAMPTZ   DEFAULT NOW(),
  ultimo_acceso     TIMESTAMPTZ   DEFAULT NOW()
);

-- ============================================================
-- SEGUIDORES
-- ============================================================
CREATE TABLE IF NOT EXISTS seguidores (
  seguidor_id   UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  seguido_id    UUID REFERENCES usuarios(id) ON DELETE CASCADE,
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
  tipo            VARCHAR(20)   DEFAULT 'pichanga' CHECK (tipo IN ('pichanga','reto','campeonato')),
  descripcion     TEXT,
  deporte         VARCHAR(50)   NOT NULL DEFAULT 'futbol',
  nivel           VARCHAR(20)   DEFAULT 'todos' CHECK (nivel IN ('todos','rookie','amateur','intermedio','avanzado','pro','elite')),
  foto_url        TEXT,
  nombre_cancha   VARCHAR(120),
  direccion       TEXT,
  latitud         NUMERIC(10,7),
  longitud        NUMERIC(10,7),
  fecha_evento    TIMESTAMPTZ   NOT NULL,
  duracion_min    INTEGER       DEFAULT 90,
  formato         INTEGER       DEFAULT 5 CHECK (formato IN (5,7,8,9,10,11)),
  cupos_total     INTEGER       DEFAULT 10,
  cupos_ocupados  INTEGER       DEFAULT 0,
  precio          NUMERIC(8,2)  DEFAULT 0,
  es_privado      BOOLEAN       DEFAULT false,
  codigo_invitacion VARCHAR(12),
  link_whatsapp   TEXT,
  estado          VARCHAR(20)   DEFAULT 'abierto' CHECK (estado IN ('abierto','lleno','en_curso','finalizado','cancelado')),
  calificaciones_completadas BOOLEAN DEFAULT false,
  fecha_creacion  TIMESTAMPTZ   DEFAULT NOW()
);

-- ============================================================
-- PARTICIPANTES DE EVENTOS
-- ============================================================
CREATE TABLE IF NOT EXISTS evento_participantes (
  evento_id   UUID REFERENCES eventos(id) ON DELETE CASCADE,
  usuario_id  UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  equipo      VARCHAR(1) DEFAULT 'A' CHECK (equipo IN ('A','B')),
  estado      VARCHAR(20) DEFAULT 'confirmado' CHECK (estado IN ('confirmado','pendiente','cancelado','asistio','ausente')),
  fecha       TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (evento_id, usuario_id)
);

-- ============================================================
-- RESULTADOS DE PARTIDOS
-- ============================================================
CREATE TABLE IF NOT EXISTS resultados (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  evento_id       UUID        UNIQUE REFERENCES eventos(id) ON DELETE CASCADE,
  goles_equipo_a  INTEGER     NOT NULL DEFAULT 0,
  goles_equipo_b  INTEGER     NOT NULL DEFAULT 0,
  resultado       VARCHAR(10) CHECK (resultado IN ('equipo_a','equipo_b','empate')),
  registrado_por  UUID        REFERENCES usuarios(id),
  fecha           TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ESTADÍSTICAS POR JUGADOR POR PARTIDO
-- ============================================================
CREATE TABLE IF NOT EXISTS jugador_stats (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  evento_id       UUID        REFERENCES eventos(id) ON DELETE CASCADE,
  usuario_id      UUID        REFERENCES usuarios(id) ON DELETE CASCADE,
  goles           INTEGER     DEFAULT 0,
  asistencias     INTEGER     DEFAULT 0,
  tarjetas_amarillas INTEGER  DEFAULT 0,
  tarjetas_rojas  INTEGER     DEFAULT 0,
  calificacion_promedio NUMERIC(3,2),
  UNIQUE (evento_id, usuario_id)
);

-- ============================================================
-- CALIFICACIONES POST-PARTIDO
-- ============================================================
CREATE TABLE IF NOT EXISTS calificaciones (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  evento_id       UUID        REFERENCES eventos(id) ON DELETE CASCADE,
  calificador_id  UUID        REFERENCES usuarios(id) ON DELETE CASCADE,
  calificado_id   UUID        REFERENCES usuarios(id) ON DELETE CASCADE,
  estrellas       INTEGER     NOT NULL CHECK (estrellas BETWEEN 1 AND 5),
  tags_positivos  TEXT[]      DEFAULT '{}',
  tags_negativos  TEXT[]      DEFAULT '{}',
  fecha           TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (evento_id, calificador_id, calificado_id)
);

-- Pendientes de calificar (se elimina cuando se completa)
CREATE TABLE IF NOT EXISTS calificaciones_pendientes (
  evento_id       UUID REFERENCES eventos(id) ON DELETE CASCADE,
  usuario_id      UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  vence_en        TIMESTAMPTZ NOT NULL,  -- evento + 24h
  PRIMARY KEY (evento_id, usuario_id)
);

-- ============================================================
-- XP LOG (historial de XP ganado/perdido)
-- ============================================================
CREATE TABLE IF NOT EXISTS xp_log (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id  UUID        REFERENCES usuarios(id) ON DELETE CASCADE,
  cantidad    INTEGER     NOT NULL,   -- positivo o negativo
  motivo      VARCHAR(80) NOT NULL,
  referencia_id UUID,                 -- evento_id, torneo_id, etc.
  fecha       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- RANKING
-- ============================================================
CREATE TABLE IF NOT EXISTS ranking (
  usuario_id  UUID        PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
  puntos      INTEGER     DEFAULT 0,
  posicion    INTEGER,
  victorias   INTEGER     DEFAULT 0,
  derrotas    INTEGER     DEFAULT 0,
  empates     INTEGER     DEFAULT 0,
  actualizado TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ranking_puntos ON ranking(puntos DESC);

-- ============================================================
-- EQUIPOS
-- ============================================================
CREATE TABLE IF NOT EXISTS equipos (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre          VARCHAR(80) UNIQUE NOT NULL,
  escudo_url      TEXT,
  deporte         VARCHAR(50) DEFAULT 'futbol',
  ciudad          VARCHAR(80),
  capitan_id      UUID        REFERENCES usuarios(id),
  wins            INTEGER     DEFAULT 0,
  losses          INTEGER     DEFAULT 0,
  draws           INTEGER     DEFAULT 0,
  estado          VARCHAR(20) DEFAULT 'activo',
  fecha_creacion  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS equipo_miembros (
  equipo_id   UUID REFERENCES equipos(id) ON DELETE CASCADE,
  usuario_id  UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  rol         VARCHAR(20) DEFAULT 'jugador' CHECK (rol IN ('capitan','jugador')),
  fecha       TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (equipo_id, usuario_id)
);

-- ============================================================
-- TORNEOS
-- ============================================================
CREATE TABLE IF NOT EXISTS torneos (
  id                  UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizador_id      UUID         NOT NULL REFERENCES usuarios(id),
  nombre              VARCHAR(120) NOT NULL,
  descripcion         TEXT,
  deporte             VARCHAR(50)  NOT NULL DEFAULT 'futbol',
  foto_url            TEXT,
  ciudad              VARCHAR(80),
  latitud             NUMERIC(10,7),
  longitud            NUMERIC(10,7),
  fecha_inicio        DATE         NOT NULL,
  fecha_fin           DATE,
  tipo                VARCHAR(20)  DEFAULT 'multi_fecha' CHECK (tipo IN ('relampago','multi_fecha')),
  max_equipos         INTEGER      DEFAULT 8,
  premio              TEXT,
  precio_inscripcion  NUMERIC(8,2) DEFAULT 0,
  formato             VARCHAR(20)  DEFAULT 'eliminacion' CHECK (formato IN ('eliminacion','grupos','liga')),
  reglas              TEXT,
  banner_url          TEXT,
  estado              VARCHAR(20)  DEFAULT 'pendiente' CHECK (estado IN ('pendiente','aprobado','activo','finalizado','cancelado')),
  aprobado_por        UUID         REFERENCES admins(id),
  fecha_creacion      TIMESTAMPTZ  DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS torneo_equipos (
  torneo_id   UUID REFERENCES torneos(id) ON DELETE CASCADE,
  equipo_id   UUID REFERENCES equipos(id) ON DELETE CASCADE,
  estado      VARCHAR(20) DEFAULT 'inscrito',
  fecha       TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (torneo_id, equipo_id)
);

CREATE TABLE IF NOT EXISTS partidos (
  id                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  torneo_id         UUID        REFERENCES torneos(id),
  equipo_local_id   UUID        REFERENCES equipos(id),
  equipo_visita_id  UUID        REFERENCES equipos(id),
  goles_local       INTEGER,
  goles_visita      INTEGER,
  fecha             TIMESTAMPTZ,
  ronda             VARCHAR(30),
  estado            VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente','en_curso','finalizado')),
  fecha_creacion    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- RETOS (equipo vs equipo)
-- ============================================================
CREATE TABLE IF NOT EXISTS retos (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  retador_id    UUID        REFERENCES equipos(id),
  retado_id     UUID        REFERENCES equipos(id),
  evento_id     UUID        REFERENCES eventos(id),
  estado        VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente','aceptado','rechazado','finalizado')),
  fecha         TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PUBLICACIONES (feed social)
-- ============================================================
CREATE TABLE IF NOT EXISTS publicaciones (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id  UUID        NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  contenido   TEXT,
  imagen_url  TEXT,
  evento_id   UUID        REFERENCES eventos(id),
  deporte     VARCHAR(50),
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
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id    UUID        NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo          VARCHAR(50) NOT NULL,
  mensaje       TEXT        NOT NULL,
  leida         BOOLEAN     DEFAULT false,
  referencia_id UUID,
  fecha         TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- REPORTES Y SANCIONES
-- ============================================================
CREATE TABLE IF NOT EXISTS reportes (
  id             UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  reportador_id  UUID         REFERENCES usuarios(id) ON DELETE SET NULL,
  reportado_id   UUID         REFERENCES usuarios(id) ON DELETE CASCADE,
  evento_id      UUID         REFERENCES eventos(id)  ON DELETE SET NULL,
  motivo         VARCHAR(100) NOT NULL,
  descripcion    TEXT,
  estado         VARCHAR(20)  DEFAULT 'pendiente' CHECK (estado IN ('pendiente','revisado','resuelto','desestimado')),
  fecha          TIMESTAMPTZ  DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sanciones (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id    UUID        REFERENCES usuarios(id),
  evento_id     UUID        REFERENCES eventos(id),
  motivo        VARCHAR(80) NOT NULL,  -- 'no_show','no_calificacion','agresivo'
  xp_penalidad  INTEGER     DEFAULT 0,
  dias_suspension INTEGER   DEFAULT 0,
  activa        BOOLEAN     DEFAULT true,
  admin_id      UUID,
  fecha         TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PUBLICIDAD
-- ============================================================
CREATE TABLE IF NOT EXISTS anuncios (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo        VARCHAR(120),
  imagen_url    TEXT,
  url_destino   TEXT,
  ciudad        VARCHAR(80),           -- null = todas las ciudades
  activo        BOOLEAN     DEFAULT true,
  impresiones   INTEGER     DEFAULT 0,
  clics         INTEGER     DEFAULT 0,
  fecha_inicio  DATE,
  fecha_fin     DATE,
  fecha_creacion TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ADMIN
-- ============================================================
CREATE TABLE IF NOT EXISTS admins (
  id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  username      VARCHAR(50)  UNIQUE NOT NULL,
  email         VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nombre        VARCHAR(80),
  rol           VARCHAR(20)  DEFAULT 'moderador' CHECK (rol IN ('superadmin','moderador')),
  activo        BOOLEAN      DEFAULT true,
  fecha_creacion TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_eventos_tipo      ON eventos(tipo);
CREATE INDEX IF NOT EXISTS idx_eventos_deporte   ON eventos(deporte);
CREATE INDEX IF NOT EXISTS idx_eventos_fecha     ON eventos(fecha_evento);
CREATE INDEX IF NOT EXISTS idx_eventos_estado    ON eventos(estado);
CREATE INDEX IF NOT EXISTS idx_eventos_latlon    ON eventos(latitud, longitud);
CREATE INDEX IF NOT EXISTS idx_usuarios_ciudad   ON usuarios(ciudad);
CREATE INDEX IF NOT EXISTS idx_usuarios_xp       ON usuarios(xp DESC);
CREATE INDEX IF NOT EXISTS idx_usuarios_puntos   ON usuarios(puntos_ranking DESC);
CREATE INDEX IF NOT EXISTS idx_publicaciones_user ON publicaciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notif_usuario     ON notificaciones(usuario_id, leida);
CREATE INDEX IF NOT EXISTS idx_xp_log_usuario    ON xp_log(usuario_id, fecha DESC);
CREATE INDEX IF NOT EXISTS idx_calif_evento      ON calificaciones(evento_id);
CREATE INDEX IF NOT EXISTS idx_calif_pendientes  ON calificaciones_pendientes(vence_en);

-- ============================================================
-- DATOS INICIALES
-- ============================================================
-- Admin inicial: ejecutar backend/src/db/seed.js con ADMIN_PASSWORD en .env
