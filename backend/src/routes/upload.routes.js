const router = require('express').Router();
const { verificarToken } = require('../middleware/auth');
const { uploadMiddleware, subirFoto } = require('../controllers/upload.controller');

// POST /api/upload/foto — sube una imagen y devuelve su URL pública
router.post('/foto', verificarToken, (req, res, next) => {
  uploadMiddleware(req, res, (err) => {
    if (err) return res.status(err.status || 400).json({ error: err.message });
    next();
  });
}, subirFoto);

module.exports = router;
