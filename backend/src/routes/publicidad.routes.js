const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { solicitarPublicidad, tarifasPublicas } = require('../controllers/admin.controller');

router.get('/tarifas', tarifasPublicas);

router.post('/solicitar',
  [
    body('empresa').trim().notEmpty().isLength({ max: 100 }),
    body('contacto').trim().notEmpty().isLength({ max: 100 }),
    body('email').isEmail().normalizeEmail(),
    body('telefono').optional().trim().isLength({ max: 30 }),
    body('tipo').isIn(['foto', 'video', 'banner', 'pack']),
    body('duracion_dias').optional().isInt({ min: 1, max: 365 }),
    body('mensaje').optional().trim().isLength({ max: 1000 }),
  ],
  validate, solicitarPublicidad
);

module.exports = router;
