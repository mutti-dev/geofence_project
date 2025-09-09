import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { createServer } from "http"; // ⬅️ http server wrapper
import { Server } from "socket.io"; // ⬅️ socket.io
import connectDB from "./config/db.js";

// Routes
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import circleRoutes from "./routes/circleRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import memberRoutes from "./routes/memberRoutes.js";

// socket.io config
import socketHandler from "./sockets/socket.js";

dotenv.config();
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// DB Connection
connectDB();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/circles", circleRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/members", memberRoutes);

// Error Handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Server Error" });
});

const PORT = process.env.PORT || 5000;

// ⬇️ yahan se app.listen ki jagah server+socket
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // frontend ka URL dalna best hoga
    methods: ["GET", "POST"],
  },
});

// ✅ Check socket.io is running
io.on("connection", (socket) => {
  console.log("🔌 Socket.io connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ Socket.io disconnected:", socket.id);
  });
});

// socket.js handler call
socketHandler(io);

server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
