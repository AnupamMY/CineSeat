import mongoose from "mongoose";

const showSchema = new mongoose.Schema(
  {
    movieId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Movie",
      required: true,
      index: true,
    },
    screenName: { type: String, required: true },
    showDate: { type: Date, required: true, index: true },
    startTime: { type: String, required: true },
    endTime: String,
    price: { type: Number, required: true, min: 0 },
    totalSeats: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ["SCHEDULED", "CANCELLED", "COMPLETED"],
      default: "SCHEDULED",
    },
  },
  { timestamps: true },
);

export const Show = mongoose.model("Show", showSchema);
