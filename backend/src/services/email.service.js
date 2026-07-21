import nodemailer from "nodemailer";
import { env } from "../config/env.js";

const hasAnySmtpValue = Boolean(
  env.smtp.host || env.smtp.user || env.smtp.password,
);
const missingSmtpVariables = [
  ["SMTP_HOST", env.smtp.host],
  ["SMTP_USER", env.smtp.user],
  ["SMTP_PASSWORD", env.smtp.password],
  ["EMAIL_FROM", process.env.EMAIL_FROM],
]
  .filter(([, value]) => !value)
  .map(([name]) => name);
const transporter = env.isSmtpConfigured
  ? nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.secure,
      auth: env.smtp.user
        ? { user: env.smtp.user, pass: env.smtp.password }
        : undefined,
    })
  : null;

export async function sendEmail({ to, subject, html }) {
  if (hasAnySmtpValue && !env.isSmtpConfigured)
    throw new Error(
      `SMTP configuration is incomplete. Missing: ${missingSmtpVariables.join(", ")}.`,
    );
  if (!transporter) {
    if (env.nodeEnv === "production") throw new Error("SMTP is not configured");
    console.warn(
      `[SMTP preview only] No email was sent. to=${to} subject=${subject}`,
    );
    return { delivered: false, preview: true };
  }
  const info = await transporter.sendMail({
    from: env.smtp.from,
    to,
    subject,
    html,
  });
  console.log(`[email sent] messageId=${info.messageId} to=${to}`);
  return {
    delivered: true,
    messageId: info.messageId,
    accepted: info.accepted,
  };
}

export async function verifySmtpConnection() {
  if (!transporter) return { configured: false, verified: false };
  await transporter.verify();
  return { configured: true, verified: true };
}
export const sendOtpEmail = (email, otp) =>
  sendEmail({
    to: email,
    subject: "Your ticket booking verification code",
    html: `<h2>Verification code</h2><p>Your OTP is <strong>${otp}</strong>.</p><p>It expires in ${env.otpExpiresMinutes} minutes.</p>`,
  });
export const sendTicketEmail = (email, booking) =>
  sendEmail({
    to: email,
    subject: `Ticket confirmed: ${booking.movieSnapshot.name}`,
    html: `<h2>Booking confirmed</h2><p>Booking: ${booking.bookingNumber}</p><p>Movie: ${booking.movieSnapshot.name}</p><p>Date: ${new Date(booking.showSnapshot.date).toLocaleDateString()}</p><p>Time: ${booking.showSnapshot.startTime}</p><p>Screen: ${booking.showSnapshot.screenName}</p><p>Seats: ${booking.seats.map((seat) => seat.seatNo).join(", ")}</p><hr/><p>Subtotal: ₹${booking.subtotal}</p>${booking.discounts?.map((discount) => `<p>${discount.label}: <strong>−₹${discount.amount}</strong></p>`).join("") || ""}<p><strong>Total paid: ₹${booking.totalPrice}</strong></p>`,
  });
