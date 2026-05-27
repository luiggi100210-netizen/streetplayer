const pool = require('../config/database');

// Tabla de XP por acción
const XP_TABLA = {
  asistir_pichanga:     10,
  ganar_partido:        20,
  empatar:               8,
  crear_evento:         15,
  calificar_jugadores:   5,
  buena_calificacion:   10,  // recibir 4-5 estrellas
  perfil_completo:      20,
  inscribir_torneo:     25,
  ganar_torneo:        100,
  invitar_amigo:        30,
  // Negativos
  no_asistir:          -15,
  no_calificar:        -10,
};

// Umbrales de nivel
const NIVELES = [
  { nombre: 'rookie',      min: 0    },
  { nombre: 'amateur',     min: 100  },
  { nombre: 'intermedio',  min: 300  },
  { nombre: 'avanzado',    min: 600  },
  { nombre: 'pro',         min: 1000 },
  { nombre: 'elite',       min: 2000 },
  { nombre: 'leyenda',     min: 5000 },
];

function calcularNivel(xp) {
  let nivel = NIVELES[0].nombre;
  for (const n of NIVELES) {
    if (xp >= n.min) nivel = n.nombre;
    else break;
  }
  return nivel;
}

async function darXP(usuarioId, motivo, referenciaId = null) {
  const cantidad = XP_TABLA[motivo];
  if (cantidad === undefined) throw new Error(`Motivo XP desconocido: ${motivo}`);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Registrar en log
    await client.query(
      'INSERT INTO xp_log (usuario_id, cantidad, motivo, referencia_id) VALUES ($1,$2,$3,$4)',
      [usuarioId, cantidad, motivo, referenciaId]
    );

    // Actualizar XP y nivel
    const { rows } = await client.query(
      'UPDATE usuarios SET xp = GREATEST(0, xp + $1) WHERE id = $2 RETURNING xp',
      [cantidad, usuarioId]
    );

    const nuevoXp = rows[0]?.xp ?? 0;
    const nivel   = calcularNivel(nuevoXp);

    await client.query(
      'UPDATE usuarios SET nivel_xp = $1 WHERE id = $2',
      [nivel, usuarioId]
    );

    await client.query('COMMIT');
    return { xp: nuevoXp, nivel };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

function calcularProgreso(xp) {
  let actual = NIVELES[0], siguiente = NIVELES[1];
  for (let i = 0; i < NIVELES.length - 1; i++) {
    if (xp >= NIVELES[i].min && xp < NIVELES[i + 1].min) {
      actual    = NIVELES[i];
      siguiente = NIVELES[i + 1];
      break;
    }
    if (xp >= NIVELES[NIVELES.length - 1].min) {
      actual    = NIVELES[NIVELES.length - 1];
      siguiente = null;
      break;
    }
  }
  const progreso = siguiente
    ? Math.round(((xp - actual.min) / (siguiente.min - actual.min)) * 100)
    : 100;
  return { nivel: actual.nombre, siguiente: siguiente?.nombre ?? null, progreso, xpSiguiente: siguiente?.min ?? null };
}

module.exports = { darXP, calcularNivel, calcularProgreso, XP_TABLA };
