import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import { apiRouter } from "./routes/index.js";
import { notFound, errorHandler } from "./middlewares/errorHandler.js";

export const app = express();
const allowedOrigins = new Set([
  env.clientUrl,
  "http://localhost:5173",
  "https://cineseat-sigma.vercel.app",
]);
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
if (env.nodeEnv !== "test") app.use(morgan("dev"));
app.get("/health", (req, res) =>
  res.json({ success: true, service: "ticket-booking-api" }),
);
app.use("/api/v1", apiRouter);
app.use(notFound);
app.use(errorHandler);
