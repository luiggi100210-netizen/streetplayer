const router = require('express').Router();
const { verificarToken } = require('../middleware/auth');
const { obtenerPerfil, actualizarPerfil, seguir, buscarUsuarios, publicacionesUsuario } = require('../controllers/usuarios.controller');
router.get('/buscar',              verificarToken, buscarUsuarios);
router.get('/:id',                 verificarToken, obtenerPerfil);
router.put('/perfil',              verificarToken, actualizarPerfil);
router.post('/:id/seguir',         verificarToken, seguir);
router.get('/:id/publicaciones',   verificarToken, publicacionesUsuario);
module.exports = router;
