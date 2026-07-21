import { Movie } from "../models/Movie.js";
import { Show } from "../models/Show.js";
import { ShowSeat } from "../models/ShowSeat.js";
import { ApiError } from "../utils/ApiError.js";

export async function listMovies(req, res) {
  const movies = await Movie.find({ status: "ACTIVE" })
    .sort({ releaseDate: -1 })
    .lean();
  res.json({ success: true, movies });
}
export async function getMovie(req, res) {
  const movie = await Movie.findOne({
    _id: req.params.movieId,
    status: "ACTIVE",
  }).lean();
  if (!movie) throw new ApiError(404, "Movie not found");
  res.json({ success: true, movie });
}
export async function movieShows(req, res) {
  const shows = await Show.find({
    movieId: req.params.movieId,
    status: "SCHEDULED",
    showDate: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
  })
    .sort({ showDate: 1, startTime: 1 })
    .lean();
  res.json({ success: true, shows });
}
export async function showSeats(req, res) {
  await ShowSeat.updateMany(
    {
      showId: req.params.showId,
      status: "HELD",
      holdExpiresAt: { $lt: new Date() },
    },
    {
      $set: { status: "AVAILABLE" },
      $unset: { heldBy: "", holdExpiresAt: "" },
    },
  );
  const seats = await ShowSeat.find({ showId: req.params.showId })
    .select("seatNo row type price status holdExpiresAt")
    .sort({ row: 1, seatNo: 1 })
    .lean();
  res.json({ success: true, showId: req.params.showId, seats });
}
