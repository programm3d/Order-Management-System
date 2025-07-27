const mongoose = require("mongoose");
const http = require("http");
const app = require("./app");
const { initializeWebSocket } = require("./services/websocket.service");
// require('dotenv').config();

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocket
const io = initializeWebSocket(server);

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");

    // Start server
    const PORT = process.env.PORT || 8080;
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });
