const router              = require('express').Router();
const { verificarToken }  = require('../middleware/auth');
const {
  listarConversaciones,
  obtenerMensajes,
  enviarMensaje,
  marcarLeido,
  totalNoLeidos,
} = require('../controllers/mensajes.controller');

router.use(verificarToken);

router.get('/',                       listarConversaciones);
router.get('/no-leidos',              totalNoLeidos);
router.get('/:convId/mensajes',       obtenerMensajes);
router.post('/:usuarioId',            enviarMensaje);
router.put('/:convId/leer',           marcarLeido);

module.exports = router;
