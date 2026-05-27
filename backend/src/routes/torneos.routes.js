const router = require('express').Router();
const { verificarToken } = require('../middleware/auth');
const { listarTorneos, obtenerTorneo, crearTorneo } = require('../controllers/torneos.controller');
router.get('/',     verificarToken, listarTorneos);
router.post('/',    verificarToken, crearTorneo);
router.get('/:id',  verificarToken, obtenerTorneo);
module.exports = router;
