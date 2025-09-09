import express from "express";
import protect from "../middleware/authMiddleware.js";
import { updateLocation, getCircleMembers } from "../controllers/userController.js";

const router = express.Router();

// Update current user location
router.put("/location", protect, updateLocation);

// Get all members of my circle (for map)
router.get("/circle-members", protect, getCircleMembers);


export default router;
