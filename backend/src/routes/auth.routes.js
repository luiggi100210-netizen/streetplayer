const router    = require('express').Router();
const { body }  = require('express-validator');
const rateLimit = require('express-rate-limit');
const { verificarToken } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { registro, login, loginAdmin, me, loginFirebase, refresh, logout } = require('../controllers/auth.controller');

// Anti fuerza bruta: solo para endpoints que validan credenciales.
// /me, /refresh y /logout son operaciones de sesión frecuentes y
// quedan bajo el rate limit global definido en app.js.
// En desarrollo se omite: las pruebas manuales agotan los 10 intentos.
const credencialesLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             10,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { error: 'Demasiados intentos. Espera 15 minutos.' },
  skip:            () => process.env.NODE_ENV !== 'production',
});

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

router.post('/registro',    credencialesLimiter, validarRegistro, validate, registro);
router.post('/login',       credencialesLimiter, validarLogin,    validate, login);
router.post('/firebase',    credencialesLimiter, loginFirebase);
router.post('/refresh',     refresh);
router.post('/logout',      logout);
router.post('/admin/login', credencialesLimiter, validarLogin, validate, loginAdmin);
router.get('/me',           verificarToken, me);

module.exports = router;
