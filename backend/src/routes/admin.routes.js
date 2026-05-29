const router          = require('express').Router();
const { body, param } = require('express-validator');
const { verificarAdmin } = require('../middleware/auth');
const validate        = require('../middleware/validate');
const a               = require('../controllers/admin.controller');

const validarId = (campo = 'id') => param(campo).isUUID().withMessage(`${campo} inválido`);

const validarEstadoUsuario = [
  validarId(),
  body('estado').isIn(['activo','suspendido','baneado']).withMessage('estado inválido'),
  body('motivo').optional().trim().isLength({ max: 300 }).withMessage('motivo: máximo 300 caracteres'),
];

const validarReporte = [
  validarId(),
  body('estado').trim().notEmpty().withMessage('estado requerido'),
];

const validarAnuncio = [
  body('titulo').trim().notEmpty().withMessage('titulo requerido')
    .isLength({ max: 100 }).withMessage('titulo: máximo 100 caracteres'),
  body('imagen_url').isURL().withMessage('imagen_url debe ser una URL válida'),
  body('url_destino').optional().isURL().withMessage('url_destino debe ser una URL válida'),
  body('fecha_inicio').isISO8601().withMessage('fecha_inicio debe ser una fecha válida'),
  body('fecha_fin').isISO8601().withMessage('fecha_fin debe ser una fecha válida'),
];

router.get('/dashboard',                   verificarAdmin, a.dashboard);
router.get('/stats',                       verificarAdmin, a.statsAmpliadas);
router.get('/usuarios',                    verificarAdmin, a.listarUsuarios);
router.put('/usuarios/:id/estado',         verificarAdmin, validarEstadoUsuario, validate, a.cambiarEstadoUsuario);
router.delete('/usuarios/:id/foto',        verificarAdmin, validarId(), validate, a.eliminarFotoUsuario);
router.get('/reportes',                    verificarAdmin, a.listarReportes);
router.put('/reportes/:id',                verificarAdmin, validarReporte, validate, a.resolverReporte);
router.get('/torneos',                     verificarAdmin, a.listarTorneosAdmin);
router.put('/torneos/:id/aprobar',         verificarAdmin, validarId(), validate, a.aprobarTorneo);
router.put('/torneos/:id/rechazar',        verificarAdmin, validarId(), validate, a.rechazarTorneo);
router.get('/equipos',                     verificarAdmin, a.listarEquiposAdmin);
router.get('/eventos',                     verificarAdmin, a.listarEventosAdmin);
router.get('/anuncios',                    verificarAdmin, a.listarAnuncios);
router.post('/anuncios',                   verificarAdmin, validarAnuncio, validate, a.crearAnuncio);

router.get('/usuarios/:id',                verificarAdmin, validarId(), validate, a.detalleUsuario);

router.get('/publicidad/solicitudes',      verificarAdmin, a.listarSolicitudes);
router.put('/publicidad/solicitudes/:id',  verificarAdmin, validarId(), validate, a.actualizarSolicitud);
router.get('/publicidad/tarifas',          verificarAdmin, a.listarTarifas);

module.exports = router;
