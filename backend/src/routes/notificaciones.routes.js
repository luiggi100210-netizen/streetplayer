const router = require('express').Router();
const { verificarToken } = require('../middleware/auth');
const { obtenerNotificaciones, marcarLeidas, conteoNoLeidas } = require('../controllers/notificaciones.controller');
router.get('/',         verificarToken, obtenerNotificaciones);
router.put('/leer',     verificarToken, marcarLeidas);
router.get('/conteo',   verificarToken, conteoNoLeidas);
module.exports = router;
