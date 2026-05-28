const jwt = require('jsonwebtoken');

function _extraerPayload(authHeader) {
  if (!authHeader?.startsWith('Bearer ')) {
    const err = new Error('Token requerido');
    err.status = 401;
    throw err;
  }
  try {
    return jwt.verify(authHeader.slice(7), process.env.JWT_SECRET);
  } catch {
    const err = new Error('Token inválido o expirado');
    err.status = 401;
    throw err;
  }
}

function verificarToken(req, res, next) {
  try {
    req.usuario = _extraerPayload(req.headers.authorization);
    next();
  } catch (err) {
    res.status(err.status).json({ error: err.message });
  }
}

function verificarAdmin(req, res, next) {
  try {
    const payload = _extraerPayload(req.headers.authorization);
    if (!payload.esAdmin) return res.status(403).json({ error: 'Acceso solo para administradores' });
    req.admin = payload;
    next();
  } catch (err) {
    res.status(err.status).json({ error: err.message });
  }
}

module.exports = { verificarToken, verificarAdmin };
