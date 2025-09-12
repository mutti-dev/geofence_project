import mongoose from "mongoose";

const GeofenceSchema = new mongoose.Schema({
	name: { type: String, required: true },
	description: { type: String, default: "" },
	center: {
		lat: { type: Number, required: true },
		lng: { type: Number, required: true }
	},
	radius: { type: Number, required: true }, // in meters
	circle: { type: mongoose.Schema.Types.ObjectId, ref: 'Circle', required: true },
	createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	active: { type: Boolean, default: true },
	zoneType: { 
		type: String, 
		enum: ['safe', 'restricted', 'custom'], 
		default: 'safe' 
	},
	notifications: {
		onEntry: { type: Boolean, default: true },
		onExit: { type: Boolean, default: false },
		notifyAdmin: { type: Boolean, default: true },
		notifyMember: { type: Boolean, default: false }
	},
	createdAt: { type: Date, default: Date.now },
	updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
GeofenceSchema.pre('save', function(next) {
	this.updatedAt = new Date();
	next();
});

// Index for efficient queries
GeofenceSchema.index({ circle: 1, active: 1 });
GeofenceSchema.index({ createdBy: 1 });

export default mongoose.model("Geofence", GeofenceSchema);
