import express from 'express';
import {
  createGeofence,
  updateGeofence,
  deleteGeofence,
  getGeofencesForCircle,
} from '../controllers/geofenceController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, createGeofence);
router.put('/:id', protect, updateGeofence);
router.delete('/:id', protect, deleteGeofence);
router.get('/circle', protect, getGeofencesForCircle);

export default router;
