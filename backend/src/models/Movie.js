import mongoose from "mongoose";

const movieSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    imageUrl: { type: String, default: "" },
    durationMinutes: { type: Number, required: true, min: 1 },
    language: { type: String, required: true },
    genre: [{ type: String, trim: true }],
    releaseDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

export const Movie = mongoose.model("Movie", movieSchema);
