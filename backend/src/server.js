require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app    = require('./app');

const PORT   = process.env.PORT || 4000;
const server = http.createServer(app);

// Socket.io — notificaciones en tiempo real
const io = new Server(server, { cors: { origin: '*' } });

io.on('connection', (socket) => {
  const userId = socket.handshake.auth?.userId;
  if (userId) socket.join(`user:${userId}`);

  socket.on('disconnect', () => {});
});

// Exportar io para usarlo en controllers
global.io = io;

server.listen(PORT, () => {
  console.log(`🏃 StreetPlayer Backend corriendo en puerto ${PORT}`);
});
