require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app    = require('./app');
const { iniciarCronSanciones } = require('./services/sanciones.cron');

const PORT   = process.env.PORT || 4000;
const server = http.createServer(app);

const io = new Server(server, { cors: { origin: '*' } });

io.on('connection', (socket) => {
  const userId = socket.handshake.auth?.userId;
  if (userId) socket.join(`user:${userId}`);
  socket.on('disconnect', () => {});
});

global.io = io;

server.listen(PORT, () => {
  console.log(`🏃 StreetPlayer Backend corriendo en puerto ${PORT}`);
  iniciarCronSanciones();
});
