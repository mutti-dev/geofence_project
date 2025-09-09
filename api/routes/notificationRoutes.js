import express from "express";
import protect from "../middleware/authMiddleware.js";
import { getNotifications, markRead } from "../controllers/notificationController.js";

const router = express.Router();

// Get notifications for current user
router.get("/", protect, getNotifications);

// Mark notification as read
router.put("/:id/read", protect, markRead);

export default router;
