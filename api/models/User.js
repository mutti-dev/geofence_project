import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "member"], default: "member" },
    circle: { type: mongoose.Schema.Types.ObjectId, ref: "Circle" },
    location: {
      lat: { type: Number, default: 0 },
      lng: { type: Number, default: 0 },
    },
    address: {
      street: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      country: { type: String, default: "" },
      postalCode: { type: String, default: "" },
      fullAddress: { type: String, default: "" },
    },
    profilePicture: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" }, // For cloudinary or similar service
    },
    pushToken: { type: String },
    settings: {
      notifications: {
        geofenceEnter: { type: Boolean, default: true },
        geofenceExit: { type: Boolean, default: true },
        newPersonAdded: { type: Boolean, default: true },
        personLeft: { type: Boolean, default: true },
        taskAssigned: { type: Boolean, default: true },
        taskAccepted: { type: Boolean, default: true },
        taskDenied: { type: Boolean, default: true },
      },
      locationEnabled: { type: Boolean, default: false },
      theme: { type: String, enum: ["light", "dark"], default: "light" },
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
