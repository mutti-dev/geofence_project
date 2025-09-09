import express from "express";
import {
  createCircle,
  joinCircle,
  getMyCircle,
} from "../controllers/circleController.js";
import protect from "../middleware/authMiddleware.js";
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
router.post("/:id/generate-invite", protect, async (req, res, next) => {
  console.log("Generating invite for circle", req.params.id);
  try {
    const circle = await Circle.findById(req.params.id);
    if (!circle)
      return res.status(404).json({ message: "Circle not found" });
    if (circle.admin.toString() !== req.user.id)
      return res
        .status(403)
        .json({ message: "Only admin can generate invite" });
    const invite = generateCode(2); // 2 hours expiry
    circle.invite = { code: invite.code, expiresAt: invite.expiresAt };
    await circle.save();
    return res.json({ invite: circle.invite });
  } catch (err) {
    next(err);
  }
});

export default router;
