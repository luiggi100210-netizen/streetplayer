const router          = require('express').Router();
const { body, param } = require('express-validator');
const { verificarToken } = require('../middleware/auth');
const validate        = require('../middleware/validate');
const { listarTorneos, obtenerTorneo, crearTorneo } = require('../controllers/torneos.controller');

const validarId = param('id').isUUID().withMessage('ID de torneo inválido');

const validarCrear = [
  body('nombre').trim().notEmpty().withMessage('nombre requerido')
    .isLength({ min: 3, max: 100 }).withMessage('nombre: entre 3 y 100 caracteres'),
  body('deporte').trim().notEmpty().withMessage('deporte requerido'),
  body('fecha_inicio').isISO8601().withMessage('fecha_inicio debe ser una fecha válida'),
  body('fecha_fin').optional().isISO8601().withMessage('fecha_fin debe ser una fecha válida'),
  body('max_equipos').optional().isInt({ min: 2, max: 64 }).withMessage('max_equipos: entre 2 y 64'),
  body('precio_inscripcion').optional().isFloat({ min: 0 }).withMessage('precio_inscripcion debe ser mayor o igual a 0'),
  body('foto_url').optional().isURL().withMessage('foto_url debe ser una URL válida'),
  body('latitud').optional().isFloat({ min: -90, max: 90 }).withMessage('latitud inválida'),
  body('longitud').optional().isFloat({ min: -180, max: 180 }).withMessage('longitud inválida'),
];

router.get('/',    verificarToken, listarTorneos);
router.post('/',   verificarToken, validarCrear, validate, crearTorneo);
router.get('/:id', verificarToken, validarId,    validate, obtenerTorneo);

module.exports = router;
