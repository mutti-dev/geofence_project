import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
  createTask,
  updateTaskStatus,
  getCircleTasks,
} from "../controllers/taskController.js";

const router = express.Router();

// Assign a task
router.post("/create", protect, createTask);

// Update task status (accept/deny/complete)
router.put("/:taskId/status", protect, updateTaskStatus);

// Get all tasks for my circle
router.get("/circle", protect, getCircleTasks);

export default router;
