import Circle from "../models/Circle.js";
import User from "../models/User.js";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import Notification from "../models/Notification.js";
import { sendPush } from "../utils/sendPush.js";

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

// @desc Generate a share code valid for 24 hours
export const generateShareCode = async (req, res, next) => {
  try {
    const adminId = req.user.id;
    const circle = await Circle.findOne({ admin: adminId });
    if (!circle) return res.status(404).json({ message: "Circle not found" });
    const code = uuidv4().split("-")[0];
    circle.shareCode = code;
    circle.codeExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await circle.save();
    return res.json({ shareCode: code, expiresAt: circle.codeExpiresAt });
  } catch (err) {
    next(err);
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

// @desc Join a circle by share code
export const joinByCode = async (req, res, next) => {
  try {
    const { code } = req.body;
    const userId = req.user.id;
    const circle = await Circle.findOne({ shareCode: code });
    if (!circle) return res.status(404).json({ message: "Invalid code" });
    if (circle.codeExpiresAt < new Date())
      return res.status(400).json({ message: "Code expired" });
    if (circle.members.includes(userId))
      return res.status(400).json({ message: "Already a member" });
    circle.members.push(userId);
    await circle.save();

    // Notify admin
    const admin = await User.findById(circle.admin);
    if (admin) {
      const notification = await Notification.create({
        user: admin._id,
        title: "New member joined",
        message: `${req.user.name} joined your circle`,
      });
      // send push if token exists
      if (admin.pushToken)
        sendPush(admin.pushToken, notification.title, notification.message);
    }

    return res.json({ message: "Joined circle", circleId: circle._id });
  } catch (err) {
    next(err);
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

// @desc Get all circles with members populated
export const getCirclesWithMembers = async (req, res, next) => {
  try {
    const circles = await Circle.find()
      .populate("admin", "name email")
      .populate("members", "name email location avatar");
    return res.json(circles);
  } catch (err) {
    next(err);
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
