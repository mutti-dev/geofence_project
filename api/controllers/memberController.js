import Circle from "../models/Circle.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import crypto from "crypto";

// Generate random invite code
const generateInviteCode = () => crypto.randomBytes(3).toString("hex").toUpperCase();

// @desc Generate invite code for admin
export const generateCode = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user.circle) return res.status(400).json({ message: "User not in a circle" });

    const code = generateInviteCode();
    await Circle.findByIdAndUpdate(user.circle, { code });
    await Notification.create({
      user: userId,
      type: "inviteCodeGenerated",
      message: `Your invite code is: ${code}`,
    });

    res.json({ message: "Invite code generated", code });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Join circle using code (member)
export const joinCircleWithCode = async (req, res) => {
  console.log("Joining circle with code", req.body.code);
  try {
    const { code } = req.body.code;
    const userId = req.user.id;

    const circle = await Circle.findOne({ code });
    if (!circle) return res.status(404).json({ message: "Invalid invite code" });

    // Add user if not already a member
    if (!circle.members.includes(userId)) {
      circle.members.push(userId);
      await circle.save();
      await User.findByIdAndUpdate(userId, { circleId: circle._id });

      // Notify admin
      await Notification.create({
        user: circle.admin,
        type: "newPersonAdded",
        message: `${req.user.name} joined your circle`,
      });
    }

    res.json({ message: "Joined circle successfully", circle });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Remove member (admin)
export const removeMember = async (req, res) => {
  try {
    const { memberId } = req.body;
    const adminId = req.user.id;

    const circle = await Circle.findOne({ admin: adminId });
    if (!circle) return res.status(400).json({ message: "Only admin can remove members" });

    circle.members = circle.members.filter((id) => id.toString() !== memberId);
    await circle.save();

    await User.findByIdAndUpdate(memberId, { circleId: null });

    // Notify removed member
    await Notification.create({
      user: memberId,
      type: "personLeft",
      message: `You have been removed from the circle`,
    });

    res.json({ message: "Member removed successfully", circle });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
