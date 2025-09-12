import express from 'express';
import {
  createGeofence,
  updateGeofence,
  deleteGeofence,
  getGeofencesForCircle,
  getGeofencesWithMembers,
  getGeofenceById,
  toggleGeofenceStatus,
} from '../controllers/geofenceController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Create geofence (admin only)
router.post('/', protect, createGeofence);

// Get geofences for circle (all members)
router.get('/circle', protect, getGeofencesForCircle);

// Get geofences with member locations (admin only)
router.get('/admin', protect, getGeofencesWithMembers);

// Get single geofence details
router.get('/:id', protect, getGeofenceById);

// Update geofence (admin only)
router.put('/:id', protect, updateGeofence);

// Toggle geofence status (admin only)
router.patch('/:id/toggle', protect, toggleGeofenceStatus);

// Delete geofence (admin only)
router.delete('/:id', protect, deleteGeofence);

export default router;
