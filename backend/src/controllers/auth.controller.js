import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Otp } from "../models/Otp.js";
import { User } from "../models/User.js";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";
import { generateOtp } from "../utils/generators.js";
import { sendOtpEmail } from "../services/email.service.js";

export async function requestOtp(req, res) {
  const { email, name } = req.body;
  const recent = await Otp.findOne({
    email,
    createdAt: { $gt: new Date(Date.now() - 60_000) },
  });
  if (recent)
    throw new ApiError(
      429,
      "Please wait one minute before requesting another OTP",
    );
  const otp = generateOtp();
  await Otp.deleteMany({ email });
  const otpRecord = await Otp.create({
    email,
    otpHash: await bcrypt.hash(otp, 10),
    expiresAt: new Date(Date.now() + env.otpExpiresMinutes * 60_000),
  });
  if (name) {
    await User.updateOne(
      { email },
      { $setOnInsert: { email, name, role: "USER" } },
      { upsert: true },
    );
  }

  let delivery;
  try {
    delivery = await sendOtpEmail(email, otp);
  } catch (error) {
    await Otp.deleteOne({ _id: otpRecord._id });
    console.error(`[OTP email failed] recipient=${email}`, error);
    throw new ApiError(
      502,
      "Could not send the verification email. Check the SMTP configuration and try again.",
    );
  }

  if (!delivery.delivered) {
    return res.json({
      success: true,
      message:
        "OTP generated in development preview mode; SMTP is not configured, so no email was sent.",
      emailSent: false,
      developmentOtp: otp,
    });
  }

  res.json({
    success: true,
    message: "OTP sent to your email",
    emailSent: true,
  });
}

export async function verifyOtp(req, res) {
  const { email, otp } = req.body;
  const record = await Otp.findOne({ email }).sort({ createdAt: -1 });
  if (!record || record.expiresAt < new Date())
    throw new ApiError(400, "OTP is invalid or expired");
  if (record.attempts >= 5) throw new ApiError(429, "Too many OTP attempts");
  if (!(await bcrypt.compare(otp, record.otpHash))) {
    await Otp.updateOne({ _id: record._id }, { $inc: { attempts: 1 } });
    throw new ApiError(400, "OTP is invalid or expired");
  }
  // Combined sign-up/sign-in: verification creates a USER account when the
  // email is new, or signs in the existing account without changing its role.
  const user = await User.findOneAndUpdate(
    { email },
    { $set: { isEmailVerified: true }, $setOnInsert: { email, role: "USER" } },
    { upsert: true, new: true },
  );
  await Otp.deleteMany({ email });
  const token = jwt.sign({ sub: user.id }, env.jwtSecret, { expiresIn: "1d" });
  res.cookie("accessToken", token, {
    httpOnly: true,
    secure: env.nodeEnv === "production",
    sameSite: "lax",
    maxAge: 86_400_000,
  });
  res.json({
    success: true,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}

export const me = (req, res) => res.json({ success: true, user: req.user });
export const logout = (req, res) => {
  res.clearCookie("accessToken");
  res.json({ success: true });
};
