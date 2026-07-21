import mongoose from "mongoose";
import { Booking } from "../models/Booking.js";
import { Movie } from "../models/Movie.js";
import { Show } from "../models/Show.js";
import { ShowSeat } from "../models/ShowSeat.js";
import { ApiError } from "../utils/ApiError.js";
import { generateBookingNumber } from "../utils/generators.js";
import { sendTicketEmail } from "../services/email.service.js";
import { calculateBookingDiscount } from "../services/discount.service.js";

let transactionSupportCheck;
const supportsTransactions = () => {
  transactionSupportCheck ||= mongoose.connection.db
    .admin()
    .command({ hello: 1 })
    .then((hello) => Boolean(hello.setName || hello.msg === "isdbgrid"));
  return transactionSupportCheck;
};

const bookingData = ({
  userId,
  show,
  movie,
  seats,
  idempotencyKey,
  pricing,
  status = "CONFIRMED",
}) => ({
  bookingNumber: generateBookingNumber(),
  idempotencyKey,
  userId,
  showId: show._id,
  movieId: movie._id,
  movieSnapshot: { name: movie.name, imageUrl: movie.imageUrl },
  showSnapshot: {
    date: show.showDate,
    startTime: show.startTime,
    screenName: show.screenName,
  },
  seats: seats.map(({ seatNo, type, price }) => ({ seatNo, type, price })),
  subtotal: pricing.subtotal,
  discounts: pricing.discounts,
  discountAmount: pricing.discountAmount,
  totalPrice: pricing.totalPrice,
  status,
});

async function confirmWithTransaction({
  showId,
  seatNumbers,
  userId,
  idempotencyKey,
}) {
  const session = await mongoose.startSession();
  let booking;
  try {
    await session.withTransaction(async () => {
      const show = await Show.findOne({
        _id: showId,
        status: "SCHEDULED",
      }).session(session);
      if (!show) throw new ApiError(404, "Scheduled show not found");
      const movie = await Movie.findById(show.movieId).session(session);
      const seats = await ShowSeat.find({
        showId,
        seatNo: { $in: seatNumbers },
        status: "HELD",
        heldBy: userId,
        holdExpiresAt: { $gt: new Date() },
      }).session(session);
      if (seats.length !== seatNumbers.length)
        throw new ApiError(
          409,
          "Your seat hold expired or a seat is unavailable",
        );
      const subtotal = seats.reduce((sum, seat) => sum + seat.price, 0);
      const pricing = await calculateBookingDiscount({
        userId,
        movieId: movie._id,
        seatCount: seats.length,
        subtotal,
        session,
      });
      [booking] = await Booking.create(
        [bookingData({ userId, show, movie, seats, idempotencyKey, pricing })],
        { session },
      );
      const updated = await ShowSeat.updateMany(
        {
          _id: { $in: seats.map((seat) => seat._id) },
          status: "HELD",
          heldBy: userId,
          holdExpiresAt: { $gt: new Date() },
        },
        {
          $set: { status: "BOOKED", bookingId: booking._id },
          $unset: { heldBy: "", holdExpiresAt: "" },
        },
        { session },
      );
      if (updated.modifiedCount !== seats.length)
        throw new ApiError(409, "Seats could not be confirmed");
    });
    return booking;
  } finally {
    await session.endSession();
  }
}

async function confirmWithoutTransaction({
  showId,
  seatNumbers,
  userId,
  idempotencyKey,
}) {
  const show = await Show.findOne({ _id: showId, status: "SCHEDULED" });
  if (!show) throw new ApiError(404, "Scheduled show not found");
  const movie = await Movie.findById(show.movieId);
  if (!movie) throw new ApiError(404, "Movie not found");
  const seats = await ShowSeat.find({
    showId,
    seatNo: { $in: seatNumbers },
    status: "HELD",
    heldBy: userId,
    holdExpiresAt: { $gt: new Date() },
  });
  if (seats.length !== seatNumbers.length)
    throw new ApiError(409, "Your seat hold expired or a seat is unavailable");
  const subtotal = seats.reduce((sum, seat) => sum + seat.price, 0);
  const pricing = await calculateBookingDiscount({
    userId,
    movieId: movie._id,
    seatCount: seats.length,
    subtotal,
  });

  let booking;
  try {
    booking = await Booking.create(
      bookingData({
        userId,
        show,
        movie,
        seats,
        idempotencyKey,
        pricing,
        status: "PENDING",
      }),
    );
    const updated = await ShowSeat.updateMany(
      {
        _id: { $in: seats.map((seat) => seat._id) },
        status: "HELD",
        heldBy: userId,
        holdExpiresAt: { $gt: new Date() },
      },
      {
        $set: { status: "BOOKED", bookingId: booking._id },
        $unset: { heldBy: "", holdExpiresAt: "" },
      },
    );
    if (updated.modifiedCount !== seats.length)
      throw new ApiError(
        409,
        "One or more seat holds expired before confirmation",
      );
    booking.status = "CONFIRMED";
    await booking.save();
    return booking;
  } catch (error) {
    if (booking) {
      await ShowSeat.updateMany(
        { bookingId: booking._id },
        {
          $set: {
            status: "HELD",
            heldBy: userId,
            holdExpiresAt: new Date(Date.now() + 5 * 60_000),
          },
          $unset: { bookingId: "" },
        },
      );
      await Booking.deleteOne({ _id: booking._id, status: "PENDING" });
    }
    throw error;
  }
}

export async function holdSeats(req, res) {
  const { showId, seatNumbers } = req.body;
  const unique = [...new Set(seatNumbers.map((seat) => seat.toUpperCase()))];
  if (unique.length !== seatNumbers.length)
    throw new ApiError(400, "Duplicate seats are not allowed");
  const holdExpiresAt = new Date(Date.now() + 5 * 60_000);
  await ShowSeat.updateMany(
    { showId, status: "HELD", holdExpiresAt: { $lt: new Date() } },
    {
      $set: { status: "AVAILABLE" },
      $unset: { heldBy: "", holdExpiresAt: "" },
    },
  );
  const result = await ShowSeat.updateMany(
    { showId, seatNo: { $in: unique }, status: "AVAILABLE" },
    { $set: { status: "HELD", heldBy: req.user._id, holdExpiresAt } },
  );
  if (result.modifiedCount !== unique.length) {
    await ShowSeat.updateMany(
      { showId, seatNo: { $in: unique }, status: "HELD", heldBy: req.user._id },
      {
        $set: { status: "AVAILABLE" },
        $unset: { heldBy: "", holdExpiresAt: "" },
      },
    );
    throw new ApiError(
      409,
      "One or more selected seats are no longer available",
    );
  }
  const seats = await ShowSeat.find({
    showId,
    seatNo: { $in: unique },
    heldBy: req.user._id,
  }).lean();
  const show = await Show.findById(showId).select("movieId").lean();
  const subtotal = seats.reduce((sum, seat) => sum + seat.price, 0);
  const pricing = await calculateBookingDiscount({
    userId: req.user._id,
    movieId: show.movieId,
    seatCount: seats.length,
    subtotal,
  });
  res.json({ success: true, seats, ...pricing, holdExpiresAt });
}

export async function releaseSeats(req, res) {
  const seatNumbers = [...new Set(req.body.seatNumbers.map((seat) => seat.toUpperCase()))];
  const result = await ShowSeat.updateMany(
    { showId: req.body.showId, seatNo: { $in: seatNumbers }, status: "HELD", heldBy: req.user._id },
    { $set: { status: "AVAILABLE" }, $unset: { heldBy: "", holdExpiresAt: "" } },
  );
  res.json({ success: true, releasedSeats: result.modifiedCount });
}

export async function confirmBooking(req, res) {
  const { showId, idempotencyKey } = req.body;
  const seatNumbers = [
    ...new Set(req.body.seatNumbers.map((seat) => seat.toUpperCase())),
  ];
  const existing = await Booking.findOne({
    userId: req.user._id,
    idempotencyKey,
  });
  if (existing) return res.json({ success: true, booking: existing });
  const parameters = {
    showId,
    seatNumbers,
    userId: req.user._id,
    idempotencyKey,
  };
  let booking;
  try {
    booking = await ((await supportsTransactions())
      ? confirmWithTransaction(parameters)
      : confirmWithoutTransaction(parameters));
  } catch (error) {
    if (error?.code === 11000) {
      const duplicate = await Booking.findOne({
        userId: req.user._id,
        idempotencyKey,
      });
      if (duplicate) return res.json({ success: true, booking: duplicate });
    }
    throw error;
  }
  try {
    await sendTicketEmail(req.user.email, booking);
    await Booking.updateOne({ _id: booking._id }, { emailStatus: "SENT" });
    booking.emailStatus = "SENT";
  } catch {
    await Booking.updateOne({ _id: booking._id }, { emailStatus: "FAILED" });
    booking.emailStatus = "FAILED";
  }
  res.status(201).json({ success: true, booking });
}

export async function myBookings(req, res) {
  const bookings = await Booking.find({ userId: req.user._id })
    .sort({ bookedAt: -1 })
    .lean();
  res.json({ success: true, bookings });
}
export async function getBooking(req, res) {
  const booking = await Booking.findOne({
    _id: req.params.bookingId,
    userId: req.user._id,
  }).lean();
  if (!booking) throw new ApiError(404, "Booking not found");
  res.json({ success: true, booking });
}
export async function cancelBooking(req, res) {
  const booking = await Booking.findOne({
    _id: req.params.bookingId,
    userId: req.user._id,
    status: "CONFIRMED",
  });
  if (!booking) throw new ApiError(404, "Active booking not found");
  const show = await Show.findById(booking.showId);
  if (show.showDate.getTime() < Date.now() + 2 * 60 * 60_000)
    throw new ApiError(
      400,
      "Bookings cannot be cancelled within two hours of the show",
    );
  booking.status = "CANCELLED";
  booking.cancelledAt = new Date();
  await booking.save();
  await ShowSeat.updateMany(
    { bookingId: booking._id },
    { $set: { status: "AVAILABLE" }, $unset: { bookingId: "" } },
  );
  res.json({ success: true, booking });
}
