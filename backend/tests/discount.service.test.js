import test from "node:test";
import assert from "node:assert/strict";
import { buildDiscountBreakdown } from "../src/services/discount.service.js";

const calculate = ({ seatCount, different = false, previousFour = false }) =>
  buildDiscountBreakdown({
    seatCount,
    subtotal: 1000,
    hasBookedDifferentMovie: different,
    hasFourSeatBookingForDifferentMovie: previousFour,
  });
const codes = (result) => result.discounts.map((discount) => discount.code);

test("4+ seats receives 5%", () => {
  const result = calculate({ seatCount: 4 });
  assert.deepEqual(codes(result), ["FOUR_SEATS_5"]);
  assert.equal(result.totalPrice, 950);
});
test("different movie receives 20% capped at ₹200", () => {
  const result = calculate({ seatCount: 2, different: true });
  assert.deepEqual(codes(result), ["DIFFERENT_MOVIE_20"]);
  assert.equal(result.totalPrice, 800);
});
test("4+ seats for a different movie receives 20% plus 5%", () => {
  const result = calculate({ seatCount: 4, different: true });
  assert.deepEqual(codes(result), ["DIFFERENT_MOVIE_20", "FOUR_SEATS_5"]);
  assert.equal(result.totalPrice, 750);
});
test("another movie after previous 4+ seats receives 20% plus 7%", () => {
  const result = calculate({
    seatCount: 2,
    different: true,
    previousFour: true,
  });
  assert.deepEqual(codes(result), [
    "DIFFERENT_MOVIE_20",
    "ANOTHER_MOVIE_BONUS_7",
  ]);
  assert.equal(result.totalPrice, 730);
});
test("4+ seats after previous 4+ seats for another movie receives all discounts", () => {
  const result = calculate({
    seatCount: 4,
    different: true,
    previousFour: true,
  });
  assert.deepEqual(codes(result), [
    "DIFFERENT_MOVIE_20",
    "FOUR_SEATS_5",
    "ANOTHER_MOVIE_BONUS_7",
  ]);
  assert.equal(result.totalPrice, 680);
});
