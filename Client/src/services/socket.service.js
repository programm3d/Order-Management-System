import { io } from "socket.io-client";

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
  }

  connect(token) {
    try {
      if (this.socket?.connected) {
        return;
      }

      const SOCKET_URL =
        import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

      this.socket = io(SOCKET_URL, {
        auth: { token },
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 1000,
      });

      this.socket.on("connect", () => {
        console.log("Connected to WebSocket");
        this.connected = true;
      });

      this.socket.on("disconnect", () => {
        console.log("Disconnected from WebSocket");
        this.connected = false;
      });

      this.socket.on("connect_error", (error) => {
        console.warn("WebSocket connection error:", error.message);
        this.connected = false;
      });
    } catch (error) {
      console.error("Failed to initialize socket:", error);
      this.connected = false;
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  on(event, callback) {
    if (this.socket && this.connected) {
      this.socket.on(event, callback);
    }
  }

  emit(event, data) {
    if (this.socket && this.connected) {
      this.socket.emit(event, data);
    }
  }

  off(event) {
    if (this.socket) {
      this.socket.off(event);
    }
  }

  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }
}

export default new SocketService();
