import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");
const envelope = (
  body = z.object({}),
  params = z.object({}).passthrough(),
  query = z.object({}).passthrough(),
) => z.object({ body, params, query });
const tomorrow = () => {
  const value = new Date();
  value.setHours(0, 0, 0, 0);
  value.setDate(value.getDate() + 1);
  return value;
};
const futureDate = z.coerce
  .date()
  .refine((value) => value >= tomorrow(), "Date must be later than today");
const optionalImageUrl = z.preprocess(
  (value) =>
    typeof value === "string" &&
    ["na", "n/a"].includes(value.trim().toLowerCase())
      ? ""
      : value,
  z
    .string()
    .url("Enter a complete URL starting with http:// or https://")
    .or(z.literal("")),
);
const movieBody = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Movie name must contain at least 2 characters")
    .max(120),
  description: z
    .string()
    .trim()
    .min(10, "Description must contain at least 10 characters")
    .max(2000),
  imageUrl: optionalImageUrl,
  durationMinutes: z.coerce
    .number()
    .int()
    .min(1, "Duration must be at least 1 minute")
    .max(600, "Duration cannot exceed 600 minutes"),
  language: z.string().trim().min(2, "Language is required").max(50),
  genre: z.array(z.string().trim().min(1)).min(1, "Add at least one genre"),
  releaseDate: futureDate,
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});
export const requestOtpSchema = envelope(
  z.object({
    email: z
      .string()
      .email()
      .transform((v) => v.toLowerCase()),
    name: z.string().trim().min(2).max(80).optional(),
  }),
);
export const verifyOtpSchema = envelope(
  z.object({
    email: z
      .string()
      .email()
      .transform((v) => v.toLowerCase()),
    otp: z.string().regex(/^\d{6}$/),
  }),
);
export const movieSchema = envelope(movieBody);
export const movieUpdateSchema = envelope(
  movieBody.partial(),
  z.object({ movieId: objectId }),
);
export const showSchema = envelope(
  z.object({
    movieId: objectId,
    screenName: z.string().trim().min(2, "Screen name is required").max(80),
    showDate: futureDate,
    startTime: z.string().regex(/^\d{2}:\d{2}$/, "Choose a valid show time"),
    endTime: z
      .string()
      .regex(/^\d{2}:\d{2}$/)
      .optional(),
    price: z.coerce.number().min(1, "Price must be at least ₹1").max(100000),
    rows: z.coerce
      .number()
      .int()
      .min(1, "Use at least 1 row")
      .max(26, "A screen can have at most 26 rows"),
    seatsPerRow: z.coerce
      .number()
      .int()
      .min(1, "Use at least 1 seat per row")
      .max(50, "A row can have at most 50 seats"),
  }),
);
export const showUpdateSchema = envelope(
  z
    .object({
      movieId: objectId.optional(),
      screenName: z
        .string()
        .trim()
        .min(2, "Screen name is required")
        .max(80)
        .optional(),
      showDate: futureDate.optional(),
      startTime: z
        .string()
        .regex(/^\d{2}:\d{2}$/, "Choose a valid show time")
        .optional(),
      endTime: z
        .string()
        .regex(/^\d{2}:\d{2}$/)
        .optional(),
      price: z.coerce
        .number()
        .min(1, "Price must be at least ₹1")
        .max(100000)
        .optional(),
      status: z.enum(["SCHEDULED", "CANCELLED", "COMPLETED"]).optional(),
    })
    .refine(
      (value) => Object.keys(value).length > 0,
      "Provide at least one field to update",
    ),
  z.object({ showId: objectId }),
);
export const holdSchema = envelope(
  z.object({
    showId: objectId,
    seatNumbers: z.array(z.string()).min(1).max(10),
  }),
);
export const confirmSchema = envelope(
  z.object({
    showId: objectId,
    seatNumbers: z.array(z.string()).min(1).max(10),
    idempotencyKey: z.string().min(8).max(100),
  }),
);
