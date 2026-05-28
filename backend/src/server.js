require('dotenv').config();
const http      = require('http');
const { Server } = require('socket.io');
const { verify } = require('jsonwebtoken');
const app    = require('./app');
const initDB = require('./db/init');
const { iniciarCronSanciones } = require('./services/sanciones.cron');

const PORT   = process.env.PORT || 4000;
const server = http.createServer(app);

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') ?? [];
const io = new Server(server, { cors: { origin: allowedOrigins, credentials: true } });

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Token requerido'));
  try {
    const payload = verify(token, process.env.JWT_SECRET);
    socket.userId = payload.id;
    next();
  } catch {
    next(new Error('Token inválido'));
  }
});

io.on('connection', (socket) => {
  socket.join(`user:${socket.userId}`);
  socket.on('disconnect', () => {});
});

global.io = io;

initDB().then(() => {
  server.listen(PORT, () => {
    console.log(`StreetPlayer Backend corriendo en puerto ${PORT}`);
    iniciarCronSanciones();
  });
});
