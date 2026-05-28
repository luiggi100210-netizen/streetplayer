const pool         = require('../config/database');
const asyncHandler = require('../middleware/asyncHandler');

// GET /api/ranking?deporte=fútbol&ciudad=Lima
const obtenerRanking = asyncHandler(async (req, res) => {
  const { deporte, ciudad, page = 1 } = req.query;
  const limit  = 50;
  const offset = (page - 1) * limit;

  let query = `
    SELECT
      r.posicion, r.puntos, r.victorias, r.derrotas, r.empates,
      u.id, u.username, u.nombre, u.foto_url, u.nivel, u.ciudad,
      u.deportes, u.partidos_jugados, u.partidos_ganados
    FROM ranking r
    JOIN usuarios u ON r.usuario_id = u.id
    WHERE u.estado = 'activo'
  `;
  const params = [];
  let idx = 1;

  if (deporte) {
    query += ` AND $${idx++} = ANY(u.deportes)`;
    params.push(deporte);
  }
  if (ciudad) {
    query += ` AND LOWER(u.ciudad) LIKE $${idx++}`;
    params.push(`%${ciudad.toLowerCase()}%`);
  }

  query += ` ORDER BY r.puntos DESC NULLS LAST LIMIT $${idx++} OFFSET $${idx++}`;
  params.push(limit, offset);

  const { rows } = await pool.query(query, params);
  const data = rows.map((r, i) => ({ ...r, posicion: offset + i + 1 }));
  res.json(data);
});

// POST /api/ranking/actualizar — (interno, llamado tras partido)
async function actualizarPuntos(usuarioId, resultado) {
  const puntos = resultado === 'victoria' ? 3 : resultado === 'empate' ? 1 : 0;
  await pool.query(
    `UPDATE ranking SET
      puntos    = puntos + $1,
      victorias = victorias + $2,
      derrotas  = derrotas  + $3,
      empates   = empates   + $4,
      actualizado = NOW()
     WHERE usuario_id = $5`,
    [
      puntos,
      resultado === 'victoria' ? 1 : 0,
      resultado === 'derrota'  ? 1 : 0,
      resultado === 'empate'   ? 1 : 0,
      usuarioId,
    ]
  );
  await pool.query(`
    UPDATE ranking r
    SET posicion = sub.rn
    FROM (
      SELECT usuario_id, ROW_NUMBER() OVER (ORDER BY puntos DESC) AS rn
      FROM ranking
    ) sub
    WHERE r.usuario_id = sub.usuario_id
  `);
}

module.exports = { obtenerRanking, actualizarPuntos };
