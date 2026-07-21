import dotenv from "dotenv";

// Resolve the file from this module instead of process.cwd(). This makes env
// loading reliable whether Node is started from the repository root or backend/.
dotenv.config({ path: new URL("../../.env", import.meta.url) });

const requiredInProduction = [
  "MONGODB_URI",
  "JWT_SECRET",
  "SMTP_HOST",
  "SMTP_USER",
  "SMTP_PASSWORD",
  "EMAIL_FROM",
];
if (process.env.NODE_ENV === "production") {
  for (const key of requiredInProduction) {
    if (!process.env[key]) throw new Error(`Missing environment variable: ${key}`);
  }
}

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/ticket_booking",
  jwtSecret: process.env.JWT_SECRET || "development-secret-change-me",
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    from: process.env.EMAIL_FROM || "Tickets <tickets@example.com>",
  },
  isSmtpConfigured: Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASSWORD &&
    process.env.EMAIL_FROM
  ),
  adminEmail: process.env.ADMIN_EMAIL?.toLowerCase(),
  otpExpiresMinutes: Number(process.env.OTP_EXPIRES_MINUTES || 10),
};
