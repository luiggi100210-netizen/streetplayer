# StreetPlayer — Modelo de Datos

## Diagrama de relaciones

```
usuarios ──< seguidores (seguidor_id / seguido_id)
usuarios ──< eventos (creador_id)
usuarios ──< evento_participantes >── eventos
usuarios ──< jugador_stats >── eventos
usuarios ──< calificaciones (calificador_id / calificado_id) >── eventos
usuarios ──< xp_log
usuarios ──── ranking (1:1)
usuarios ──< publicaciones ──< publicacion_likes >── usuarios
                            ──< comentarios >── usuarios
usuarios ──< notificaciones
usuarios ──< reportes (reportado_por / usuario_id)
usuarios ──< sanciones
usuarios ──< medallas_usuario

equipos ──< equipo_miembros >── usuarios
equipos ──< retos (retador_id / retado_id)
equipos ──< torneo_equipos >── torneos ──< partidos
equipos ──< partidos (equipo_local_id / equipo_visita_id)

resultados ──── eventos (1:1)
admins ──< torneos (aprobado_por)
```

---

## Tablas

### `usuarios`
Jugador registrado en la plataforma.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | UUID PK | Identificador único |
| `firebase_uid` | VARCHAR(128) UNIQUE | UID de Firebase Auth (null si usa email) |
| `username` | VARCHAR(30) UNIQUE | Nombre de usuario público |
| `email` | VARCHAR(100) UNIQUE | Correo electrónico |
| `password_hash` | VARCHAR(255) | Hash bcrypt (null si usa Firebase) |
| `nombre` | VARCHAR(80) | Nombre real |
| `apodo` | VARCHAR(50) | Apodo en cancha |
| `foto_url` | TEXT | URL de foto de perfil |
| `bio` | TEXT | Descripción libre |
| `pais` | VARCHAR(50) | País (default: Peru) |
| `departamento` | VARCHAR(80) | Departamento/estado |
| `ciudad` | VARCHAR(80) | Ciudad |
| `distrito` | VARCHAR(80) | Distrito/barrio |
| `latitud` / `longitud` | NUMERIC(10,7) | Coordenadas del jugador |
| `deportes` | TEXT[] | Array de deportes que practica |
| `posicion` | VARCHAR(30) | portero / defensa / mediocampista / delantero |
| `pie_dominante` | VARCHAR(10) | derecho / izquierdo / ambos |
| `formato_preferido` | INTEGER | 5 / 7 / 8 / 9 / 10 / 11 |
| `rol` | VARCHAR(20) | jugador / capitan / organizador / admin |
| `xp` | INTEGER | Puntos de experiencia acumulados |
| `nivel_xp` | VARCHAR(20) | rookie → amateur → intermedio → avanzado → pro → elite → leyenda |
| `puntos_ranking` | INTEGER | Puntos para el ranking global |
| `partidos_jugados` | INTEGER | Estadística acumulada |
| `partidos_ganados` | INTEGER | Estadística acumulada |
| `partidos_empatados` | INTEGER | Estadística acumulada |
| `partidos_perdidos` | INTEGER | Estadística acumulada |
| `goles_totales` | INTEGER | Goles en toda la carrera |
| `asistencias_totales` | INTEGER | Asistencias en toda la carrera |
| `tarjetas_amarillas` | INTEGER | Acumulado de amarillas |
| `tarjetas_rojas` | INTEGER | Acumulado de rojas |
| `suspendido_hasta` | TIMESTAMPTZ | Fecha fin de suspensión activa |
| `estado` | VARCHAR(20) | activo / suspendido / baneado |
| `verificado` | BOOLEAN | Perfil verificado por admin |
| `auth_provider` | VARCHAR(20) | email / google / facebook |
| `fecha_registro` | TIMESTAMPTZ | Fecha de creación de cuenta |
| `ultimo_acceso` | TIMESTAMPTZ | Último login |

---

### `seguidores`
Relación de seguimiento entre usuarios (red social).

| Columna | Tipo | Descripción |
|---|---|---|
| `seguidor_id` | UUID FK → usuarios | Quien sigue |
| `seguido_id` | UUID FK → usuarios | A quien se sigue |
| `fecha` | TIMESTAMPTZ | Cuándo empezó a seguir |

PK compuesta: `(seguidor_id, seguido_id)`

---

### `eventos`
Partidos, pichangas o retos organizados por un usuario.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | UUID PK | Identificador único |
| `creador_id` | UUID FK → usuarios | Organizador del evento |
| `titulo` | VARCHAR(120) | Título del evento |
| `tipo` | VARCHAR(20) | pichanga / reto / campeonato |
| `deporte` | VARCHAR(50) | Deporte del evento |
| `nivel` | VARCHAR(20) | Nivel mínimo requerido |
| `nombre_cancha` | VARCHAR(120) | Nombre de la cancha |
| `direccion` | TEXT | Dirección del evento |
| `latitud` / `longitud` | NUMERIC(10,7) | Coordenadas de la cancha |
| `fecha_evento` | TIMESTAMPTZ | Fecha y hora del partido |
| `duracion_min` | INTEGER | Duración en minutos (default: 90) |
| `formato` | INTEGER | 5v5 / 7v7 / 11v11, etc. |
| `cupos_total` | INTEGER | Cupos disponibles |
| `cupos_ocupados` | INTEGER | Cupos tomados |
| `precio` | NUMERIC(8,2) | Precio de inscripción |
| `es_privado` | BOOLEAN | Si requiere código de invitación |
| `codigo_invitacion` | VARCHAR(12) | Código para eventos privados |
| `link_whatsapp` | TEXT | Link al grupo de WhatsApp |
| `estado` | VARCHAR(20) | abierto / lleno / en_curso / finalizado / cancelado |
| `calificaciones_completadas` | BOOLEAN | Si ya se procesaron las calificaciones |

---

### `evento_participantes`
Jugadores inscritos en un evento, con su equipo (A o B) y estado de asistencia.

| Columna | Tipo | Descripción |
|---|---|---|
| `evento_id` | UUID FK → eventos | |
| `usuario_id` | UUID FK → usuarios | |
| `equipo` | VARCHAR(1) | A o B |
| `estado` | VARCHAR(20) | confirmado / pendiente / cancelado / asistio / ausente |

PK compuesta: `(evento_id, usuario_id)`

---

### `resultados`
Resultado final de un evento (1:1 con evento).

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | UUID PK | |
| `evento_id` | UUID UNIQUE FK → eventos | |
| `goles_equipo_a` | INTEGER | Goles del equipo A |
| `goles_equipo_b` | INTEGER | Goles del equipo B |
| `resultado` | VARCHAR(10) | equipo_a / equipo_b / empate |
| `registrado_por` | UUID FK → usuarios | Quién cargó el resultado |

---

### `jugador_stats`
Estadísticas individuales de un jugador en un partido específico.

| Columna | Tipo | Descripción |
|---|---|---|
| `evento_id` | UUID FK → eventos | |
| `usuario_id` | UUID FK → usuarios | |
| `goles` | INTEGER | |
| `asistencias` | INTEGER | |
| `tarjetas_amarillas` | INTEGER | |
| `tarjetas_rojas` | INTEGER | |
| `calificacion_promedio` | NUMERIC(3,2) | Promedio de estrellas recibidas en ese partido |

UNIQUE: `(evento_id, usuario_id)`

---

### `calificaciones`
Calificación de un jugador por otro tras un partido.

| Columna | Tipo | Descripción |
|---|---|---|
| `evento_id` | UUID FK → eventos | Partido donde se califica |
| `calificador_id` | UUID FK → usuarios | Quien califica |
| `calificado_id` | UUID FK → usuarios | Quien recibe la calificación |
| `estrellas` | INTEGER | 1 a 5 |
| `tags_positivos` | TEXT[] | ej: ["buen_companero", "tecnico"] |
| `tags_negativos` | TEXT[] | ej: ["agresivo", "no_se_presento"] |

UNIQUE: `(evento_id, calificador_id, calificado_id)`

### `calificaciones_pendientes`
Cola de calificaciones que el jugador aún debe completar (se elimina al calificar).

| Columna | Tipo | Descripción |
|---|---|---|
| `evento_id` | UUID FK → eventos | |
| `usuario_id` | UUID FK → usuarios | Quien tiene pendiente calificar |
| `vence_en` | TIMESTAMPTZ | fecha_evento + 24h |

---

### `xp_log`
Historial de cada ganancia o pérdida de XP.

| Columna | Tipo | Descripción |
|---|---|---|
| `usuario_id` | UUID FK → usuarios | |
| `cantidad` | INTEGER | Positivo o negativo |
| `motivo` | VARCHAR(80) | asistir_pichanga / ganar_partido / no_asistir / etc. |
| `referencia_id` | UUID | ID del evento o torneo relacionado |

**Motivos y XP:**
| Motivo | XP |
|---|---|
| asistir_pichanga | +10 |
| ganar_partido | +20 |
| empatar | +8 |
| crear_evento | +15 |
| calificar_jugadores | +5 |
| buena_calificacion | +10 |
| perfil_completo | +20 |
| inscribir_torneo | +25 |
| ganar_torneo | +100 |
| invitar_amigo | +30 |
| no_asistir | -15 |
| no_calificar | -10 |

---

### `ranking`
Puntos y posición global de cada jugador. Se crea una fila por usuario al registrarse y se actualiza tras cada partido.

| Columna | Tipo | Descripción |
|---|---|---|
| `usuario_id` | UUID PK FK → usuarios | Un registro por jugador |
| `puntos` | INTEGER | Puntos acumulados (victoria +3, empate +1, derrota +0) |
| `posicion` | INTEGER | Posición calculada por `ROW_NUMBER() OVER (ORDER BY puntos DESC)` |
| `victorias` | INTEGER | Total de victorias |
| `derrotas` | INTEGER | Total de derrotas |
| `empates` | INTEGER | Total de empates |
| `actualizado` | TIMESTAMPTZ | Última vez que se recalculó |

> **Nota:** esta tabla no está en `schema.sql` — debe añadirse. DDL sugerido:
> ```sql
> CREATE TABLE IF NOT EXISTS ranking (
>   usuario_id  UUID PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
>   puntos      INTEGER     DEFAULT 0,
>   posicion    INTEGER,
>   victorias   INTEGER     DEFAULT 0,
>   derrotas    INTEGER     DEFAULT 0,
>   empates     INTEGER     DEFAULT 0,
>   actualizado TIMESTAMPTZ DEFAULT NOW()
> );
> CREATE INDEX IF NOT EXISTS idx_ranking_puntos ON ranking(puntos DESC);
> ```

---

### `equipos`
Equipo permanente con capitán y registro de victorias.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | UUID PK | |
| `nombre` | VARCHAR(80) UNIQUE | Nombre del equipo |
| `escudo_url` | TEXT | URL del escudo |
| `deporte` | VARCHAR(50) | Deporte principal |
| `ciudad` | VARCHAR(80) | Ciudad base |
| `capitan_id` | UUID FK → usuarios | Capitán actual |
| `wins` | INTEGER | Victorias totales |
| `losses` | INTEGER | Derrotas totales |
| `draws` | INTEGER | Empates totales |
| `estado` | VARCHAR(20) | activo / disuelto |

### `equipo_miembros`
Relación jugador ↔ equipo con su rol.

| Columna | Tipo | Descripción |
|---|---|---|
| `equipo_id` | UUID FK → equipos | |
| `usuario_id` | UUID FK → usuarios | |
| `rol` | VARCHAR(20) | capitan / jugador |

PK compuesta: `(equipo_id, usuario_id)`

---

### `retos`
Desafío de un equipo a otro.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | UUID PK | |
| `retador_id` | UUID FK → equipos | Equipo que reta |
| `retado_id` | UUID FK → equipos | Equipo retado |
| `evento_id` | UUID FK → eventos | Evento generado al aceptar (opcional) |
| `estado` | VARCHAR(20) | pendiente / aceptado / rechazado / finalizado |

---

### `torneos`
Competencia organizada y aprobada por un admin.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | UUID PK | |
| `organizador_id` | UUID FK → usuarios | |
| `nombre` | VARCHAR(120) | |
| `deporte` | VARCHAR(50) | |
| `ciudad` | VARCHAR(80) | |
| `fecha_inicio` / `fecha_fin` | DATE | |
| `tipo` | VARCHAR(20) | relampago / multi_fecha |
| `max_equipos` | INTEGER | |
| `premio` | TEXT | Descripción del premio |
| `precio_inscripcion` | NUMERIC(8,2) | |
| `formato` | VARCHAR(20) | eliminacion / grupos / liga |
| `estado` | VARCHAR(20) | pendiente / aprobado / activo / finalizado / cancelado |
| `aprobado_por` | UUID FK → admins | Admin que aprobó |

### `torneo_equipos`
Equipos inscritos en un torneo.

| Columna | Tipo | Descripción |
|---|---|---|
| `torneo_id` | UUID FK → torneos | |
| `equipo_id` | UUID FK → equipos | |
| `estado` | VARCHAR(20) | inscrito / eliminado / campeon |

### `partidos`
Partidos dentro de un torneo.

| Columna | Tipo | Descripción |
|---|---|---|
| `torneo_id` | UUID FK → torneos | |
| `equipo_local_id` | UUID FK → equipos | |
| `equipo_visita_id` | UUID FK → equipos | |
| `goles_local` / `goles_visita` | INTEGER | Resultado |
| `ronda` | VARCHAR(30) | "Octavos", "Semifinal", "Final", etc. |
| `estado` | VARCHAR(20) | pendiente / en_curso / finalizado |

---

### `publicaciones`
Posts en el feed social del usuario.

| Columna | Tipo | Descripción |
|---|---|---|
| `usuario_id` | UUID FK → usuarios | Autor |
| `contenido` | TEXT | Texto (opcional si hay imagen) |
| `imagen_url` | TEXT | URL de imagen (opcional) |
| `evento_id` | UUID FK → eventos | Evento relacionado (opcional) |
| `deporte` | VARCHAR(50) | Para filtrar por deporte |

### `publicacion_likes` / `comentarios`
Likes y comentarios sobre publicaciones. PK compuesto en likes: `(publicacion_id, usuario_id)`.

---

### `notificaciones`
Avisos en tiempo real para el usuario (también emitidos por Socket.io).

| Columna | Tipo | Descripción |
|---|---|---|
| `usuario_id` | UUID FK → usuarios | Destinatario |
| `tipo` | VARCHAR(50) | seguidor / evento / calificacion / xp / torneo / reto / sancion / sistema |
| `mensaje` | TEXT | Texto de la notificación |
| `leida` | BOOLEAN | false por defecto |
| `referencia_id` | UUID | ID del objeto relacionado |

---

### `medallas_usuario`
Medallas desbloqueadas por el usuario (migración: `db/medallas_migration.sql`).

| Columna | Tipo | Descripción |
|---|---|---|
| `usuario_id` | UUID FK → usuarios | |
| `medalla_id` | VARCHAR(30) | Identificador de la medalla |
| `desbloqueada_en` | TIMESTAMPTZ | Fecha de desbloqueo |

PK compuesta: `(usuario_id, medalla_id)`

**Medallas disponibles:**
| ID | Condición |
|---|---|
| `goleador` | 20+ goles totales |
| `relampago` | 10 eventos consecutivos con asistencia |
| `capitan` | 5+ eventos creados y finalizados |
| `teamplayer` | 50+ tags positivos recibidos |
| `infalible` | 20+ eventos sin ninguna ausencia |
| `leyenda` | Alcanzar nivel_xp = 'leyenda' |
| `muralla` | Portero con 10+ partidos sin goles en contra |
| `campeon` | Ganar un torneo oficial (se otorga manualmente) |

---

### `reportes`
Denuncias de usuarios contra otros jugadores.

| Columna | Tipo | Descripción |
|---|---|---|
| `reportado_por` | UUID FK → usuarios | Quien reporta (= `reportador_id` en controller) |
| `usuario_id` | UUID FK → usuarios | Reportado (= `reportado_id` en controller) |
| `evento_id` | UUID FK → eventos | Evento donde ocurrió (opcional) |
| `motivo` | VARCHAR(100) | |
| `descripcion` | TEXT | Detalle adicional |
| `estado` | VARCHAR(20) | pendiente / revisado / resuelto / desestimado |

### `sanciones`
Sanciones aplicadas por admins o automáticamente (cron).

| Columna | Tipo | Descripción |
|---|---|---|
| `usuario_id` | UUID FK → usuarios | Sancionado |
| `motivo` | VARCHAR(80) | no_show / no_calificacion / agresivo |
| `xp_penalidad` | INTEGER | XP restado |
| `dias_suspension` | INTEGER | Días de suspensión |
| `activa` | BOOLEAN | Si la sanción sigue vigente |
| `admin_id` | UUID | Admin que aplicó (null = automática) |

---

### `admins`
Panel de administración.

| Columna | Tipo | Descripción |
|---|---|---|
| `username` | VARCHAR(50) UNIQUE | |
| `email` | VARCHAR(100) UNIQUE | |
| `password_hash` | VARCHAR(255) | Hash bcrypt (seed desde ADMIN_PASSWORD en .env) |
| `rol` | VARCHAR(20) | superadmin / moderador |
| `activo` | BOOLEAN | Si puede iniciar sesión |

---

### `anuncios`
Publicidad contextual (por ciudad o global).

| Columna | Tipo | Descripción |
|---|---|---|
| `titulo` | VARCHAR(120) | |
| `imagen_url` | TEXT | Banner |
| `url_destino` | TEXT | URL al hacer clic |
| `ciudad` | VARCHAR(80) | null = todas las ciudades |
| `activo` | BOOLEAN | |
| `impresiones` | INTEGER | Conteo de vistas |
| `clics` | INTEGER | Conteo de clics |
| `fecha_inicio` / `fecha_fin` | DATE | Vigencia del anuncio |

---

## Niveles de XP

| Nivel | XP mínimo |
|---|---|
| rookie | 0 |
| amateur | 100 |
| intermedio | 300 |
| avanzado | 600 |
| pro | 1,000 |
| elite | 2,000 |
| leyenda | 5,000 |

---

## Índices creados

| Índice | Tabla | Columnas |
|---|---|---|
| idx_eventos_tipo | eventos | tipo |
| idx_eventos_deporte | eventos | deporte |
| idx_eventos_fecha | eventos | fecha_evento |
| idx_eventos_estado | eventos | estado |
| idx_eventos_latlon | eventos | latitud, longitud |
| idx_usuarios_ciudad | usuarios | ciudad |
| idx_usuarios_xp | usuarios | xp DESC |
| idx_usuarios_puntos | usuarios | puntos_ranking DESC |
| idx_publicaciones_user | publicaciones | usuario_id |
| idx_notif_usuario | notificaciones | usuario_id, leida |
| idx_xp_log_usuario | xp_log | usuario_id, fecha DESC |
| idx_calif_evento | calificaciones | evento_id |
| idx_calif_pendientes | calificaciones_pendientes | vence_en |
| idx_medallas_usuario | medallas_usuario | usuario_id |
