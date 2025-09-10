import mongoose from "mongoose";

const GeofenceSchema = new mongoose.Schema({
	name: { type: String, required: true },
	center: {
		lat: { type: Number, required: true },
		lng: { type: Number, required: true }
	},
	radius: { type: Number, required: true },
	createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	active: { type: Boolean, default: true },
	createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Geofence", GeofenceSchema);
