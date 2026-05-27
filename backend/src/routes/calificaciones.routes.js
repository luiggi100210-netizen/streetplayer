const router = require('express').Router();
const { verificarToken } = require('../middleware/auth');
const c = require('../controllers/calificaciones.controller');

router.get('/pendientes',                    verificarToken, c.pendientes);
router.get('/evento/:eventoId/jugadores',    verificarToken, c.jugadoresACalificar);
router.post('/',                             verificarToken, c.calificar);

module.exports = router;
