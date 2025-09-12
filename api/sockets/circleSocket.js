export default function registerCircleSocket(io, socket) {
  socket.on("joinCircle", ({ circleId }) => {
    socket.join(circleId);
    console.log(`User ${socket.id} joined circle: ${circleId}`);
  });
  socket.on("leaveCircle", ({ circleId }) => {
    socket.leave(circleId);
    console.log(`User ${socket.id} left circle: ${circleId}`);
  });
  socket.on("circleMessage", ({ circleId, message }) => {
    io.to(circleId).emit("newCircleMessage", { message, sender: socket.id });
    console.log(`User ${socket.id} sent message to circle ${circleId}: ${message}`);
  });
}
