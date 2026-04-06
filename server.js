require("dotenv").config();
const http = require("http");
const app = require("./app");
const { Server } = require("socket.io");

const PORT = process.env.APP_PORT || 5000;
const APP_NAME = process.env.APP_NAME || 5000;
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Attach io to app (Ensures availability across files)
app.set("io", io);

io.on("connection", (socket) => {
  console.log(`A user connected: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 ${APP_NAME} server running on port ${PORT}`);
});

module.exports = { server, io }; // Export io for direct use if needed