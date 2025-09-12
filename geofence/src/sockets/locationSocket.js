import socket from "./index";

// update user location
export function updateLocation(userId, location) {
  socket.emit("updateLocation", { userId, location });
}

// listen for location updates
export function onLocationUpdate(callback) {
  socket.on("locationUpdate", callback);
}
