const router          = require('express').Router();
const { body, param } = require('express-validator');
const { verificarToken } = require('../middleware/auth');
const validate        = require('../middleware/validate');
const {
  listarTorneos, obtenerTorneo, crearTorneo,
  postularEquipo, desinscribirEquipo,
  aceptarEquipo, rechazarEquipo,
  configurarPremios, iniciarTorneo,
  registrarResultado, medallasTorneos,
} = require('../controllers/torneos.controller');

const validarId = param('id').isUUID().withMessage('ID de torneo inválido');

const validarCrear = [
  body('nombre').trim().notEmpty().withMessage('nombre requerido')
    .isLength({ min: 3, max: 100 }).withMessage('nombre: entre 3 y 100 caracteres'),
  body('deporte').trim().notEmpty().withMessage('deporte requerido'),
  body('fecha_inicio').isISO8601().withMessage('fecha_inicio debe ser una fecha válida'),
  body('fecha_fin').optional().isISO8601().withMessage('fecha_fin debe ser una fecha válida'),
  body('max_equipos').optional().isInt({ min: 2, max: 64 }).withMessage('max_equipos: entre 2 y 64'),
  body('precio_inscripcion').optional().isFloat({ min: 0 }).withMessage('precio_inscripcion debe ser mayor o igual a 0'),
  body('foto_url').optional({ checkFalsy: true }).isURL().withMessage('foto_url debe ser una URL válida'),
  body('latitud').optional().isFloat({ min: -90, max: 90 }).withMessage('latitud inválida'),
  body('longitud').optional().isFloat({ min: -180, max: 180 }).withMessage('longitud inválida'),
];

const validarEquipoId = [body('equipo_id').isUUID().withMessage('equipo_id inválido')];
const validarPartidoId = param('partidoId').isUUID().withMessage('ID de partido inválido');

const validarPremios = [
  body('premios').isArray({ max: 20 }).withMessage('premios debe ser un array de máximo 20 elementos'),
  body('premios.*.puesto').isInt({ min: 1, max: 20 }).withMessage('puesto debe ser un número entero entre 1 y 20'),
  body('premios.*.descripcion').trim().isLength({ min: 1, max: 200 }).withMessage('descripcion: entre 1 y 200 caracteres'),
];

router.get('/',    verificarToken, listarTorneos);
router.post('/',   verificarToken, validarCrear, validate, crearTorneo);
router.get('/:id', verificarToken, validarId, validate, obtenerTorneo);

// Postulación de equipos
router.post('/:id/postular',   verificarToken, validarId, validate, validarEquipoId, validate, postularEquipo);
router.delete('/:id/inscribir',verificarToken, validarId, validate, validarEquipoId, validate, desinscribirEquipo);

// Panel organizador
router.put('/:id/equipos/:equipoId/aceptar',  verificarToken, validarId, validate, aceptarEquipo);
router.put('/:id/equipos/:equipoId/rechazar', verificarToken, validarId, validate, rechazarEquipo);
router.put('/:id/premios',  verificarToken, validarId, validate, validarPremios, validate, configurarPremios);
router.put('/:id/iniciar',  verificarToken, validarId, validate, iniciarTorneo);

// Resultados de partidos
router.put('/:id/partidos/:partidoId/resultado', verificarToken, validarId, validarPartidoId, validate, registrarResultado);

// Medallas de torneos del usuario
router.get('/usuario/:id/medallas', verificarToken, medallasTorneos);

module.exports = router;
