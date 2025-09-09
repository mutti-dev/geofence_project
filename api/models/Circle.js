import mongoose from "mongoose";

const InviteSchema = new mongoose.Schema({
  code: { type: String, default: null },
  expiresAt: { type: Date },
});

const CircleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    invite: InviteSchema,
  },
  { timestamps: true }
);

// Create a sparse unique index on invite.code so multiple docs without a code (null) are allowed
CircleSchema.index({ "invite.code": 1 }, { unique: true, sparse: true });

export default mongoose.model("Circle", CircleSchema);
 