const router       = require('express').Router();
const { query }    = require('express-validator');
const { verificarToken } = require('../middleware/auth');
const validate     = require('../middleware/validate');
const { obtenerRanking } = require('../controllers/ranking.controller');

const validarListar = [
  query('page').optional().isInt({ min: 1 }).withMessage('page debe ser un número positivo'),
  query('deporte').optional().trim().isLength({ max: 50 }).withMessage('deporte: máximo 50 caracteres'),
  query('ciudad').optional().trim().isLength({ max: 100 }).withMessage('ciudad: máximo 100 caracteres'),
];

router.get('/', verificarToken, validarListar, validate, obtenerRanking);

module.exports = router;
