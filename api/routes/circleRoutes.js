import express from "express";
import {
  createCircle,
  joinCircle,
  getMyCircle,
  generateShareCode,
  joinByCode,
  getCirclesWithMembers,
  generateInvite
} from "../controllers/circleController.js";
import { protect } from "../middleware/authMiddleware.js";
import Circle from "../models/Circle.js";
import generateCode from "../utils/generateCode.js";

const router = express.Router();

// Create new circle
router.post("/create", protect, createCircle);

// Join using invite code
router.post("/join", protect, joinCircle);

// Get my circle + members
router.get("/me", protect, getMyCircle);

// Generate invite code for a circle (admin only)
router.post("/:id/generate-invite", protect, generateInvite);

// Generate share code for circle
router.post("/generate-code", protect, generateShareCode);

// Join circle by code
router.post("/join-by-code", protect, joinByCode);

// Get all circles with members
router.get("/all", protect, getCirclesWithMembers);

export default router;
