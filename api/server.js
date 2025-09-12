import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import connectDB from "./config/db.js";


// Routes
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import circleRoutes from "./routes/circleRoutes.js";
import geofenceRoutes from "./routes/geofenceRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import memberRoutes from "./routes/memberRoutes.js";

// Socket.io handlers
import registerSockets from "./sockets/index.js";

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
app.use("/api/geofences", geofenceRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/members", memberRoutes);

// Error Handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Server Error" });
});

const PORT = process.env.PORT || 5000;

// Create server + socket.io
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // TODO: set frontend URL for production
    methods: ["GET", "POST"],
  },
});

// Register socket handlers
registerSockets(io);

server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
