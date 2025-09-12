import Geofence from '../models/Geofence.js';
import Circle from '../models/Circle.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { sendPush } from '../utils/sendPush.js';

// Create geofence (admin only)
export const createGeofence = async (req, res, next) => {
  try {
    const userId = req.user.id;
    // ensure user is admin of a circle
    const adminCircle = await Circle.findOne({ admin: userId });
    if (!adminCircle) return res.status(403).json({ message: 'Only circle admin can create geofences' });

    const { 
      name, 
      description = '', 
      center, 
      radius, 
      active = true, 
      zoneType = 'safe',
      notifications = {}
    } = req.body;
    
    if (!name || !center || center.lat == null || center.lng == null || !radius) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Convert radius from km to meters if needed
    const radiusInMeters = radius > 1000 ? radius : radius * 1000;

    const geofence = await Geofence.create({
      name,
      description,
      center: { lat: center.lat, lng: center.lng },
      radius: radiusInMeters,
      circle: adminCircle._id,
      createdBy: userId,
      active,
      zoneType,
      notifications: {
        onEntry: notifications.onEntry !== undefined ? notifications.onEntry : true,
        onExit: notifications.onExit !== undefined ? notifications.onExit : false,
        notifyAdmin: notifications.notifyAdmin !== undefined ? notifications.notifyAdmin : true,
        notifyMember: notifications.notifyMember !== undefined ? notifications.notifyMember : false
      }
    });

    // Populate the response
    const populatedGeofence = await Geofence.findById(geofence._id)
      .populate('createdBy', 'name email')
      .populate('circle', 'name');

    res.status(201).json(populatedGeofence);
  } catch (err) {
    next(err);
  }
};

// Update geofence (admin only)
export const updateGeofence = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const adminCircle = await Circle.findOne({ admin: userId });
    if (!adminCircle) return res.status(403).json({ message: 'Only circle admin can update geofences' });

    const geofence = await Geofence.findById(id);
    if (!geofence) return res.status(404).json({ message: 'Geofence not found' });
    if (String(geofence.createdBy) !== String(userId)) return res.status(403).json({ message: 'Not authorized' });

    const { 
      name, 
      description, 
      center, 
      radius, 
      active, 
      zoneType, 
      notifications 
    } = req.body;
    
    if (name) geofence.name = name;
    if (description !== undefined) geofence.description = description;
    if (center && center.lat != null && center.lng != null) {
      geofence.center = { lat: center.lat, lng: center.lng };
    }
    if (radius != null) {
      // Convert radius from km to meters if needed
      geofence.radius = radius > 1000 ? radius : radius * 1000;
    }
    if (active != null) geofence.active = active;
    if (zoneType) geofence.zoneType = zoneType;
    if (notifications) {
      geofence.notifications = { ...geofence.notifications, ...notifications };
    }

    await geofence.save();
    
    // Populate the response
    const populatedGeofence = await Geofence.findById(geofence._id)
      .populate('createdBy', 'name email')
      .populate('circle', 'name');
    
    res.json(populatedGeofence);
  } catch (err) {
    next(err);
  }
};

// Delete geofence (admin only)
export const deleteGeofence = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const adminCircle = await Circle.findOne({ admin: userId });
    if (!adminCircle) return res.status(403).json({ message: 'Only circle admin can delete geofences' });

    const geofence = await Geofence.findById(id);
    if (!geofence) return res.status(404).json({ message: 'Geofence not found' });
    if (String(geofence.createdBy) !== String(userId)) return res.status(403).json({ message: 'Not authorized' });

    await Geofence.findByIdAndDelete(id);
    res.json({ message: 'Geofence deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// Get geofences for circle
export const getGeofencesForCircle = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).populate('circle');
    if (!user || !user.circle) return res.status(404).json({ message: 'User not in a circle' });

    const geofences = await Geofence.find({ circle: user.circle._id, active: true })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ circleName: user.circle.name, geofences });
  } catch (err) {
    next(err);
  }
};

// Get all geofences for admin (with member locations)
export const getGeofencesWithMembers = async (req, res, next) => {
  try {
    console.log("getGeofencesWithMembers");
    const userId = req.user.id;
    const adminCircle = await Circle.findOne({ admin: userId });
    if (!adminCircle) return res.status(403).json({ message: 'Only circle admin can view this data' });

    const geofences = await Geofence.find({ circle: adminCircle._id })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    // Get all circle members with their locations
    const members = await User.find({ circle: adminCircle._id })
      .select('name email role location profilePicture')
      .sort({ name: 1 });

    res.json({ 
      circleName: adminCircle.name, 
      geofences, 
      members: members.map(member => ({
        _id: member._id,
        name: member.name,
        email: member.email,
        role: member.role,
        location: member.location,
        profilePicture: member.profilePicture
      }))
    });
  } catch (err) {
    next(err);
  }
};

// Get single geofence details
export const getGeofenceById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    const geofence = await Geofence.findById(id)
      .populate('createdBy', 'name email')
      .populate('circle', 'name');
    
    if (!geofence) return res.status(404).json({ message: 'Geofence not found' });

    // Check if user has access to this geofence
    const user = await User.findById(userId);
    if (!user || !user.circle || String(user.circle) !== String(geofence.circle._id)) {
      return res.status(403).json({ message: 'Not authorized to view this geofence' });
    }

    res.json(geofence);
  } catch (err) {
    next(err);
  }
};

// Toggle geofence active status
export const toggleGeofenceStatus = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const adminCircle = await Circle.findOne({ admin: userId });
    if (!adminCircle) return res.status(403).json({ message: 'Only circle admin can toggle geofence status' });

    const geofence = await Geofence.findById(id);
    if (!geofence) return res.status(404).json({ message: 'Geofence not found' });
    if (String(geofence.createdBy) !== String(userId)) return res.status(403).json({ message: 'Not authorized' });

    geofence.active = !geofence.active;
    await geofence.save();

    res.json({ 
      message: `Geofence ${geofence.active ? 'activated' : 'deactivated'} successfully`,
      geofence 
    });
  } catch (err) {
    next(err);
  }
};

// Check geofence entry/exit and send notifications
export const checkGeofenceTriggers = async (userId, newLocation, oldLocation = null) => {
  try {
    const user = await User.findById(userId).populate('circle');
    if (!user || !user.circle) return;

    // Get all active geofences for this circle
    const geofences = await Geofence.find({ 
      circle: user.circle._id, 
      active: true 
    });

    for (const geofence of geofences) {
      const center = geofence.center;
      const radiusKm = geofence.radius / 1000; // Convert meters to km

      // Calculate distances
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

      const distNow = getDistanceKm(
        newLocation.lat, 
        newLocation.lng, 
        center.lat, 
        center.lng
      );

      const distBefore = oldLocation ? getDistanceKm(
        oldLocation.lat, 
        oldLocation.lng, 
        center.lat, 
        center.lng
      ) : null;

      const wasInside = distBefore ? distBefore <= radiusKm : false;
      const isInside = distNow <= radiusKm;

      // Entry trigger
      if (!wasInside && isInside && geofence.notifications.onEntry) {
        await sendGeofenceNotification(user, geofence, 'entry');
      }

      // Exit trigger
      if (wasInside && !isInside && geofence.notifications.onExit) {
        await sendGeofenceNotification(user, geofence, 'exit');
      }
    }
  } catch (error) {
    console.error('Error checking geofence triggers:', error);
  }
};

// Send geofence notification
const sendGeofenceNotification = async (user, geofence, eventType) => {
  try {
    const circle = await Circle.findById(geofence.circle).populate('admin');
    if (!circle || !circle.admin) return;

    const eventText = eventType === 'entry' ? 'entered' : 'exited';
    const message = `${user.name} has ${eventText} the ${geofence.name} zone`;

    // Create notification for admin
    if (geofence.notifications.notifyAdmin) {
      const notification = await Notification.create({
        user: circle.admin._id,
        type: eventType === 'entry' ? 'geofenceEnter' : 'geofenceExit',
        message,
        data: {
          geofenceId: geofence._id,
          geofenceName: geofence.name,
          memberId: user._id,
          memberName: user.name,
          eventType
        }
      });

      // Send push notification if admin has push token
      if (circle.admin.pushToken) {
        await sendPush(
          circle.admin.pushToken,
          'Geofence Alert',
          message
        );
      }
    }

    // Create notification for member if enabled
    if (geofence.notifications.notifyMember) {
      await Notification.create({
        user: user._id,
        type: eventType === 'entry' ? 'geofenceEnter' : 'geofenceExit',
        message: `You have ${eventText} the ${geofence.name} zone`,
        data: {
          geofenceId: geofence._id,
          geofenceName: geofence.name,
          eventType
        }
      });
    }

    // Emit socket event for real-time updates
    const io = global.io; // Assuming io is available globally
    if (io) {
      io.to(circle._id.toString()).emit("geofenceNotification", {
        type: eventType,
        memberId: user._id,
        memberName: user.name,
        geofenceId: geofence._id,
        geofenceName: geofence.name,
        timestamp: new Date()
      });

      // Send specific alert to admin
      io.to(circle.admin._id.toString()).emit("adminGeofenceAlert", {
        type: eventType,
        memberId: user._id,
        memberName: user.name,
        geofenceId: geofence._id,
        geofenceName: geofence.name,
        timestamp: new Date()
      });
    }
  } catch (error) {
    console.error('Error sending geofence notification:', error);
  }
};

export default {
  createGeofence,
  updateGeofence,
  deleteGeofence,
  getGeofencesForCircle,
  getGeofencesWithMembers,
  getGeofenceById,
  toggleGeofenceStatus,
  checkGeofenceTriggers
};