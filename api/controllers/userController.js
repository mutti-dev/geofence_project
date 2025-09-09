import User from "../models/User.js";
import Circle from "../models/Circle.js";
import Notification from "../models/Notification.js";

// @desc Update user location
export const updateLocation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { lat, lng } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { location: { lat, lng } },
      { new: true }
    );

    // Check for geofence triggers
    const circle = await Circle.findById(user.circle).populate("members");
    if (!circle) return res.json(user);

    for (let member of circle.members) {
      if (member._id.toString() === userId) continue; // skip self

      // Example: simple distance check (replace with real geofence logic)
      const distance = Math.sqrt(
        Math.pow(member.location.lat - lat, 2) +
        Math.pow(member.location.lng - lng, 2)
      );

      if (distance < 0.001) { // threshold for enter
        await Notification.create({
          user: member._id,
          type: "geofenceEnter",
          message: `${user.name} entered your geofence area`,
        });
      } else {
        await Notification.create({
          user: member._id,
          type: "geofenceExit",
          message: `${user.name} left your geofence area`,
        });
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
    console.log("get circle member", user);

    const circle = await Circle.findById(user.circle).populate(
      "members",
      "name location role"
    );

    if (!circle) return res.status(404).json({ message: "Circle not found" });

    res.json(circle.members);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
