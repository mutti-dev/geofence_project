import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: [
        "geofenceEnter",
        "geofenceExit",
        "newPersonAdded",
        "personLeft",
        "taskAssigned",
        "taskAccepted",
        "taskDenied",
        "inviteCodeGenerated"
      ],
      required: true
    },
    message: { type: String, required: true },
    read: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);
