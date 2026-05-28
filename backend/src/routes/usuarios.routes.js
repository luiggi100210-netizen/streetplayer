const router          = require('express').Router();
const { body, param, query } = require('express-validator');
const { verificarToken } = require('../middleware/auth');
const validate        = require('../middleware/validate');
const {
  obtenerPerfil, actualizarPerfil, seguir, buscarUsuarios,
  publicacionesUsuario, historialUsuario, reputacionUsuario,
  medallasUsuario, reportarUsuario,
} = require('../controllers/usuarios.controller');

const validarId = param('id').isUUID().withMessage('ID de usuario inválido');

const validarPerfil = [
  body('nombre').optional().trim().isLength({ min: 2, max: 50 }).withMessage('nombre: entre 2 y 50 caracteres'),
  body('apodo').optional().trim().isLength({ max: 30 }).withMessage('apodo: máximo 30 caracteres'),
  body('bio').optional().trim().isLength({ max: 250 }).withMessage('bio: máximo 250 caracteres'),
  body('ciudad').optional().trim().isLength({ max: 100 }).withMessage('ciudad: máximo 100 caracteres'),
  body('deportes').optional().isArray().withMessage('deportes debe ser un array'),
  body('posicion').optional().trim().isLength({ max: 30 }).withMessage('posicion: máximo 30 caracteres'),
  body('pie_dominante').optional().isIn(['derecho','izquierdo','ambos']).withMessage('pie_dominante inválido'),
  body('foto_url').optional().isURL().withMessage('foto_url debe ser una URL válida'),
];

const validarBusqueda = [
  query('q').optional().trim().isLength({ max: 50 }).withMessage('búsqueda: máximo 50 caracteres'),
  query('page').optional().isInt({ min: 1 }).withMessage('page debe ser un número positivo'),
];

router.get('/buscar',              verificarToken, validarBusqueda,   validate, buscarUsuarios);
router.put('/perfil',              verificarToken, validarPerfil,     validate, actualizarPerfil);
router.get('/:id',                 verificarToken, validarId,         validate, obtenerPerfil);
router.post('/:id/seguir',         verificarToken, validarId,         validate, seguir);
router.get('/:id/publicaciones',   verificarToken, validarId,         validate, publicacionesUsuario);
router.get('/:id/historial',       verificarToken, validarId,         validate, historialUsuario);
router.get('/:id/reputacion',      verificarToken, validarId,         validate, reputacionUsuario);
router.get('/:id/medallas',        verificarToken, validarId,         validate, medallasUsuario);
router.post('/:id/reportar',
  verificarToken, validarId,
  [
    body('motivo').trim().notEmpty().withMessage('motivo requerido').isLength({ max: 100 }),
    body('descripcion').optional().trim().isLength({ max: 500 }),
  ],
  validate, reportarUsuario
);

module.exports = router;
