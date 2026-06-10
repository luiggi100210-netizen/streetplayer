/**
 * Configuración CORS compartida entre Express (app.js) y Socket.IO (server.js).
 * Orígenes permitidos vía ALLOWED_ORIGINS (lista separada por comas).
 * En desarrollo (sin ALLOWED_ORIGINS) se permite cualquier origen;
 * en producción config/env.js exige que la variable esté definida.
 */
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, cb) => {
    // Sin header Origin: peticiones same-origin o server-to-server
    if (!origin) return cb(null, true);
    if (allowedOrigins.length === 0 || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return cb(null, true);
    }
    cb(new Error('CORS'), false);
  },
  credentials: true,
};

module.exports = corsOptions;
