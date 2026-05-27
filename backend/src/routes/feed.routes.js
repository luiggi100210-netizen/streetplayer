const router = require('express').Router();
const { verificarToken } = require('../middleware/auth');
const { obtenerFeed, crearPublicacion, toggleLike, obtenerComentarios, agregarComentario } = require('../controllers/feed.controller');
router.get('/',                       verificarToken, obtenerFeed);
router.post('/',                      verificarToken, crearPublicacion);
router.post('/:id/like',              verificarToken, toggleLike);
router.get('/:id/comentarios',        verificarToken, obtenerComentarios);
router.post('/:id/comentarios',       verificarToken, agregarComentario);
module.exports = router;
