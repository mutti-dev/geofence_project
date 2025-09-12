import User from "../models/User.js";
import { checkGeofenceTriggers } from "../controllers/geofenceController.js";

export default function registerLocationSocket(io, socket) {
  socket.on("updateLocation", async ({ userId, location }) => {
    try {
      const userBefore = await User.findById(userId);
      
      const user = await User.findByIdAndUpdate(
        userId,
        { location },
        { new: true }
      );

      if (user && user.circle) {
        // Check for geofence triggers
        if (userBefore?.location?.lat && userBefore?.location?.lng) {
          await checkGeofenceTriggers(
            userId, 
            { lat: location.lat, lng: location.lng }, 
            { lat: userBefore.location.lat, lng: userBefore.location.lng }
          );
        } else {
          // First location update - only check entry
          await checkGeofenceTriggers(userId, { lat: location.lat, lng: location.lng });
        }

        // Broadcast location update to the user's circle
        io.to(user.circle.toString()).emit("locationUpdate", {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          location: user.location,
          profilePicture: user.profilePicture,
          updatedAt: new Date()
        });

        // Also broadcast to admin specifically for real-time tracking
        const circle = await User.findById(user.circle).populate('admin');
        if (circle && circle.admin) {
          io.to(circle.admin._id.toString()).emit("memberLocationUpdate", {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            location: user.location,
            profilePicture: user.profilePicture,
            updatedAt: new Date()
          });
        }
      }
    } catch (err) {
      console.error("❌ Error updating location:", err);
    }
  });

  // Handle geofence entry/exit notifications
  socket.on("geofenceEvent", async ({ userId, geofenceId, eventType, memberName, geofenceName }) => {
    try {
      const user = await User.findById(userId).populate('circle');
      if (!user || !user.circle) return;

      // Notify all circle members about geofence events
      io.to(user.circle._id.toString()).emit("geofenceNotification", {
        type: eventType,
        memberId: userId,
        memberName,
        geofenceId,
        geofenceName,
        timestamp: new Date()
      });

      // Send specific notification to admin
      if (user.circle.admin) {
        io.to(user.circle.admin.toString()).emit("adminGeofenceAlert", {
          type: eventType,
          memberId: userId,
          memberName,
          geofenceId,
          geofenceName,
          timestamp: new Date()
        });
      }
    } catch (err) {
      console.error("❌ Error handling geofence event:", err);
    }
  });
}
