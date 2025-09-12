import User from "../models/User.js";
import Circle from "../models/Circle.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

// Helper to generate token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

// @desc Register User
// controllers/auth.js (updated)
export const registerUser = async (req, res) => {
  console.log(req.body);
  try {
    const { name, email, password, role, circleName, inviteCode } = req.body;
    if (!name || !email || !password || !role)
      return res.status(400).json({ message: "Missing fields" });

    // check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
    });

    let circle = null;

    // ADMIN: create circle
    if (role === "admin") {
      if (!circleName) {
        // cleanup user if we can't proceed
        await User.findByIdAndDelete(user._id);
        return res
          .status(400)
          .json({ message: "Circle name required for admin" });
      }

      try {
        // Try to create the circle with the provided name (allow same names at DB level)
        circle = new Circle({
          name: circleName,
          admin: user._id,
          members: [user._id],
        });
        await circle.save();
      } catch (createErr) {
        // If we hit a duplicate key error and you haven't dropped the unique index yet,
        // fallback to creating a unique internal slug while keeping the displayed name same.
        if (createErr.code === 11000) {
          try {
            const slug = `${circleName}-${Date.now()
              .toString()
              .slice(-6)}-${Math.floor(Math.random() * 1000)}`;
            circle = new Circle({
              name: circleName,
              slug,
              admin: user._id,
              members: [user._id],
            });
            await circle.save();
          } catch (retryErr) {
            // cleanup user and fail
            await User.findByIdAndDelete(user._id);
            console.error("Circle creation failed after retry", retryErr);
            return res.status(500).json({ message: "Failed to create circle" });
          }
        } else {
          await User.findByIdAndDelete(user._id);
          console.error("Circle creation error", createErr);
          return res.status(500).json({ message: "Failed to create circle" });
        }
      }

      user.circle = circle._id;
      await user.save();

      // MEMBER: join circle using invite code (atomic update)
    } else if (role === "member") {
      if (!inviteCode) {
        await User.findByIdAndDelete(user._id);
        return res
          .status(400)
          .json({ message: "Invite code required for member" });
      }

      // Find and atomically push member and clear invite in a single operation (prevents race)
      const now = new Date();
      const found = await Circle.findOneAndUpdate(
        {
          "invite.code": inviteCode,
          "invite.expiresAt": { $gt: now }, // invite still valid
        },
        {
          $push: { members: user._id },
          $unset: { invite: "" },
        },
        { new: true }
      );

      if (!found) {
        await User.findByIdAndDelete(user._id);
        return res
          .status(400)
          .json({ message: "Invalid or expired invite code" });
      }

      user.circle = found._id;
      await user.save();
      circle = found;
    }

    // hide password
    const userObj = user.toObject();
    delete userObj.password;

    return res.status(201).json({ user: userObj, circle });
  } catch (error) {
    console.error(error);
    // If we had created a user but something failed after, try to cleanup (best-effort)
    if (error && error._id) {
      // no-op here, but you can attempt cleanup if necessary
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc Login User
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // check user and populate circle
    const user = await User.findOne({ email }).populate("circle", "name");

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user.id),
        circle: user.circle ? user.circle.name : null, // return circle name
        location: user.location || null,
        profilePicture: user.profilePicture || null,
        settings: user.settings || null,
        address: user.address || null,
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
