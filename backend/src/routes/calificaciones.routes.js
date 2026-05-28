const router          = require('express').Router();
const { body, param } = require('express-validator');
const { verificarToken } = require('../middleware/auth');
const validate        = require('../middleware/validate');
const c               = require('../controllers/calificaciones.controller');

const validarCalificar = [
  body('evento_id').isUUID().withMessage('evento_id inválido'),
  body('calificaciones').isArray({ min: 1 }).withMessage('calificaciones debe ser un array no vacío'),
  body('calificaciones.*.usuario_id').isUUID().withMessage('usuario_id inválido en calificación'),
  body('calificaciones.*.estrellas').isInt({ min: 1, max: 5 }).withMessage('estrellas debe ser entre 1 y 5'),
  body('calificaciones.*.goles').optional().isInt({ min: 0, max: 30 }).withMessage('goles: entre 0 y 30'),
  body('calificaciones.*.asistencias').optional().isInt({ min: 0, max: 30 }).withMessage('asistencias: entre 0 y 30'),
  body('calificaciones.*.amarillas').optional().isInt({ min: 0, max: 2 }).withMessage('amarillas: 0, 1 o 2'),
  body('calificaciones.*.rojas').optional().isInt({ min: 0, max: 1 }).withMessage('rojas: 0 o 1'),
  body('calificaciones.*.tags_positivos').optional().isArray().withMessage('tags_positivos debe ser un array'),
  body('calificaciones.*.tags_negativos').optional().isArray().withMessage('tags_negativos debe ser un array'),
];

router.get('/pendientes',                 verificarToken, c.pendientes);
router.get('/evento/:eventoId/jugadores', verificarToken,
  param('eventoId').isUUID().withMessage('eventoId inválido'), validate,
  c.jugadoresACalificar);
router.post('/',                          verificarToken, validarCalificar, validate, c.calificar);

module.exports = router;
