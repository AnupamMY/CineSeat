import mongoose from "mongoose";

const bookedSeatSchema = new mongoose.Schema(
  {
    seatNo: { type: String, required: true },
    type: { type: String, enum: ["REGULAR", "PREMIUM", "VIP"], required: true },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const bookingSchema = new mongoose.Schema(
  {
    bookingNumber: { type: String, required: true, unique: true, index: true },
    idempotencyKey: { type: String, sparse: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    showId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Show",
      required: true,
    },
    movieId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Movie",
      required: true,
    },
    movieSnapshot: { name: String, imageUrl: String },
    showSnapshot: { date: Date, startTime: String, screenName: String },
    seats: { type: [bookedSeatSchema], required: true },
    subtotal: { type: Number, required: true, default: 0, min: 0 },
    discounts: [
      {
        _id: false,
        code: { type: String, required: true },
        label: { type: String, required: true },
        percentage: { type: Number, required: true },
        amount: { type: Number, required: true, min: 0 },
      },
    ],
    discountAmount: { type: Number, default: 0, min: 0 },
    totalPrice: { type: Number, required: true },
    status: {
      type: String,
      enum: ["PENDING", "CONFIRMED", "CANCELLED"],
      default: "CONFIRMED",
    },
    emailStatus: {
      type: String,
      enum: ["PENDING", "SENT", "FAILED"],
      default: "PENDING",
    },
    bookedAt: { type: Date, default: Date.now },
    cancelledAt: Date,
  },
  { timestamps: true },
);
bookingSchema.index(
  { userId: 1, idempotencyKey: 1 },
  { unique: true, sparse: true },
);

export const Booking = mongoose.model("Booking", bookingSchema);
