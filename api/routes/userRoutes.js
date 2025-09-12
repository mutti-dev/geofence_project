import express from "express";
import protect from "../middleware/authMiddleware.js";
import { 
  updateLocation, 
  getCircleMembers, 
  updatePushToken, 
  getSettings, 
  updateSettings,
  getProfile,
  updateProfile,
  updateProfilePicture,
  changePassword
} from "../controllers/userController.js";

const router = express.Router();

// Update current user location
router.put("/location", protect, updateLocation);

// Get all members of my circle (for map)
router.get("/circle-members", protect, getCircleMembers);

// Update push notification token
router.put("/push-token", protect, updatePushToken);

// Get user settings
router.get("/settings", protect, getSettings);

// Update user settings
router.put("/settings", protect, updateSettings);

// Profile management routes
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.put("/profile/picture", protect, updateProfilePicture);
router.put("/profile/password", protect, changePassword);

export default router;
