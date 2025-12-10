import { io } from 'socket.io-client';
import dotenv from 'dotenv';

dotenv.config();

const SOCKET_URL = process.env.SOCKET_URL || 'http://localhost:3000';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.pendingListeners = []; // Buffer for listeners added before connection
  }

  /**
   * Verbindung zum Server herstellen
   */
  connect(token) {
    return new Promise((resolve, reject) => {
      this.socket = io(SOCKET_URL, {
        auth: { token },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5
      });

      // Attach all pending listeners
      this.pendingListeners.forEach(({ event, callback }) => {
        this.socket.on(event, callback);
      });
      this.pendingListeners = [];

      this.socket.on('connect', () => {
        this.connected = true;
      });

      this.socket.on('authenticated', (data) => {
        resolve(data);
      });

      this.socket.on('connect_error', (error) => {
        reject(error);
      });

      this.socket.on('disconnect', (reason) => {
        this.connected = false;
      });
    });
  }

  /**
   * Nachricht senden
   */
  sendMessage(roomId, content) {
    this.socket.emit('send_message', { roomId, content });
  }

  /**
   * Private Nachricht senden
   */
  sendDM(recipientId, content) {
    this.socket.emit('send_message', { recipientId, content });
  }

  /**
   * Raum beitreten
   */
  joinRoom(roomId) {
    this.socket.emit('join_room', { roomId });
  }

  /**
   * Raum verlassen
   */
  leaveRoom(roomId) {
    this.socket.emit('leave_room', { roomId });
  }

  /**
   * Räume abrufen
   */
  getRooms() {
    this.socket.emit('get_rooms');
  }

  /**
   * User im Raum abrufen
   */
  getUsers() {
    this.socket.emit('get_users');
  }

  /**
   * Admin: Raum erstellen
   */
  adminCreateRoom(name, description) {
    this.socket.emit('admin:create_room', { name, description });
  }

  /**
   * Admin: User bannen
   */
  adminBanUser(username, reason) {
    this.socket.emit('admin:ban_user', { username, reason });
  }

  /**
   * Admin: User unbannen
   */
  adminUnbanUser(username) {
    this.socket.emit('admin:unban_user', { username });
  }

  /**
   * Admin: User kicken
   */
  adminKickUser(username, reason) {
    this.socket.emit('admin:kick_user', { username, reason });
  }

  /**
   * Admin: Raum löschen
   */
  adminDeleteRoom(roomId) {
    this.socket.emit('admin:delete_room', { roomId });
  }

  /**
   * Event Listener registrieren
   */
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    } else {
      // Buffer listener if socket doesn't exist yet
      this.pendingListeners.push({ event, callback });
    }
  }

  /**
   * Event Listener entfernen
   */
  off(event, callback) {
    this.socket.off(event, callback);
  }

  /**
   * Verbindung trennen
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }
}

export default new SocketService();
