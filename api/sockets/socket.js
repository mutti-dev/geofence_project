import User from "../models/User.js";

export default function socketHandler(io) {
  io.on("connection", (socket) => {
    console.log("🔗 New client connected:", socket.id);

    socket.on("joinCircle", ({ circleId }) => {
      socket.join(circleId);
      console.log(`User joined circle: ${circleId}`);
    });

    socket.on("updateLocation", async ({ userId, location }) => {
      try {
        const user = await User.findByIdAndUpdate(
          userId,
          { location },
          { new: true }
        );
        if (user && user.circle) {
          io.to(user.circle.toString()).emit("locationUpdate", user);
        }
      } catch (err) {
        console.error("❌ Error updating location:", err);
      }
    });

    socket.on("disconnect", () => {
      console.log("❌ Client disconnected:", socket.id);
    });
  });
}
