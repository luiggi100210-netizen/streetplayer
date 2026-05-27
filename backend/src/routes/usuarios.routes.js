const router = require('express').Router();
const { verificarToken } = require('../middleware/auth');
const {
  obtenerPerfil, actualizarPerfil, seguir, buscarUsuarios,
  publicacionesUsuario, historialUsuario, reputacionUsuario,
} = require('../controllers/usuarios.controller');

router.get('/buscar',              verificarToken, buscarUsuarios);
router.put('/perfil',              verificarToken, actualizarPerfil);
router.get('/:id',                 verificarToken, obtenerPerfil);
router.post('/:id/seguir',         verificarToken, seguir);
router.get('/:id/publicaciones',   verificarToken, publicacionesUsuario);
router.get('/:id/historial',       verificarToken, historialUsuario);
router.get('/:id/reputacion',      verificarToken, reputacionUsuario);
module.exports = router;
