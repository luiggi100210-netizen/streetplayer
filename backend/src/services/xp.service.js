const pool = require('../config/database');
const { verificarMedallas } = require('./medallas.service');

const XP_TABLA = {
  asistir_pichanga:     10,
  ganar_partido:        20,
  empatar:               8,
  crear_evento:         15,
  calificar_jugadores:   5,
  buena_calificacion:   10,
  perfil_completo:      20,
  inscribir_torneo:     25,
  ganar_torneo:        100,
  invitar_amigo:        30,
  mvp_partido:          30,
  // Negativos
  no_asistir:          -15,
  no_calificar:        -10,
  cancelar_evento:     -20,   // creador cancela el evento
  evento_no_realizado: -10,   // jugador inscripto en evento cancelado
};

const NIVELES = [
  { nombre: 'rookie',      min: 0    },
  { nombre: 'amateur',     min: 100  },
  { nombre: 'intermedio',  min: 300  },
  { nombre: 'avanzado',    min: 600  },
  { nombre: 'pro',         min: 1000 },
  { nombre: 'elite',       min: 2000 },
  { nombre: 'leyenda',     min: 5000 },
];

function _encontrarNivel(xp) {
  let actual = NIVELES[0];
  let siguiente = NIVELES[1] ?? null;
  for (let i = 0; i < NIVELES.length; i++) {
    if (xp >= NIVELES[i].min) {
      actual    = NIVELES[i];
      siguiente = NIVELES[i + 1] ?? null;
    } else {
      break;
    }
  }
  return { actual, siguiente };
}

function calcularNivel(xp) {
  return _encontrarNivel(xp).actual.nombre;
}

function calcularProgreso(xp) {
  const { actual, siguiente } = _encontrarNivel(xp);
  const progreso = siguiente
    ? Math.round(((xp - actual.min) / (siguiente.min - actual.min)) * 100)
    : 100;
  return { nivel: actual.nombre, siguiente: siguiente?.nombre ?? null, progreso, xpSiguiente: siguiente?.min ?? null };
}

/**
 * Otorga (o resta) XP de forma atómica.
 * Si recibe un `client`, participa en la transacción del llamador
 * (sin BEGIN/COMMIT propios); si no, gestiona la suya.
 */
async function darXP(usuarioId, motivo, referenciaId = null, client = null) {
  const cantidad = XP_TABLA[motivo];
  if (cantidad === undefined) throw new Error(`Motivo XP desconocido: ${motivo}`);

  const txPropia = !client;
  const db = client ?? await pool.connect();
  try {
    if (txPropia) await db.query('BEGIN');

    await db.query(
      'INSERT INTO xp_log (usuario_id, cantidad, motivo, referencia_id) VALUES ($1,$2,$3,$4)',
      [usuarioId, cantidad, motivo, referenciaId]
    );

    const { rows } = await db.query(
      'UPDATE usuarios SET xp = GREATEST(0, xp + $1) WHERE id = $2 RETURNING xp',
      [cantidad, usuarioId]
    );

    const nuevoXp = rows[0]?.xp ?? 0;
    const nivel   = calcularNivel(nuevoXp);

    await db.query(
      'UPDATE usuarios SET nivel_xp = $1 WHERE id = $2',
      [nivel, usuarioId]
    );

    if (txPropia) await db.query('COMMIT');
    // fire-and-forget — no bloquea la respuesta
    verificarMedallas(usuarioId).catch(() => {});
    return { xp: nuevoXp, nivel };
  } catch (err) {
    if (txPropia) await db.query('ROLLBACK');
    throw err;
  } finally {
    if (txPropia) db.release();
  }
}

module.exports = { darXP, calcularNivel, calcularProgreso, XP_TABLA };
