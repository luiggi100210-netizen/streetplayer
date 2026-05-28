const pool         = require('../config/database');
const asyncHandler = require('../middleware/asyncHandler');

// GET /api/feed
const obtenerFeed = asyncHandler(async (req, res) => {
  const { page = 1 } = req.query;
  const limit  = 15;
  const offset = (page - 1) * limit;

  const { rows } = await pool.query(
    `SELECT p.*,
      u.username, u.nombre, u.foto_url, u.verificado, u.nivel_xp,
      (SELECT COUNT(*) FROM publicacion_likes WHERE publicacion_id = p.id) AS total_likes,
      (SELECT COUNT(*) FROM comentarios WHERE publicacion_id = p.id) AS total_comentarios,
      EXISTS(SELECT 1 FROM publicacion_likes WHERE publicacion_id = p.id AND usuario_id = $1) AS yo_di_like,
      e.titulo AS evento_titulo, e.deporte AS evento_deporte, e.fecha_evento
     FROM publicaciones p
     JOIN usuarios u ON p.usuario_id = u.id
     LEFT JOIN eventos e ON p.evento_id = e.id
     WHERE p.usuario_id = $1
        OR p.usuario_id IN (SELECT seguido_id FROM seguidores WHERE seguidor_id = $1)
     ORDER BY p.fecha DESC
     LIMIT $2 OFFSET $3`,
    [req.usuario.id, limit, offset]
  );
  res.json(rows);
});

// POST /api/feed
const crearPublicacion = asyncHandler(async (req, res) => {
  const { contenido, foto_url, evento_id } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO publicaciones (usuario_id, contenido, foto_url, evento_id)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [req.usuario.id, contenido || null, foto_url || null, evento_id || null]
  );
  res.status(201).json(rows[0]);
});

// POST /api/feed/:id/like
const toggleLike = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows: existe } = await pool.query(
    'SELECT 1 FROM publicacion_likes WHERE publicacion_id = $1 AND usuario_id = $2',
    [id, req.usuario.id]
  );
  if (existe.length > 0) {
    await pool.query('DELETE FROM publicacion_likes WHERE publicacion_id = $1 AND usuario_id = $2', [id, req.usuario.id]);
    await pool.query('UPDATE publicaciones SET likes = GREATEST(0, likes - 1) WHERE id = $1', [id]);
    return res.json({ like: false });
  }
  await pool.query('INSERT INTO publicacion_likes (publicacion_id, usuario_id) VALUES ($1, $2)', [id, req.usuario.id]);
  await pool.query('UPDATE publicaciones SET likes = likes + 1 WHERE id = $1', [id]);
  res.json({ like: true });
});

// GET /api/feed/:id/comentarios
const obtenerComentarios = asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT c.*, u.username, u.nombre, u.foto_url
     FROM comentarios c JOIN usuarios u ON c.usuario_id = u.id
     WHERE c.publicacion_id = $1 ORDER BY c.fecha ASC`,
    [req.params.id]
  );
  res.json(rows);
});

// POST /api/feed/:id/comentarios
const agregarComentario = asyncHandler(async (req, res) => {
  const { contenido } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO comentarios (publicacion_id, usuario_id, contenido)
     VALUES ($1, $2, $3) RETURNING *`,
    [req.params.id, req.usuario.id, contenido.trim()]
  );
  res.status(201).json(rows[0]);
});

module.exports = { obtenerFeed, crearPublicacion, toggleLike, obtenerComentarios, agregarComentario };
