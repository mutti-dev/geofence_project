// backend/sockets/socket.js
import { Server } from "socket.io";

let io;

export const initSocket = (server) => {
  io = new Server(server, { cors: { origin: "*" } });
  io.on("connection", (socket) => {
    console.log("Client connected", socket.id);

    socket.on("updateLocation", (data) => {
      io.emit("locationUpdated", data); // broadcast to all
    });
  });
  return io;
};

export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized!");
  return io;
};
