import socket from "./index";

export function joinNotificationRoom(userId) {
  socket.emit("joinNotifications", { userId });
}

export function onNotificationReceived(callback) {
  socket.on("notificationReceived", callback);
}
