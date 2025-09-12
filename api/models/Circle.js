import mongoose from "mongoose";

const InviteSchema = new mongoose.Schema({
  code: { type: String, default: null },
  expiresAt: { type: Date },
});

const CircleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    invite: InviteSchema,
    shareCode: { type: String },
    codeExpiresAt: { type: Date },
    slug: { type: String, unique: true, sparse: true },
  },
  { timestamps: true }
);

// Create a sparse unique index on invite.code so multiple docs without a code (null) are allowed
CircleSchema.index({ "invite.code": 1 }, { unique: true, sparse: true });

export default mongoose.model("Circle", CircleSchema);
