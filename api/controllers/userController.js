import User from "../models/User.js";
import Circle from "../models/Circle.js";
import Notification from "../models/Notification.js";
import Geofence from "../models/Geofence.js";
import { sendPush } from "../utils/sendPush.js";

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

    // Check for geofence triggers
    const circle = await Circle.findById(user.circle).populate("members");
    if (!circle) return res.json(user);

    // fetch geofences created by circle admin
    const geofences = await Geofence.find({
      createdBy: circle.admin,
      active: true,
    });

    for (let geofence of geofences) {
      const center = geofence.center; // { lat, lng }
      const distBefore =
        userBefore?.location?.lat != null
          ? getDistanceKm(
              userBefore.location.lat,
              userBefore.location.lng,
              center.lat,
              center.lng
            )
          : null;
      const distNow = getDistanceKm(lat, lng, center.lat, center.lng);
      const wasInside = distBefore != null ? distBefore <= geofence.radius : false;
      const isInside = distNow <= geofence.radius;

      if (!wasInside && isInside) {
        // entered
        for (let member of circle.members) {
          if (String(member._id) === String(userId)) continue; // skip triggering user
          const notification = await Notification.create({
            user: member._id,
            type: "geofenceEnter",
            title: "Geofence Enter",
            message: `${user.name} entered ${geofence.name}`,
          });
          if (member.pushToken)
            await sendPush(member.pushToken, notification.title, notification.message);
        }
      } else if (wasInside && !isInside) {
        // exited
        for (let member of circle.members) {
          if (String(member._id) === String(userId)) continue;
          const notification = await Notification.create({
            user: member._id,
            type: "geofenceExit",
            title: "Geofence Exit",
            message: `${user.name} left ${geofence.name}`,
          });
          if (member.pushToken)
            await sendPush(member.pushToken, notification.title, notification.message);
        }
      }
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
