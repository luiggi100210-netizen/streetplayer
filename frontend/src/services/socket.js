import { io } from 'socket.io-client';
import { getToken } from './authStorage';
import { BACKEND_ORIGIN } from '../config';

let _socket = null;
let _token  = null;

export function getSocket() {
  const token = getToken();
  if (!token) {
    if (_socket) { _socket.disconnect(); _socket = null; _token = null; }
    return null;
  }
  if (_socket && token === _token) return _socket;
  if (_socket) _socket.disconnect();
  _token  = token;
  _socket = io(BACKEND_ORIGIN || '/', { auth: { token }, transports: ['websocket', 'polling'] });
  return _socket;
}

export function disconnectSocket() {
  if (_socket) { _socket.disconnect(); _socket = null; _token = null; }
}
