import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
  generateCode,
  joinCircleWithCode,
  removeMember,
} from "../controllers/memberController.js";
import Circle from "../models/Circle.js";

const router = express.Router();

// Generate invite code (admin)
router.post("/generate-code", protect, generateCode);

// Join circle using code (member)
router.post("/join", protect, joinCircleWithCode);

// Remove member (admin)
router.post("/remove", protect, removeMember);

// Get circle by id with members populated
router.get("/circles/:id", protect, async (req, res, next) => {
  try {
    const circle = await Circle.findById(req.params.id)
      .populate("members", "-password")
      .populate("admin", "-password");
    if (!circle) return res.status(404).json({ message: "Circle not found" });
    return res.json({ members: circle.members, admin: circle.admin });
  } catch (err) {
    next(err);
  }
});

export default router;
