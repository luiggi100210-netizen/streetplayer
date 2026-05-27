const router = require('express').Router();
const { verificarToken } = require('../middleware/auth');
const { obtenerRanking } = require('../controllers/ranking.controller');
router.get('/', verificarToken, obtenerRanking);
module.exports = router;
