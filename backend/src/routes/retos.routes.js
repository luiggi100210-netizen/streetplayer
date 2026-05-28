const router = require('express').Router();
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const { verificarToken } = require('../middleware/auth');
const { obtenerRetos, crearReto, responderReto, obtenerRetosComunidad } = require('../controllers/retos.controller');

router.get('/comunidad', verificarToken, obtenerRetosComunidad);
router.get('/',          verificarToken, obtenerRetos);

router.post('/',
  verificarToken,
  [body('equipo_retado_id').isUUID().withMessage('equipo_retado_id debe ser UUID')],
  validate, crearReto
);

router.put('/:id/responder',
  verificarToken,
  [
    param('id').isUUID(),
    body('accion').isIn(['aceptar', 'rechazar']).withMessage('accion debe ser "aceptar" o "rechazar"'),
  ],
  validate, responderReto
);

module.exports = router;
