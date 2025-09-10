import express from "express";
import protect from "../middleware/authMiddleware.js";
import { updateLocation, getCircleMembers, updatePushToken } from "../controllers/userController.js";

const router = express.Router();

// Update current user location
router.put("/location", protect, updateLocation);

// Get all members of my circle (for map)
router.get("/circle-members", protect, getCircleMembers);

// Persist Expo push token for authenticated users
router.post("/push-token", protect, updatePushToken);

export default router;
