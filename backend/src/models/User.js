import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
      index: true,
    },
    role: { type: String, enum: ["USER", "ADMIN"], default: "USER" },
    isEmailVerified: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const User = mongoose.model("User", userSchema);
