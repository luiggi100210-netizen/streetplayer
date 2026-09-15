-- ============================================================
-- INDICES FALTANTES EN COLUMNAS DE LOOKUP FRECUENTE
-- ============================================================
-- seguidores, evento_participantes y equipo_miembros tienen su PK
-- compuesta empezando por la otra columna (ej. PRIMARY KEY (seguidor_id,
-- seguido_id)), asi que un indice compuesto no acelera busquedas por la
-- segunda columna sola — Postgres hace sequential scan en esos casos.

-- Contar seguidores de un usuario (perfil, cada vista)
CREATE INDEX IF NOT EXISTS idx_seguidores_seguido_id ON seguidores(seguido_id);

-- Historial de un usuario, checkTeamPlayer, checkRelampago, checkInfalible
CREATE INDEX IF NOT EXISTS idx_evento_participantes_usuario_id ON evento_participantes(usuario_id);

-- Reputacion de un usuario (calificaciones recibidas)
CREATE INDEX IF NOT EXISTS idx_calificaciones_calificado_id ON calificaciones(calificado_id);

-- Equipos de un usuario
CREATE INDEX IF NOT EXISTS idx_equipo_miembros_usuario_id ON equipo_miembros(usuario_id);

-- Publicaciones vinculadas a un evento
CREATE INDEX IF NOT EXISTS idx_publicaciones_evento_id ON publicaciones(evento_id);
