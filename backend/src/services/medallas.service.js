const pool = require('../config/database');

// --- Condiciones de desbloqueo ---

async function checkGoleador(id) {
  const { rows } = await pool.query('SELECT goles_totales FROM usuarios WHERE id = $1', [id]);
  return (rows[0]?.goles_totales ?? 0) >= 20;
}

async function checkRelampago(id) {
  const { rows } = await pool.query(
    `SELECT estado FROM evento_participantes WHERE usuario_id = $1 ORDER BY fecha DESC LIMIT 10`, [id]
  );
  return rows.length >= 10 && rows.every(r => r.estado === 'asistio');
}

async function checkCapitan(id) {
  const { rows } = await pool.query(
    `SELECT COUNT(*) AS total FROM eventos WHERE creador_id = $1 AND estado = 'finalizado'`, [id]
  );
  return parseInt(rows[0].total) >= 5;
}

async function checkTeamPlayer(id) {
  const { rows } = await pool.query(
    `SELECT COALESCE(SUM(array_length(tags_positivos, 1)), 0) AS total
     FROM calificaciones WHERE calificado_id = $1 AND array_length(tags_positivos, 1) > 0`, [id]
  );
  return parseInt(rows[0].total) >= 50;
}

async function checkInfalible(id) {
  const { rows } = await pool.query(
    `SELECT COUNT(*) AS total,
            COUNT(*) FILTER (WHERE estado = 'ausente') AS ausentes
     FROM evento_participantes WHERE usuario_id = $1`, [id]
  );
  return parseInt(rows[0].total) >= 20 && parseInt(rows[0].ausentes) === 0;
}

async function checkLeyenda(id) {
  const { rows } = await pool.query(`SELECT nivel_xp FROM usuarios WHERE id = $1`, [id]);
  return rows[0]?.nivel_xp === 'leyenda';
}

async function checkMuralla(id) {
  const { rows: [user] } = await pool.query(`SELECT posicion FROM usuarios WHERE id = $1`, [id]);
  if (user?.posicion !== 'portero') return false;
  const { rows } = await pool.query(
    `SELECT COUNT(*) AS total FROM evento_participantes ep
     JOIN resultados r ON r.evento_id = ep.evento_id
     WHERE ep.usuario_id = $1 AND ep.estado = 'asistio'
       AND ((ep.equipo = 'A' AND r.goles_equipo_b = 0)
         OR (ep.equipo = 'B' AND r.goles_equipo_a = 0))`, [id]
  );
  return parseInt(rows[0].total) >= 10;
}

// campeon: se desbloquea desde el controller de torneos cuando un equipo gana
// se otorga manualmente vía otorgarMedalla('campeon', usuarioId)

const CHECKS = {
  goleador:   checkGoleador,
  relampago:  checkRelampago,
  capitan:    checkCapitan,
  teamplayer: checkTeamPlayer,
  infalible:  checkInfalible,
  leyenda:    checkLeyenda,
  muralla:    checkMuralla,
};

// Verifica todas las medallas automáticas y otorga las nuevas
async function verificarMedallas(usuarioId) {
  const { rows: actuales } = await pool.query(
    'SELECT medalla_id FROM medallas_usuario WHERE usuario_id = $1', [usuarioId]
  );
  const tiene = new Set(actuales.map(r => r.medalla_id));

  for (const [medallaId, check] of Object.entries(CHECKS)) {
    if (tiene.has(medallaId)) continue;
    if (await check(usuarioId)) {
      await pool.query(
        'INSERT INTO medallas_usuario (usuario_id, medalla_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
        [usuarioId, medallaId]
      );
    }
  }
}

// Otorgar medalla específica (ej: campeon, desde torneos)
async function otorgarMedalla(medallaId, usuarioId) {
  await pool.query(
    'INSERT INTO medallas_usuario (usuario_id, medalla_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
    [usuarioId, medallaId]
  );
}

// Devuelve array de IDs de medallas desbloqueadas
async function obtenerMedallas(usuarioId) {
  const { rows } = await pool.query(
    'SELECT medalla_id FROM medallas_usuario WHERE usuario_id = $1 ORDER BY desbloqueada_en ASC',
    [usuarioId]
  );
  return rows.map(r => r.medalla_id);
}

module.exports = { verificarMedallas, otorgarMedalla, obtenerMedallas };
