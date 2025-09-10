import Geofence from '../models/Geofence.js';
import Circle from '../models/Circle.js';

// Create geofence (admin only)
export const createGeofence = async (req, res, next) => {
  try {
    const userId = req.user.id;
    // ensure user is admin of a circle
    const adminCircle = await Circle.findOne({ admin: userId });
    if (!adminCircle) return res.status(403).json({ message: 'Only circle admin can create geofences' });

    const { name, center, radius, active } = req.body;
    if (!name || !center || center.lat == null || center.lng == null || !radius) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const gf = await Geofence.create({
      name,
      center: { lat: center.lat, lng: center.lng },
      radius,
      createdBy: userId,
      active: active !== undefined ? active : true,
    });

    res.status(201).json(gf);
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

    const { name, center, radius, active } = req.body;
    if (name) geofence.name = name;
    if (center && center.lat != null && center.lng != null) geofence.center = { lat: center.lat, lng: center.lng };
    if (radius != null) geofence.radius = radius;
    if (active != null) geofence.active = active;

    await geofence.save();
    res.json(geofence);
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

    await geofence.remove();
    res.json({ message: 'Deleted' });
  } catch (err) {
    next(err);
  }
};

// List active geofences for user's circle and return circle name
export const getGeofencesForCircle = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const circle = await Circle.findOne({ members: userId });
    if (!circle) return res.status(404).json({ message: 'Circle not found' });

    const geofences = await Geofence.find({ createdBy: circle.admin, active: true });
    return res.json({ circleName: circle.name || 'My Circle', geofences });
  } catch (err) {
    next(err);
  }
};

export default {
  createGeofence,
  updateGeofence,
  deleteGeofence,
  getGeofencesForCircle,
};
