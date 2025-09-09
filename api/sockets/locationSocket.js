import User from "../../models/User.js";

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // jab user circle join kare
  socket.on("joinCircle", ({ circleId }) => {
    socket.join(circleId);
    console.log(`User joined circle: ${circleId}`);
  });

  // jab user app se apni location bheje
  socket.on("updateLocation", async ({ userId, location }) => {
    try {
      // DB me save karo
      const user = await User.findByIdAndUpdate(
        userId,
        { location },
        { new: true }
      );

      if (user && user.circle) {
        // us circle ke saare members ko broadcast karo
        io.to(user.circle.toString()).emit("locationUpdate", user);
      }
    } catch (err) {
      console.error("Error updating location:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});
