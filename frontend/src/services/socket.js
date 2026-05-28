import { io } from 'socket.io-client';

let _socket = null;
let _token  = null;

export function getSocket() {
  const token = localStorage.getItem('sp_token');
  if (!token) {
    if (_socket) { _socket.disconnect(); _socket = null; _token = null; }
    return null;
  }
  if (_socket && token === _token) return _socket;
  if (_socket) _socket.disconnect();
  _token  = token;
  const url = import.meta.env.VITE_BACKEND_URL || '/';
  _socket = io(url, { auth: { token }, transports: ['websocket', 'polling'] });
  return _socket;
}

export function disconnectSocket() {
  if (_socket) { _socket.disconnect(); _socket = null; _token = null; }
}
