import mongoose from "mongoose";

const showSeatSchema = new mongoose.Schema(
  {
    showId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Show",
      required: true,
    },
    seatNo: { type: String, required: true },
    row: { type: String, required: true },
    type: {
      type: String,
      enum: ["REGULAR", "PREMIUM", "VIP"],
      default: "REGULAR",
    },
    price: { type: Number, required: true },
    status: {
      type: String,
      enum: ["AVAILABLE", "HELD", "BOOKED"],
      default: "AVAILABLE",
    },
    heldBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    holdExpiresAt: Date,
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
  },
  { timestamps: true },
);
showSeatSchema.index({ showId: 1, seatNo: 1 }, { unique: true });

export const ShowSeat = mongoose.model("ShowSeat", showSeatSchema);
