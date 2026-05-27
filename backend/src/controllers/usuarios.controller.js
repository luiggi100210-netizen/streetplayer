const pool = require('../config/database');

// GET /api/usuarios/:id
async function obtenerPerfil(req, res, next) {
  try {
    const { id } = req.params;
    const yo = req.usuario?.id;
    const { rows } = await pool.query(
      `SELECT
        u.id, u.username, u.nombre, u.apellidos, u.apodo, u.foto_url, u.bio,
        u.ciudad, u.departamento, u.deportes,
        u.posicion, u.pie_dominante, u.formato_preferido,
        u.nivel_xp, u.xp,
        u.partidos_jugados, u.partidos_ganados, u.partidos_empatados, u.partidos_perdidos,
        u.goles_totales, u.asistencias_totales,
        u.tarjetas_amarillas, u.tarjetas_rojas,
        u.suspendido_hasta, u.verificado, u.fecha_registro,
        (SELECT COUNT(*) FROM seguidores WHERE seguido_id = u.id)  AS seguidores,
        (SELECT COUNT(*) FROM seguidores WHERE seguidor_id = u.id) AS siguiendo,
        EXISTS(SELECT 1 FROM seguidores WHERE seguidor_id = $2 AND seguido_id = u.id) AS siguiendo_yo
       FROM usuarios u
       WHERE u.id = $1`,
      [id, yo || null]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(rows[0]);
  } catch (err) { next(err); }
}

// PUT /api/usuarios/perfil
async function actualizarPerfil(req, res, next) {
  try {
    const { nombre, apodo, bio, ciudad, departamento, deportes,
            posicion, pie_dominante, formato_preferido, foto_url } = req.body;
    const { rows } = await pool.query(
      `UPDATE usuarios SET
        nombre            = COALESCE($1,  nombre),
        apodo             = COALESCE($2,  apodo),
        bio               = COALESCE($3,  bio),
        ciudad            = COALESCE($4,  ciudad),
        departamento      = COALESCE($5,  departamento),
        deportes          = COALESCE($6,  deportes),
        posicion          = COALESCE($7,  posicion),
        pie_dominante     = COALESCE($8,  pie_dominante),
        formato_preferido = COALESCE($9,  formato_preferido),
        foto_url          = COALESCE($10, foto_url)
       WHERE id = $11
       RETURNING id, username, nombre, apodo, bio, ciudad, departamento,
                 deportes, posicion, pie_dominante, formato_preferido,
                 nivel_xp, xp, foto_url`,
      [nombre, apodo, bio, ciudad, departamento, deportes,
       posicion, pie_dominante, formato_preferido, foto_url, req.usuario.id]
    );
    res.json(rows[0]);
  } catch (err) { next(err); }
}

// POST /api/usuarios/:id/seguir
async function seguir(req, res, next) {
  try {
    const { id } = req.params;
    if (id === req.usuario.id) return res.status(400).json({ error: 'No puedes seguirte a ti mismo' });

    const { rows: existe } = await pool.query(
      'SELECT 1 FROM seguidores WHERE seguidor_id = $1 AND seguido_id = $2',
      [req.usuario.id, id]
    );

    if (existe.length > 0) {
      await pool.query('DELETE FROM seguidores WHERE seguidor_id = $1 AND seguido_id = $2', [req.usuario.id, id]);
      return res.json({ siguiendo: false });
    }

    await pool.query('INSERT INTO seguidores (seguidor_id, seguido_id) VALUES ($1, $2)', [req.usuario.id, id]);

    // Notificación
    await pool.query(
      `INSERT INTO notificaciones (usuario_id, tipo, mensaje, referencia_id)
       VALUES ($1, 'seguidor', $2, $3)`,
      [id, `${req.usuario.username} comenzó a seguirte`, req.usuario.id]
    );

    res.json({ siguiendo: true });
  } catch (err) { next(err); }
}

// GET /api/usuarios/buscar?q=
async function buscarUsuarios(req, res, next) {
  try {
    const { q, deporte, ciudad } = req.query;
    let query = `SELECT u.id, u.username, u.nombre, u.foto_url, u.nivel, u.deportes, u.ciudad,
                        r.puntos, r.posicion AS ranking_posicion
                 FROM usuarios u LEFT JOIN ranking r ON r.usuario_id = u.id
                 WHERE u.estado = 'activo'`;
    const params = [];
    let idx = 1;

    if (q) {
      query += ` AND (LOWER(u.username) LIKE $${idx} OR LOWER(u.nombre) LIKE $${idx})`;
      params.push(`%${q.toLowerCase()}%`); idx++;
    }
    if (deporte) {
      query += ` AND $${idx} = ANY(u.deportes)`;
      params.push(deporte); idx++;
    }
    if (ciudad) {
      query += ` AND LOWER(u.ciudad) LIKE $${idx}`;
      params.push(`%${ciudad.toLowerCase()}%`); idx++;
    }
    query += ' ORDER BY r.puntos DESC NULLS LAST LIMIT 30';

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) { next(err); }
}

// GET /api/usuarios/:id/publicaciones
async function publicacionesUsuario(req, res, next) {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      `SELECT p.*, u.username, u.nombre, u.foto_url,
              (SELECT COUNT(*) FROM publicacion_likes WHERE publicacion_id = p.id) AS total_likes,
              (SELECT COUNT(*) FROM comentarios WHERE publicacion_id = p.id) AS total_comentarios,
              EXISTS(SELECT 1 FROM publicacion_likes WHERE publicacion_id = p.id AND usuario_id = $2) AS yo_di_like
       FROM publicaciones p JOIN usuarios u ON p.usuario_id = u.id
       WHERE p.usuario_id = $1
       ORDER BY p.fecha DESC LIMIT 20`,
      [id, req.usuario.id]
    );
    res.json(rows);
  } catch (err) { next(err); }
}

// GET /api/usuarios/:id/historial
async function historialUsuario(req, res, next) {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      `SELECT
        e.id, e.titulo, e.fecha, e.tipo, e.deporte,
        ep.resultado, ep.asistio,
        COALESCE(js.goles, 0)       AS goles,
        COALESCE(js.asistencias, 0) AS asistencias,
        COALESCE(js.calificacion_promedio, 0) AS calificacion,
        js.tarjeta_amarilla, js.tarjeta_roja
       FROM evento_participantes ep
       JOIN eventos e ON e.id = ep.evento_id
       LEFT JOIN jugador_stats js ON js.evento_id = e.id AND js.usuario_id = ep.usuario_id
       WHERE ep.usuario_id = $1
         AND e.estado = 'finalizado'
         AND ep.asistio = TRUE
       ORDER BY e.fecha DESC
       LIMIT 20`,
      [id]
    );
    res.json(rows);
  } catch (err) { next(err); }
}

// GET /api/usuarios/:id/reputacion
async function reputacionUsuario(req, res, next) {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      `SELECT
        tag, COUNT(*) AS total, tipo
       FROM (
         SELECT unnest(tags_positivos) AS tag, 'positivo' AS tipo
           FROM calificaciones WHERE calificado_id = $1
         UNION ALL
         SELECT unnest(tags_negativos) AS tag, 'negativo' AS tipo
           FROM calificaciones WHERE calificado_id = $1
       ) t
       GROUP BY tag, tipo
       ORDER BY total DESC`,
      [id]
    );
    const positivos = rows.filter(r => r.tipo === 'positivo');
    const negativos = rows.filter(r => r.tipo === 'negativo');
    const { rows: stats } = await pool.query(
      `SELECT ROUND(AVG(estrellas), 1) AS promedio_estrellas, COUNT(*) AS total_calificaciones
       FROM calificaciones WHERE calificado_id = $1`,
      [id]
    );
    res.json({ positivos, negativos, ...stats[0] });
  } catch (err) { next(err); }
}

module.exports = { obtenerPerfil, actualizarPerfil, seguir, buscarUsuarios, publicacionesUsuario, historialUsuario, reputacionUsuario };
