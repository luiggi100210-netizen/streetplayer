const router   = require('express').Router();
const { body } = require('express-validator');
const { verificarToken } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { registro, login, loginAdmin, me, loginFirebase, refresh, logout } = require('../controllers/auth.controller');

const validarRegistro = [
  body('username').trim().notEmpty().withMessage('username requerido')
    .isLength({ min: 3, max: 20 }).withMessage('username: entre 3 y 20 caracteres')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('username solo puede contener letras, números y guión bajo'),
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('nombre').trim().notEmpty().withMessage('nombre requerido')
    .isLength({ min: 2, max: 50 }).withMessage('nombre: entre 2 y 50 caracteres'),
  body('ciudad').optional().trim().isLength({ max: 100 }).withMessage('ciudad: máximo 100 caracteres'),
  body('deportes').optional().isArray().withMessage('deportes debe ser un array'),
  body('lat').optional().isFloat({ min: -90,  max: 90  }).withMessage('lat inválido'),
  body('lng').optional().isFloat({ min: -180, max: 180 }).withMessage('lng inválido'),
];

const validarLogin = [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('Contraseña requerida'),
];

router.post('/registro',    validarRegistro, validate, registro);
router.post('/login',       validarLogin,    validate, login);
router.post('/firebase',    loginFirebase);
router.post('/refresh',     refresh);
router.post('/logout',      logout);
router.post('/admin/login', validarLogin, validate, loginAdmin);
router.get('/me',           verificarToken, me);

module.exports = router;
