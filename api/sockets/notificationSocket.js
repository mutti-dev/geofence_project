import Notification from "../models/Notification.js";

export default function registerNotificationSocket(io, socket) {
  // Optional: join a personal room for the user
  socket.on("joinNotifications", ({ userId }) => {
    socket.join(userId); // user-specific room
    console.log(`User ${userId} joined notification room`);
  });
}

// Helper function to send notifications
export async function sendNotification(io, userId, type, message) {
  // Save to DB
  const notification = await Notification.create({
    user: userId,
    type,
    message
  });

  // Emit to the specific user room
  io.to(userId).emit("notificationReceived", notification);
}
