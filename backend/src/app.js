require('dotenv').config();
const path      = require('path');
const express   = require('express');
const cors      = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') ?? [];
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             300,
  standardHeaders: true,
  legacyHeaders:   false,
}));

const authLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             10,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { error: 'Demasiados intentos. Espera 15 minutos.' },
});

// Archivos estáticos subidos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rutas
app.use('/api/auth',            authLimiter, require('./routes/auth.routes'));
app.use('/api/usuarios',        require('./routes/usuarios.routes'));
app.use('/api/eventos',         require('./routes/eventos.routes'));
app.use('/api/calificaciones',  require('./routes/calificaciones.routes'));
app.use('/api/feed',            require('./routes/feed.routes'));
app.use('/api/ranking',         require('./routes/ranking.routes'));
app.use('/api/torneos',         require('./routes/torneos.routes'));
app.use('/api/notificaciones',  require('./routes/notificaciones.routes'));
app.use('/api/equipos',         require('./routes/equipos.routes'));
app.use('/api/retos',           require('./routes/retos.routes'));
app.use('/api/upload',          require('./routes/upload.routes'));
app.use('/api/admin',           require('./routes/admin.routes'));

// 404
app.use((req, res) => res.status(404).json({ error: `Ruta ${req.method} ${req.path} no encontrada` }));

// Error handler
app.use((err, req, res, next) => {
  if (err.code === '23505') {
    const campo = err.constraint?.includes('email') ? 'email' : 'username';
    return res.status(409).json({ error: `Ese ${campo} ya está en uso` });
  }
  console.error(err.message);
  res.status(err.status || 500).json({ error: err.message || 'Error interno del servidor' });
});

module.exports = app;
