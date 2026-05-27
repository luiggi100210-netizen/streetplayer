require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(rateLimit({
  windowMs:       15 * 60 * 1000,
  max:            300,
  standardHeaders: true,
  legacyHeaders:  false,
}));

// Rutas
app.use('/api/auth',            require('./routes/auth.routes'));
app.use('/api/usuarios',        require('./routes/usuarios.routes'));
app.use('/api/eventos',         require('./routes/eventos.routes'));
app.use('/api/calificaciones',  require('./routes/calificaciones.routes'));
app.use('/api/feed',            require('./routes/feed.routes'));
app.use('/api/ranking',         require('./routes/ranking.routes'));
app.use('/api/torneos',         require('./routes/torneos.routes'));
app.use('/api/notificaciones',  require('./routes/notificaciones.routes'));
app.use('/api/admin',           require('./routes/admin.routes'));

// 404
app.use((req, res) => res.status(404).json({ error: `Ruta ${req.method} ${req.path} no encontrada` }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(err.status || 500).json({ error: err.message || 'Error interno del servidor' });
});

module.exports = app;
