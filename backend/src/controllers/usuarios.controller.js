const pool = require('../config/database');

// GET /api/usuarios/:id
async function obtenerPerfil(req, res, next) {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      `SELECT
        u.id, u.username, u.nombre, u.apellidos, u.foto_url, u.bio, u.ciudad,
        u.deportes, u.posicion, u.nivel, u.partidos_jugados, u.partidos_ganados,
        u.estado, u.verificado, u.fecha_registro,
        r.puntos, r.posicion AS ranking_posicion, r.victorias, r.derrotas, r.empates,
        (SELECT COUNT(*) FROM seguidores WHERE seguido_id = u.id)   AS seguidores,
        (SELECT COUNT(*) FROM seguidores WHERE seguidor_id = u.id)  AS seguidos,
        (SELECT COUNT(*) FROM evento_participantes ep
         JOIN eventos e ON ep.evento_id = e.id
         WHERE ep.usuario_id = u.id AND e.estado = 'finalizado') AS eventos_jugados
       FROM usuarios u
       LEFT JOIN ranking r ON r.usuario_id = u.id
       WHERE u.id = $1`,
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(rows[0]);
  } catch (err) { next(err); }
}

// PUT /api/usuarios/perfil
async function actualizarPerfil(req, res, next) {
  try {
    const { nombre, apellidos, bio, ciudad, deportes, posicion, nivel, latitud, longitud } = req.body;
    const { rows } = await pool.query(
      `UPDATE usuarios SET
        nombre    = COALESCE($1, nombre),
        apellidos = COALESCE($2, apellidos),
        bio       = COALESCE($3, bio),
        ciudad    = COALESCE($4, ciudad),
        deportes  = COALESCE($5, deportes),
        posicion  = COALESCE($6, posicion),
        nivel     = COALESCE($7, nivel),
        latitud   = COALESCE($8, latitud),
        longitud  = COALESCE($9, longitud)
       WHERE id = $10 RETURNING id, username, nombre, apellidos, bio, ciudad, deportes, posicion, nivel, foto_url`,
      [nombre, apellidos, bio, ciudad, deportes, posicion, nivel, latitud, longitud, req.usuario.id]
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

module.exports = { obtenerPerfil, actualizarPerfil, seguir, buscarUsuarios, publicacionesUsuario };
