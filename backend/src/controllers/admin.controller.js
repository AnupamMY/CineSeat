import { Booking } from "../models/Booking.js";
import { Movie } from "../models/Movie.js";
import { Show } from "../models/Show.js";
import { ShowSeat } from "../models/ShowSeat.js";
import { ApiError } from "../utils/ApiError.js";
import { bookingsToCsv } from "../services/csv.service.js";

export async function createMovie(req, res) {
  res
    .status(201)
    .json({
      success: true,
      movie: await Movie.create({ ...req.body, createdBy: req.user._id }),
    });
}
export async function adminMovies(req, res) {
  res.json({
    success: true,
    movies: await Movie.find().sort({ createdAt: -1 }).lean(),
  });
}
export async function updateMovie(req, res) {
  const movie = await Movie.findByIdAndUpdate(req.params.movieId, req.body, {
    new: true,
    runValidators: true,
  });
  if (!movie) throw new ApiError(404, "Movie not found");
  res.json({ success: true, movie });
}
export async function deactivateMovie(req, res) {
  const movie = await Movie.findByIdAndUpdate(
    req.params.movieId,
    { status: "INACTIVE" },
    { new: true },
  );
  if (!movie) throw new ApiError(404, "Movie not found");
  res.json({ success: true, movie });
}
export async function createShow(req, res) {
  const { rows, seatsPerRow, ...showData } = req.body;
  const movie = await Movie.findById(showData.movieId);
  if (!movie) throw new ApiError(404, "Movie not found");
  const show = await Show.create({
    ...showData,
    totalSeats: rows * seatsPerRow,
  });
  const seats = Array.from({ length: rows }, (_, rowIndex) =>
    Array.from({ length: seatsPerRow }, (_, seatIndex) => {
      const row = String.fromCharCode(65 + rowIndex);
      const type =
        rowIndex >= rows - 1
          ? "VIP"
          : rowIndex >= Math.ceil(rows / 2)
            ? "PREMIUM"
            : "REGULAR";
      const multiplier = type === "VIP" ? 1.5 : type === "PREMIUM" ? 1.2 : 1;
      return {
        showId: show._id,
        row,
        seatNo: `${row}${seatIndex + 1}`,
        type,
        price: Math.round(show.price * multiplier),
      };
    }),
  ).flat();
  await ShowSeat.insertMany(seats);
  res.status(201).json({ success: true, show });
}
export async function listShows(req, res) {
  const shows = await Show.find()
    .populate("movieId", "name imageUrl status")
    .sort({ showDate: -1, startTime: 1 })
    .lean();
  res.json({ success: true, shows });
}
export async function updateShow(req, res) {
  if (
    req.body.movieId &&
    !(await Movie.exists({ _id: req.body.movieId, status: "ACTIVE" }))
  )
    throw new ApiError(404, "Active movie not found");
  const show = await Show.findByIdAndUpdate(req.params.showId, req.body, {
    new: true,
    runValidators: true,
  }).populate("movieId", "name imageUrl status");
  if (!show) throw new ApiError(404, "Show not found");
  res.json({ success: true, show });
}
export async function deleteShow(req, res) {
  const show = await Show.findById(req.params.showId);
  if (!show) throw new ApiError(404, "Show not found");
  const hasBookings = await Booking.exists({ showId: show._id });
  if (hasBookings) {
    show.status = "CANCELLED";
    await show.save();
    return res.json({
      success: true,
      deleted: false,
      show,
      message:
        "This show has bookings, so it was cancelled to preserve booking history.",
    });
  }
  await ShowSeat.deleteMany({ showId: show._id });
  await Show.deleteOne({ _id: show._id });
  res.json({
    success: true,
    deleted: true,
    message: "Show and its seat layout deleted.",
  });
}
const bookingFilter = (query) => {
  const filter = {};
  if (query.movieId) filter.movieId = query.movieId;
  if (query.status) filter.status = query.status;
  if (query.user) filter.userId = query.user;
  if (query.date)
    filter["showSnapshot.date"] = {
      $gte: new Date(`${query.date}T00:00:00.000Z`),
      $lt: new Date(`${query.date}T23:59:59.999Z`),
    };
  return filter;
};
export async function listBookings(req, res) {
  const bookings = await Booking.find(bookingFilter(req.query))
    .populate("userId", "name email")
    .sort({ bookedAt: -1 })
    .lean();
  res.json({ success: true, bookings });
}
export async function exportBookings(req, res) {
  const bookings = await Booking.find(bookingFilter(req.query))
    .populate("userId", "name email")
    .lean();
  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=bookings-${Date.now()}.csv`,
  );
  res.send(bookingsToCsv(bookings));
}
export async function stats(req, res) {
  const [result] = await Booking.aggregate([
    {
      $group: {
        _id: null,
        totalBookings: { $sum: 1 },
        confirmedBookings: {
          $sum: { $cond: [{ $eq: ["$status", "CONFIRMED"] }, 1, 0] },
        },
        revenue: {
          $sum: {
            $cond: [{ $eq: ["$status", "CONFIRMED"] }, "$totalPrice", 0],
          },
        },
      },
    },
  ]);
  res.json({
    success: true,
    stats: result || { totalBookings: 0, confirmedBookings: 0, revenue: 0 },
  });
}
