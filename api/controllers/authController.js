import User from "../models/User.js";
import Circle from "../models/Circle.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

// Helper to generate token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

// @desc Register User
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

    if (role === "admin") {
      if (!circleName)
        return res.status(400).json({ message: "Circle name required for admin" });

      // Ensure unique circle name to avoid duplicate key errors (if a unique index exists)
      let baseName = String(circleName).trim();
      let uniqueName = baseName;
      let attempts = 0;
      while (await Circle.findOne({ name: uniqueName })) {
        attempts += 1;
        uniqueName = `${baseName}-${Math.floor(1000 + Math.random() * 9000)}`;
        if (attempts > 5) break;
      }

      // try creating circle, retry once with random suffix if duplicate key occurs
      try {
        circle = new Circle({ name: uniqueName, admin: user._id, members: [user._id] });
        await circle.save();
      } catch (createErr) {
        // if duplicate key, attempt a fallback name and retry
        if (createErr.code === 11000) {
          const fallbackName = `${baseName}-${Date.now().toString().slice(-4)}`;
          try {
            circle = new Circle({ name: fallbackName, admin: user._id, members: [user._id] });
            await circle.save();
          } catch (retryErr) {
            console.error('Circle creation failed after retry', retryErr);
            return res.status(500).json({ message: 'Failed to create circle' });
          }
        } else {
          console.error('Circle creation error', createErr);
          return res.status(500).json({ message: 'Failed to create circle' });
        }
      }

      user.circle = circle._id;
      await user.save();
    } else if (role === "member") {
      if (!inviteCode)
        return res.status(400).json({ message: "Invite code required for member" });
      // find valid invite
      const found = await Circle.findOne({ "invite.code": inviteCode });
      if (!found)
        return res.status(400).json({ message: "Invalid or expired invite code" });
      if (!found.invite || new Date(found.invite.expiresAt) < new Date())
        return res.status(400).json({ message: "Invite expired" });
      // add member
      found.members.push(user._id);
      // optionally clear invite after use
      found.invite = null;
      await found.save();
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
    res.status(500).json({ message: error.message });
  }
};

// @desc Login User
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // check user
    const user = await User.findOne({ email });
    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user.id),
        circle: user.circle || null,
        location: user.location || null,
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
