const router = require('express').Router();
const { verificarToken } = require('../middleware/auth');
const c = require('../controllers/eventos.controller');

router.get('/',                verificarToken, c.listarEventos);
router.post('/',               verificarToken, c.crearEvento);
router.get('/:id',             verificarToken, c.obtenerEvento);
router.put('/:id',             verificarToken, c.editarEvento);
router.post('/:id/unirse',     verificarToken, c.unirseEvento);
router.delete('/:id/salir',    verificarToken, c.salirEvento);
router.post('/:id/finalizar',  verificarToken, c.finalizarEvento);

module.exports = router;
