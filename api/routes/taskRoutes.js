import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
  createTask,
  updateTaskStatus,
  getCircleTasks,
  deleteTask,
  acceptTask,
  declineTask,
  updateTask
} from "../controllers/taskController.js";

const router = express.Router();

// Assign a task
router.post("/", protect, createTask);

// Get all tasks for my circle
router.get("/my", protect, getCircleTasks);

// Update task status (accept/deny/complete)
router.put("/:id/status", protect, updateTaskStatus);

router.put("/:id", protect, updateTask);

// Delete a task
router.delete("/:id", protect, deleteTask);

// Accept a task
router.post("/:id/accept", protect, acceptTask);

// Decline a task
router.post("/:id/decline", protect, declineTask);

export default router;
