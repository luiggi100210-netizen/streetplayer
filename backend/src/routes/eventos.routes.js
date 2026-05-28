const router          = require('express').Router();
const { body, param, query } = require('express-validator');
const { verificarToken } = require('../middleware/auth');
const validate        = require('../middleware/validate');
const c               = require('../controllers/eventos.controller');

const validarId = param('id').isUUID().withMessage('ID de evento inválido');

const validarCrear = [
  body('titulo').trim().notEmpty().withMessage('titulo requerido')
    .isLength({ min: 5, max: 100 }).withMessage('titulo: entre 5 y 100 caracteres'),
  body('fecha_evento').isISO8601().withMessage('fecha_evento debe ser una fecha válida (ISO 8601)'),
  body('formato').optional().isInt({ min: 1, max: 11 }).withMessage('formato: número de jugadores entre 1 y 11'),
  body('cupos_total').optional().isInt({ min: 2, max: 50 }).withMessage('cupos_total: entre 2 y 50'),
  body('precio').optional().isFloat({ min: 0 }).withMessage('precio debe ser mayor o igual a 0'),
  body('duracion_min').optional().isInt({ min: 15, max: 300 }).withMessage('duracion_min: entre 15 y 300 minutos'),
  body('es_privado').optional().isBoolean().withMessage('es_privado debe ser true o false'),
  body('foto_url').optional().isURL().withMessage('foto_url debe ser una URL válida'),
  body('latitud').optional().isFloat({ min: -90, max: 90 }).withMessage('latitud inválida'),
  body('longitud').optional().isFloat({ min: -180, max: 180 }).withMessage('longitud inválida'),
];

const validarEditar = [
  validarId,
  body('titulo').optional().trim().isLength({ min: 5, max: 100 }).withMessage('titulo: entre 5 y 100 caracteres'),
  body('fecha_evento').optional().isISO8601().withMessage('fecha_evento debe ser una fecha válida'),
  body('cupos_total').optional().isInt({ min: 2, max: 50 }).withMessage('cupos_total: entre 2 y 50'),
  body('duracion_min').optional().isInt({ min: 15, max: 300 }).withMessage('duracion_min: entre 15 y 300 minutos'),
];

const validarUnirse = [
  validarId,
  body('equipo').optional().isIn(['A','B']).withMessage('equipo debe ser A o B'),
];

const validarFinalizar = [
  validarId,
  body('goles_a').optional().isInt({ min: 0, max: 50 }).withMessage('goles_a: entre 0 y 50'),
  body('goles_b').optional().isInt({ min: 0, max: 50 }).withMessage('goles_b: entre 0 y 50'),
  body('asistentes').optional().isArray().withMessage('asistentes debe ser un array'),
  body('asistentes.*').optional().isUUID().withMessage('ID de asistente inválido'),
];

const validarListar = [
  query('page').optional().isInt({ min: 1 }).withMessage('page debe ser un número positivo'),
  query('radio').optional().isFloat({ min: 1, max: 100 }).withMessage('radio: entre 1 y 100 km'),
  query('lat').optional().isFloat({ min: -90, max: 90 }).withMessage('latitud inválida'),
  query('lng').optional().isFloat({ min: -180, max: 180 }).withMessage('longitud inválida'),
];

router.get('/',               verificarToken, validarListar,    validate, c.listarEventos);
router.post('/',              verificarToken, validarCrear,     validate, c.crearEvento);
router.get('/:id',            verificarToken, validarId,        validate, c.obtenerEvento);
router.put('/:id',            verificarToken, validarEditar,    validate, c.editarEvento);
router.post('/:id/unirse',    verificarToken, validarUnirse,    validate, c.unirseEvento);
router.delete('/:id/salir',   verificarToken, validarId,        validate, c.salirEvento);
router.post('/:id/finalizar', verificarToken, validarFinalizar, validate, c.finalizarEvento);

module.exports = router;
