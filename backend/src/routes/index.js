import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  requestOtp,
  verifyOtp,
  me,
  logout,
} from "../controllers/auth.controller.js";
import {
  listMovies,
  getMovie,
  movieShows,
  showSeats,
} from "../controllers/movie.controller.js";
import {
  holdSeats,
  releaseSeats,
  confirmBooking,
  myBookings,
  getBooking,
  cancelBooking,
} from "../controllers/booking.controller.js";
import {
  createMovie,
  adminMovies,
  updateMovie,
  deactivateMovie,
  createShow,
  listShows,
  updateShow,
  deleteShow,
  listBookings,
  exportBookings,
  stats,
} from "../controllers/admin.controller.js";
import { authenticate, requireAdmin } from "../middlewares/authenticate.js";
import { validate } from "../middlewares/validate.js";
import {
  requestOtpSchema,
  verifyOtpSchema,
  movieSchema,
  movieUpdateSchema,
  showSchema,
  showUpdateSchema,
  holdSchema,
  confirmSchema,
} from "../validators/schemas.js";

export const apiRouter = Router();
const otpLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
});
apiRouter.post(
  "/auth/request-otp",
  otpLimiter,
  validate(requestOtpSchema),
  requestOtp,
);
apiRouter.post(
  "/auth/verify-otp",
  otpLimiter,
  validate(verifyOtpSchema),
  verifyOtp,
);
apiRouter.post("/auth/logout", logout);
apiRouter.get("/auth/me", authenticate, me);
apiRouter.get("/movies", listMovies);
apiRouter.get("/movies/:movieId", getMovie);
apiRouter.get("/movies/:movieId/shows", movieShows);
apiRouter.get("/shows/:showId/seats", showSeats);
apiRouter.post(
  "/bookings/hold-seats",
  authenticate,
  validate(holdSchema),
  holdSeats,
);
apiRouter.post(
  "/bookings/release-seats",
  authenticate,
  validate(holdSchema),
  releaseSeats,
);
apiRouter.post(
  "/bookings/confirm",
  authenticate,
  validate(confirmSchema),
  confirmBooking,
);
apiRouter.get("/bookings/my-bookings", authenticate, myBookings);
apiRouter.get("/bookings/:bookingId", authenticate, getBooking);
apiRouter.patch("/bookings/:bookingId/cancel", authenticate, cancelBooking);
apiRouter.use("/admin", authenticate, requireAdmin);
apiRouter.post("/admin/movies", validate(movieSchema), createMovie);
apiRouter.get("/admin/movies", adminMovies);
apiRouter.patch(
  "/admin/movies/:movieId",
  validate(movieUpdateSchema),
  updateMovie,
);
apiRouter.delete("/admin/movies/:movieId", deactivateMovie);
apiRouter.post("/admin/shows", validate(showSchema), createShow);
apiRouter.get("/admin/shows", listShows);
apiRouter.patch("/admin/shows/:showId", validate(showUpdateSchema), updateShow);
apiRouter.delete("/admin/shows/:showId", deleteShow);
apiRouter.get("/admin/bookings/export", exportBookings);
apiRouter.get("/admin/bookings", listBookings);
apiRouter.get("/admin/stats", stats);
