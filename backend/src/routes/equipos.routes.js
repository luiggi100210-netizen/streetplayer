const router = require('express').Router();
const { body, param, query } = require('express-validator');
const validate = require('../middleware/validate');
const { verificarToken } = require('../middleware/auth');
const {
  buscarEquipos, obtenerEquipo, crearEquipo, actualizarEquipo,
  eliminarEquipo, invitarMiembro, expulsarMiembro, salirEquipo,
} = require('../controllers/equipos.controller');

router.get('/',
  [query('q').optional().isString().trim(), query('deporte').optional().isString().trim(), query('ciudad').optional().isString().trim()],
  validate, buscarEquipos
);

router.get('/:id', [param('id').isUUID()], validate, obtenerEquipo);

router.post('/',
  verificarToken,
  [
    body('nombre').trim().notEmpty().withMessage('Nombre requerido').isLength({ max: 60 }),
    body('deporte').optional().isString().trim(),
    body('ciudad').optional().isString().trim(),
    body('escudo_url').optional().isURL(),
  ],
  validate, crearEquipo
);

router.put('/:id',
  verificarToken,
  [
    param('id').isUUID(),
    body('nombre').optional().trim().notEmpty().isLength({ max: 60 }),
    body('ciudad').optional().isString().trim(),
    body('deporte').optional().isString().trim(),
    body('escudo_url').optional().isURL(),
  ],
  validate, actualizarEquipo
);

router.delete('/:id', verificarToken, [param('id').isUUID()], validate, eliminarEquipo);

router.post('/:id/miembros',
  verificarToken,
  [param('id').isUUID(), body('usuario_id').isUUID().withMessage('usuario_id debe ser UUID')],
  validate, invitarMiembro
);

router.delete('/:id/miembros/:usuarioId',
  verificarToken,
  [param('id').isUUID(), param('usuarioId').isUUID()],
  validate, expulsarMiembro
);

router.delete('/:id/salir', verificarToken, [param('id').isUUID()], validate, salirEquipo);

module.exports = router;
