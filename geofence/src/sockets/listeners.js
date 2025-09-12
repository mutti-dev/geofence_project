import socket from "./index";
import { onLocationUpdate } from "./locationSocket";

export default function registerSocketListeners() {
  // location updates
  onLocationUpdate((user) => {
    console.log("📍 User location updated:", user);
  });

  // any global event
  socket.on("connect", () => console.log("✅ Connected to socket"));
  socket.on("disconnect", () => console.log("❌ Disconnected from socket"));
}
