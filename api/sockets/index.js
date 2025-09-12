import registerCircleSocket from "./circleSocket.js";
import registerLocationSocket from "./locationSocket.js";
import registerNotificationSocket from "./notificationSocket.js"


const onlineUsers = {}; // { userId: socketId }

export default function registerSockets(io) {
  io.on("connection", (socket) => {
    console.log("🔗 Client connected:", socket.id);

    // Register feature-specific sockets
    registerCircleSocket(io, socket);
    registerLocationSocket(io, socket);
    registerNotificationSocket(io, socket);

    // 🔑 User sends userId after connecting
    socket.on("registerUser", ({ userId }) => {
      onlineUsers[userId] = socket.id;
      socket.join(userId); // join personal room for direct notifications
      console.log(`✅ User ${userId} registered with socket ${socket.id}`);

      // Optionally notify everyone this user came online
      io.emit("userOnline", { userId });
    });

    // Clean up when disconnect
    socket.on("disconnect", () => {
      console.log("❌ Client disconnected:", socket.id);

      for (const [userId, id] of Object.entries(onlineUsers)) {
        if (id === socket.id) {
          delete onlineUsers[userId];
          io.emit("userOffline", { userId });
          break;
        }
      }
    });
  });
}