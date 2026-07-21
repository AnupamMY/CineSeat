import { Booking } from "../models/Booking.js";

const percentageAmount = (subtotal, percentage) =>
  Math.round((subtotal * percentage) / 100);

export function buildDiscountBreakdown({
  seatCount,
  subtotal,
  hasBookedDifferentMovie,
  hasFourSeatBookingForDifferentMovie,
}) {
  const discounts = [];
  if (hasBookedDifferentMovie)
    discounts.push({
      code: "DIFFERENT_MOVIE_20",
      label: "Different movie discount (20%, maximum ₹200)",
      percentage: 20,
      amount: Math.min(percentageAmount(subtotal, 20), 200),
    });
  if (seatCount >= 4)
    discounts.push({
      code: "FOUR_SEATS_5",
      label: "Four or more seats discount (5%)",
      percentage: 5,
      amount: percentageAmount(subtotal, 5),
    });
  if (hasFourSeatBookingForDifferentMovie)
    discounts.push({
      code: "ANOTHER_MOVIE_BONUS_7",
      label: "Four-seat customer booking another movie (additional 7%)",
      percentage: 7,
      amount: percentageAmount(subtotal, 7),
    });
  const discountAmount = Math.min(
    subtotal,
    discounts.reduce((total, discount) => total + discount.amount, 0),
  );
  return {
    subtotal,
    discounts,
    discountAmount,
    totalPrice: Math.max(0, subtotal - discountAmount),
  };
}

export async function calculateBookingDiscount({
  userId,
  movieId,
  seatCount,
  subtotal,
  session,
}) {
  const differentMovieQuery = Booking.exists({
    userId,
    movieId: { $ne: movieId },
    status: "CONFIRMED",
  });
  const qualifyingFourSeatQuery = Booking.exists({
    userId,
    movieId: { $ne: movieId },
    status: "CONFIRMED",
    "seats.3": { $exists: true },
  });
  if (session) {
    differentMovieQuery.session(session);
    qualifyingFourSeatQuery.session(session);
  }
  const [hasBookedDifferentMovie, hasFourSeatBookingForDifferentMovie] =
    await Promise.all([
      differentMovieQuery.then(Boolean),
      qualifyingFourSeatQuery.then(Boolean),
    ]);
  return buildDiscountBreakdown({
    seatCount,
    subtotal,
    hasBookedDifferentMovie,
    hasFourSeatBookingForDifferentMovie,
  });
}
