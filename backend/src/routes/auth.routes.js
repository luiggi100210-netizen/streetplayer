const router = require('express').Router();
const { verificarToken } = require('../middleware/auth');
const { registro, login, loginAdmin, me } = require('../controllers/auth.controller');
router.post('/registro',      registro);
router.post('/login',         login);
router.post('/admin/login',   loginAdmin);
router.get('/me',             verificarToken, me);
module.exports = router;
