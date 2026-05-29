const pool         = require('../config/database');
const asyncHandler = require('../middleware/asyncHandler');

// Helper: registrar acción admin en audit log
const logAdmin = async (req, accion, entidad = null, entidad_id = null, detalles = null) => {
  try {
    await pool.query(
      `INSERT INTO admin_audit_log (admin_id, admin_username, accion, entidad, entidad_id, detalles, ip)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [req.admin?.id || null, req.admin?.username || 'sistema', accion, entidad, entidad_id || null,
       detalles ? JSON.stringify(detalles) : null, req.ip || null]
    );
  } catch {}
};
module.exports.logAdmin = logAdmin;

// ── ANALYTICS ─────────────────────────────────────────────────────────────────
const getAnalytics = asyncHandler(async (req, res) => {
  const [retencion, distribDeporte, distribCiudad, funnel, actHora, tendencia30d] = await Promise.all([
    // Retención DAU / WAU / MAU (basado en ultimo_acceso o fecha_registro)
    pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE COALESCE(ultimo_acceso, fecha_registro) >= NOW() - INTERVAL '1 day')  AS dau,
        COUNT(*) FILTER (WHERE COALESCE(ultimo_acceso, fecha_registro) >= NOW() - INTERVAL '7 days') AS wau,
        COUNT(*) FILTER (WHERE COALESCE(ultimo_acceso, fecha_registro) >= NOW() - INTERVAL '30 days') AS mau,
        COUNT(*) AS total
      FROM usuarios WHERE estado = 'activo'
    `),
    // Distribución por deporte (usando campo deporte de eventos como proxy)
    pool.query(`
      SELECT deporte, COUNT(*) AS total
      FROM eventos WHERE deporte IS NOT NULL AND deporte != ''
      GROUP BY deporte ORDER BY total DESC LIMIT 8
    `),
    // Top ciudades de usuarios
    pool.query(`
      SELECT ciudad, COUNT(*) AS total
      FROM usuarios WHERE ciudad IS NOT NULL AND ciudad != ''
      GROUP BY ciudad ORDER BY total DESC LIMIT 10
    `),
    // Funnel de conversión
    pool.query(`
      SELECT
        (SELECT COUNT(*) FROM usuarios)                                          AS registrados,
        (SELECT COUNT(*) FROM usuarios WHERE foto_url IS NOT NULL)               AS con_foto,
        (SELECT COUNT(*) FROM usuarios WHERE partidos_jugados >= 1)              AS con_partidos,
        (SELECT COUNT(DISTINCT usuario_id) FROM equipo_miembros)                 AS en_equipo,
        (SELECT COUNT(DISTINCT usuario_id) FROM inscripciones)                   AS en_evento,
        (SELECT COUNT(DISTINCT usuario_id) FROM equipo_miembros WHERE rol='capitan') AS capitanes
    `),
    // Actividad por hora del día (usando fecha_registro como proxy)
    pool.query(`
      SELECT EXTRACT(HOUR FROM fecha_registro)::int AS hora, COUNT(*) AS total
      FROM usuarios GROUP BY hora ORDER BY hora ASC
    `),
    // Tendencia 30 días
    pool.query(`
      SELECT DATE(fecha_registro) AS dia, COUNT(*) AS nuevos
      FROM usuarios WHERE fecha_registro >= NOW() - INTERVAL '30 days'
      GROUP BY dia ORDER BY dia ASC
    `),
  ]);

  res.json({
    retencion: retencion.rows[0],
    distribucion_deporte: distribDeporte.rows,
    distribucion_ciudad: distribCiudad.rows,
    funnel: funnel.rows[0],
    actividad_hora: actHora.rows,
    tendencia_30d: tendencia30d.rows,
  });
});

// ── MAPA ──────────────────────────────────────────────────────────────────────
const getMapaUsuarios = asyncHandler(async (req, res) => {
  const { rows } = await pool.query(`
    SELECT u.id, u.username, u.foto_url, u.ciudad, u.latitud, u.longitud,
           u.nivel_xp, u.partidos_jugados, u.estado,
           em.equipo_id IS NOT NULL AS en_equipo
    FROM usuarios u
    LEFT JOIN equipo_miembros em ON em.usuario_id = u.id
    WHERE u.latitud IS NOT NULL AND u.longitud IS NOT NULL AND u.estado = 'activo'
    LIMIT 500
  `);
  res.json(rows);
});

// ── FINANZAS ──────────────────────────────────────────────────────────────────
const getFinanzas = asyncHandler(async (req, res) => {
  const [eventosRes, publicidadRes, tendenciaRes] = await Promise.all([
    pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE precio_entrada > 0) AS eventos_pago,
        COUNT(*) FILTER (WHERE precio_entrada = 0 OR precio_entrada IS NULL) AS eventos_gratis,
        COALESCE(SUM(e.precio_entrada * (SELECT COUNT(*) FROM inscripciones WHERE evento_id = e.id)), 0) AS ingresos_brutos_eventos
      FROM eventos e WHERE estado != 'cancelado'
    `),
    pool.query(`
      SELECT
        COUNT(*) AS total_solicitudes,
        COUNT(*) FILTER (WHERE estado = 'activo') AS contratos_activos,
        COALESCE(SUM(precio_acordado) FILTER (WHERE estado IN ('activo','completado')), 0) AS ingresos_publicidad,
        COALESCE(SUM(precio_acordado) FILTER (WHERE estado = 'activo'), 0) AS publicidad_vigente
      FROM publicidad_solicitudes
    `),
    pool.query(`
      SELECT
        DATE_TRUNC('month', fecha_solicitud) AS mes,
        COUNT(*) AS solicitudes,
        COALESCE(SUM(precio_acordado), 0) AS ingresos
      FROM publicidad_solicitudes
      WHERE fecha_solicitud >= NOW() - INTERVAL '6 months' AND estado IN ('activo','completado')
      GROUP BY mes ORDER BY mes ASC
    `),
  ]);

  res.json({
    eventos: eventosRes.rows[0],
    publicidad: publicidadRes.rows[0],
    tendencia_publicidad: tendenciaRes.rows,
  });
});

// ── SANCIONES ─────────────────────────────────────────────────────────────────
const listarSanciones = asyncHandler(async (req, res) => {
  const { rows } = await pool.query(`
    SELECT s.*, u.username, u.email, u.foto_url, u.estado AS estado_usuario,
           a.username AS admin_username
    FROM sanciones s
    JOIN usuarios u ON u.id = s.usuario_id
    LEFT JOIN admins a ON a.id = s.admin_id
    ORDER BY s.fecha_inicio DESC LIMIT 100
  `);
  res.json(rows);
});

const levantarSancion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows: [s] } = await pool.query('SELECT * FROM sanciones WHERE id = $1', [id]);
  if (!s) return res.status(404).json({ error: 'Sanción no encontrada' });

  await pool.query('UPDATE sanciones SET activo = false, fecha_fin = NOW() WHERE id = $1', [id]);
  await pool.query(`UPDATE usuarios SET estado = 'activo' WHERE id = $1`, [s.usuario_id]);
  await logAdmin(req, 'levantar_sancion', 'sancion', id, { usuario_id: s.usuario_id, tipo: s.tipo });
  res.json({ mensaje: 'Sanción levantada' });
});

// ── MEDALLAS ──────────────────────────────────────────────────────────────────
const listarMedallasAdmin = asyncHandler(async (req, res) => {
  const { rows } = await pool.query(`
    SELECT m.*,
           (SELECT COUNT(*) FROM medallas_usuario WHERE medalla_id = m.id) AS total_otorgadas
    FROM medallas m ORDER BY m.tipo ASC, m.nombre ASC
  `);
  res.json(rows);
});

const crearMedalla = asyncHandler(async (req, res) => {
  const { nombre, descripcion, icono, tipo, condicion_tipo, condicion_valor } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO medallas (nombre, descripcion, icono, tipo, condicion_tipo, condicion_valor)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [nombre, descripcion, icono || '🏅', tipo || 'logro', condicion_tipo || null, condicion_valor || null]
  );
  await logAdmin(req, 'crear_medalla', 'medalla', rows[0].id, { nombre });
  res.status(201).json(rows[0]);
});

const otorgarMedalla = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { usuario_id } = req.body;
  const { rows: existing } = await pool.query(
    'SELECT 1 FROM medallas_usuario WHERE medalla_id=$1 AND usuario_id=$2', [id, usuario_id]
  );
  if (existing.length) return res.status(400).json({ error: 'El usuario ya tiene esta medalla' });

  await pool.query(
    'INSERT INTO medallas_usuario (medalla_id, usuario_id) VALUES ($1,$2)', [id, usuario_id]
  );
  await logAdmin(req, 'otorgar_medalla', 'medalla', id, { usuario_id });
  res.json({ mensaje: 'Medalla otorgada' });
});

// ── NOTIFICACIONES MASIVAS ────────────────────────────────────────────────────
const enviarNotifMasiva = asyncHandler(async (req, res) => {
  const { mensaje, tipo = 'sistema', filtro_ciudad, filtro_deporte } = req.body;

  let query = `SELECT id FROM usuarios WHERE estado = 'activo'`;
  const params = [];
  let idx = 1;
  if (filtro_ciudad) { query += ` AND LOWER(ciudad) LIKE $${idx++}`; params.push(`%${filtro_ciudad.toLowerCase()}%`); }

  const { rows: usuarios } = await pool.query(query, params);

  if (!usuarios.length) return res.json({ mensaje: 'Sin usuarios para notificar', total: 0 });

  // Insertar en lotes de 100
  const lote = usuarios.slice(0, 2000);
  const values = lote.map((u, i) => `($${i * 3 + 1},$${i * 3 + 2},$${i * 3 + 3})`).join(',');
  const flat = lote.flatMap(u => [u.id, tipo, mensaje]);
  await pool.query(
    `INSERT INTO notificaciones (usuario_id, tipo, mensaje) VALUES ${values}`, flat
  );

  await logAdmin(req, 'notificacion_masiva', null, null, { total: lote.length, mensaje: mensaje.substring(0, 80) });
  res.json({ mensaje: `Notificación enviada a ${lote.length} usuarios`, total: lote.length });
});

// ── CONFIGURACIÓN ─────────────────────────────────────────────────────────────
const getConfig = asyncHandler(async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM config_sistema ORDER BY clave ASC');
  res.json(rows);
});

const updateConfig = asyncHandler(async (req, res) => {
  const { clave } = req.params;
  const { valor } = req.body;
  const { rows } = await pool.query(
    `UPDATE config_sistema SET valor = $1, actualizado_en = NOW() WHERE clave = $2 RETURNING *`,
    [valor, clave]
  );
  if (!rows.length) return res.status(404).json({ error: 'Clave no encontrada' });
  await logAdmin(req, 'update_config', 'config', null, { clave, valor });
  res.json(rows[0]);
});

// ── AUDIT LOG ─────────────────────────────────────────────────────────────────
const getAuditLog = asyncHandler(async (req, res) => {
  const { admin_id, page = 1 } = req.query;
  const limit = 50, offset = (page - 1) * limit;
  let query = 'SELECT * FROM admin_audit_log WHERE 1=1';
  const params = [];
  let idx = 1;
  if (admin_id) { query += ` AND admin_id = $${idx++}`; params.push(admin_id); }
  query += ` ORDER BY fecha DESC LIMIT $${idx++} OFFSET $${idx++}`;
  params.push(limit, offset);
  const { rows } = await pool.query(query, params);
  res.json(rows);
});

// ── PRIVACIDAD / GDPR ─────────────────────────────────────────────────────────
const listarSolicitudesPrivacidad = asyncHandler(async (req, res) => {
  const { estado } = req.query;
  let query = `SELECT sp.*, u.username, u.email, u.foto_url
               FROM solicitudes_privacidad sp
               LEFT JOIN usuarios u ON u.id = sp.usuario_id WHERE 1=1`;
  const params = [];
  if (estado) { query += ` AND sp.estado = $1`; params.push(estado); }
  query += ' ORDER BY sp.fecha_solicitud DESC LIMIT 100';
  const { rows } = await pool.query(query, params);
  res.json(rows);
});

const actualizarSolicitudPrivacidad = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { estado, respuesta_admin } = req.body;
  const { rows } = await pool.query(
    `UPDATE solicitudes_privacidad SET
       estado = COALESCE($1, estado),
       respuesta_admin = COALESCE($2, respuesta_admin),
       fecha_procesado = CASE WHEN $1 IN ('completado','rechazado') THEN NOW() ELSE fecha_procesado END
     WHERE id = $3 RETURNING *`,
    [estado, respuesta_admin || null, id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Solicitud no encontrada' });
  await logAdmin(req, 'actualizar_solicitud_privacidad', 'privacidad', id, { estado });
  res.json(rows[0]);
});

const exportarDatosUsuario = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const [usuario, partidos, eventos, equipo, medallas, publicaciones, notifs, xpLog] = await Promise.all([
    pool.query('SELECT id,username,nombre,email,ciudad,departamento,bio,posicion,deportes,nivel_xp,partidos_jugados,goles_totales,fecha_registro,verificado FROM usuarios WHERE id=$1', [userId]),
    pool.query('SELECT * FROM partidos WHERE (equipo_local_id IN (SELECT equipo_id FROM equipo_miembros WHERE usuario_id=$1) OR equipo_visitante_id IN (SELECT equipo_id FROM equipo_miembros WHERE usuario_id=$1)) LIMIT 50', [userId]),
    pool.query('SELECT ev.titulo, ev.fecha_evento, i.estado, i.fecha_inscripcion FROM inscripciones i JOIN eventos ev ON ev.id=i.evento_id WHERE i.usuario_id=$1 ORDER BY i.fecha_inscripcion DESC', [userId]),
    pool.query('SELECT e.nombre, e.deporte, em.rol, em.fecha FROM equipo_miembros em JOIN equipos e ON e.id=em.equipo_id WHERE em.usuario_id=$1', [userId]),
    pool.query('SELECT m.nombre, m.icono, m.tipo, mu.fecha_obtenida FROM medallas_usuario mu JOIN medallas m ON m.id=mu.medalla_id WHERE mu.usuario_id=$1', [userId]),
    pool.query('SELECT contenido, tipo, fecha_creacion FROM publicaciones WHERE autor_id=$1 ORDER BY fecha_creacion DESC LIMIT 50', [userId]),
    pool.query('SELECT tipo, mensaje, leida, fecha FROM notificaciones WHERE usuario_id=$1 ORDER BY fecha DESC LIMIT 50', [userId]),
    pool.query('SELECT accion, puntos, descripcion, fecha FROM xp_log WHERE usuario_id=$1 ORDER BY fecha DESC LIMIT 50', [userId]),
  ]);

  if (!usuario.rows.length) return res.status(404).json({ error: 'Usuario no encontrado' });

  await logAdmin(req, 'exportar_datos_usuario', 'usuario', userId, {});

  res.json({
    exportado_en: new Date().toISOString(),
    datos_personales: usuario.rows[0],
    partidos: partidos.rows,
    eventos: eventos.rows,
    equipos: equipo.rows,
    medallas: medallas.rows,
    publicaciones: publicaciones.rows,
    notificaciones: notifs.rows,
    historial_xp: xpLog.rows,
  });
});

const eliminarCuentaUsuario = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { motivo } = req.body;

  const { rows: [u] } = await pool.query('SELECT username, email FROM usuarios WHERE id=$1', [userId]);
  if (!u) return res.status(404).json({ error: 'Usuario no encontrado' });

  await pool.query(`
    UPDATE usuarios SET
      estado = 'baneado',
      nombre = 'Usuario eliminado',
      bio = NULL, foto_url = NULL, telefono = NULL,
      latitud = NULL, longitud = NULL,
      email = CONCAT('deleted_', id, '@deleted.local')
    WHERE id = $1`, [userId]
  );

  await logAdmin(req, 'eliminar_cuenta_usuario', 'usuario', userId, { username: u.username, email: u.email, motivo });
  res.json({ mensaje: 'Cuenta anonimizada correctamente' });
});

// Endpoint público: usuario solicita acción de privacidad
const solicitarPrivacidad = asyncHandler(async (req, res) => {
  const { tipo, motivo } = req.body;
  const { rows: [u] } = await pool.query('SELECT username, email FROM usuarios WHERE id=$1', [req.usuario.id]);
  const { rows } = await pool.query(
    `INSERT INTO solicitudes_privacidad (usuario_id, usuario_username, usuario_email, tipo, motivo)
     VALUES ($1,$2,$3,$4,$5) RETURNING id`,
    [req.usuario.id, u.username, u.email, tipo, motivo || null]
  );
  res.status(201).json({ mensaje: 'Solicitud de privacidad enviada. Te contactaremos en 30 días hábiles.', id: rows[0].id });
});

module.exports = {
  getAnalytics, getMapaUsuarios, getFinanzas,
  listarSanciones, levantarSancion,
  listarMedallasAdmin, crearMedalla, otorgarMedalla,
  enviarNotifMasiva,
  getConfig, updateConfig,
  getAuditLog,
  listarSolicitudesPrivacidad, actualizarSolicitudPrivacidad, exportarDatosUsuario, eliminarCuentaUsuario,
  solicitarPrivacidad,
};
