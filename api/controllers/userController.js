import User from "../models/User.js";
import Circle from "../models/Circle.js";
import Notification from "../models/Notification.js";
import Geofence from "../models/Geofence.js";
import { sendPush } from "../utils/sendPush.js";
import bcrypt from "bcryptjs";
import { checkGeofenceTriggers } from "./geofenceController.js";

// helper: Haversine distance in km
const getDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// @desc Update user location
export const updateLocation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { lat, lng } = req.body;

    const userBefore = await User.findById(userId);

    const user = await User.findByIdAndUpdate(
      userId,
      { location: { lat, lng } },
      { new: true }
    );

    // Check for geofence triggers using the new system
    if (userBefore?.location?.lat && userBefore?.location?.lng) {
      await checkGeofenceTriggers(
        userId, 
        { lat, lng }, 
        { lat: userBefore.location.lat, lng: userBefore.location.lng }
      );
    } else {
      // First location update - only check entry
      await checkGeofenceTriggers(userId, { lat, lng });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get all members of my circle (for map)
export const getCircleMembers = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);

    const circle = await Circle.findById(user.circle).populate(
      "members",
      "name location role avatar"
    );

    if (!circle) return res.status(404).json({ message: "Circle not found" });

    res.json(circle.members);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Update push notification token
export const updatePushToken = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: "Token required" });
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.pushToken = token;
    await user.save();
    return res.json({ message: "Push token saved" });
  } catch (err) {
    next(err);
  }
};

// @desc Get user settings
export const getSettings = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('settings');
    if (!user) return res.status(404).json({ message: "User not found" });
    
    res.json(user.settings || {});
  } catch (err) {
    next(err);
  }
};

// @desc Update user settings
export const updateSettings = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { notifications, locationEnabled, theme } = req.body;
    
    const updateData = {};
    if (notifications) updateData['settings.notifications'] = notifications;
    if (locationEnabled !== undefined) updateData['settings.locationEnabled'] = locationEnabled;
    if (theme) updateData['settings.theme'] = theme;
    
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, select: 'settings' }
    );
    
    if (!user) return res.status(404).json({ message: "User not found" });
    
    res.json({ message: "Settings updated", settings: user.settings });
  } catch (err) {
    next(err);
  }
};

// @desc Get user profile
export const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('-password');
    if (!user) return res.status(404).json({ message: "User not found" });
    
    res.json(user);
  } catch (err) {
    next(err);
  }
};

// @desc Update user profile
export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, address } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (address) updateData.address = address;
    
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, select: '-password' }
    );
    
    if (!user) return res.status(404).json({ message: "User not found" });
    
    res.json({ message: "Profile updated", user });
  } catch (err) {
    next(err);
  }
};

// @desc Update profile picture
export const updateProfilePicture = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { profilePicture } = req.body;
    
    if (!profilePicture || !profilePicture.url) {
      return res.status(400).json({ message: "Profile picture URL is required" });
    }
    
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { profilePicture } },
      { new: true, select: '-password' }
    );
    
    if (!user) return res.status(404).json({ message: "User not found" });
    
    res.json({ message: "Profile picture updated", user });
  } catch (err) {
    next(err);
  }
};

// @desc Change password
export const changePassword = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password are required" });
    }
    
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update password
    user.password = hashedPassword;
    await user.save();
    
    res.json({ message: "Password changed successfully" });
  } catch (err) {
    next(err);
  }
};