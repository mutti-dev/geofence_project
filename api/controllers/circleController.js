import Circle from "../models/Circle.js";
import User from "../models/User.js";
import crypto from "crypto";

// Generate random invite code
const generateCode = () => crypto.randomBytes(3).toString("hex").toUpperCase();

// @desc Create a new circle
export const createCircle = async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user.id;

    // check if already in a circle
    const existing = await Circle.findOne({ members: userId });
    if (existing) {
      return res.status(400).json({ message: "You already belong to a circle" });
    }

    const circle = await Circle.create({
      name,
      code: generateCode(),
      members: [userId],
      admin: userId,
    });

    await User.findByIdAndUpdate(userId, { circleId: circle._id });

    res.status(201).json({ message: "Circle created", circle });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Join circle using invite code
export const joinCircle = async (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.user.id;

    const circle = await Circle.findOne({ code });
    if (!circle) {
      return res.status(404).json({ message: "Invalid invite code" });
    }

    // add user if not already a member
    if (!circle.members.includes(userId)) {
      circle.members.push(userId);
      await circle.save();
      await User.findByIdAndUpdate(userId, { circleId: circle._id });
    }

    res.json({ message: "Joined circle successfully", circle });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get current user's circle and members
export const getMyCircle = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user.circle) {
      return res.status(404).json({ message: "User not in a circle" });
    }

    const circle = await Circle.findById(user.circle).populate(
      "members",
      "name email location"
    );

    res.json(circle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Generate invite for circle
export const generateInvite = async (req, res, next) => {
  try {
    const circle = await Circle.findById(req.params.id);
    if (!circle) return res.status(404).json({ message: "Circle not found" });
    if (circle.admin.toString() !== req.user.id)
      return res.status(403).json({ message: "Only admin can generate invite" });

    const invite = generateCode(2);
    circle.invite = { code: invite.code, expiresAt: invite.expiresAt };
    await circle.save();
    res.json({ invite: circle.invite });
  } catch (err) {
    next(err);
  }
};
