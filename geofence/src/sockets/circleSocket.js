import socket from "./index";

// join a circle
export function joinCircle(circleId) {
  socket.emit("joinCircle", { circleId });
}

export function leaveCircle(circleId) {
  socket.emit("leaveCircle", { circleId });
}
export function circleMessage(circleId) {
  socket.emit("circleMessage", { circleId });
}
