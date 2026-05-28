const router          = require('express').Router();
const { body, param, query } = require('express-validator');
const { verificarToken } = require('../middleware/auth');
const validate        = require('../middleware/validate');
const { obtenerFeed, crearPublicacion, toggleLike, obtenerComentarios, agregarComentario } = require('../controllers/feed.controller');

const validarId = param('id').isUUID().withMessage('ID inválido');

const validarPublicacion = [
  body('contenido').optional().trim().isLength({ max: 500 }).withMessage('contenido: máximo 500 caracteres'),
  body('foto_url').optional().isURL().withMessage('foto_url debe ser una URL válida'),
  body('evento_id').optional().isUUID().withMessage('evento_id inválido'),
  body().custom((_, { req }) => {
    if (!req.body.contenido && !req.body.foto_url) {
      throw new Error('Publicación vacía: contenido o foto_url requerido');
    }
    return true;
  }),
];

const validarComentario = [
  validarId,
  body('contenido').trim().notEmpty().withMessage('Comentario vacío')
    .isLength({ max: 300 }).withMessage('comentario: máximo 300 caracteres'),
];

router.get('/',                  verificarToken, query('page').optional().isInt({ min: 1 }), validate, obtenerFeed);
router.post('/',                 verificarToken, validarPublicacion, validate, crearPublicacion);
router.post('/:id/like',         verificarToken, validarId,          validate, toggleLike);
router.get('/:id/comentarios',   verificarToken, validarId,          validate, obtenerComentarios);
router.post('/:id/comentarios',  verificarToken, validarComentario,  validate, agregarComentario);

module.exports = router;
