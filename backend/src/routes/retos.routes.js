const router = require('express').Router();
const { body, param, query } = require('express-validator');
const validate = require('../middleware/validate');
const { verificarToken } = require('../middleware/auth');
const {
  obtenerRetos, crearReto, responderReto, obtenerRetosComunidad,
  equiposCercanos, contraoferta, getChatReto, postChatReto,
} = require('../controllers/retos.controller');

router.get('/comunidad',  verificarToken, obtenerRetosComunidad);
router.get('/cercanos',   verificarToken, equiposCercanos);
router.get('/',           verificarToken, obtenerRetos);

router.post('/',
  verificarToken,
  [
    body('equipo_retado_id').isUUID().withMessage('equipo_retado_id inválido'),
    body('cancha').optional().isString().trim().isLength({ max: 200 }),
    body('hora_propuesta').optional().isISO8601(),
    body('formato_reto').optional().isIn(['goles', 'tiempo']),
    body('valor_formato').optional().isInt({ min: 1, max: 200 }),
    body('monto_apuesta').optional().isFloat({ min: 0 }),
    body('moneda').optional().isIn(['PEN', 'USD']),
  ],
  validate, crearReto
);

router.put('/:id/contraoferta',
  verificarToken,
  [
    param('id').isUUID(),
    body('cancha').optional().isString().trim().isLength({ max: 200 }),
    body('hora_propuesta').optional().isISO8601(),
    body('monto_apuesta').optional().isFloat({ min: 0 }),
    body('valor_formato').optional().isInt({ min: 1, max: 200 }),
  ],
  validate, contraoferta
);

router.put('/:id/responder',
  verificarToken,
  [
    param('id').isUUID(),
    body('accion').isIn(['aceptar', 'rechazar']).withMessage('accion debe ser "aceptar" o "rechazar"'),
  ],
  validate, responderReto
);

router.get('/:id/chat',  verificarToken, [param('id').isUUID()], validate, getChatReto);
router.post('/:id/chat',
  verificarToken,
  [param('id').isUUID(), body('contenido').trim().notEmpty().isLength({ max: 500 })],
  validate, postChatReto
);

module.exports = router;
