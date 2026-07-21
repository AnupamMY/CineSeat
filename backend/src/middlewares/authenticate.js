import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../models/User.js";

export async function authenticate(req, res, next) {
  try {
    const token = req.cookies.accessToken;
    if (!token)
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    const payload = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(payload.sub).select(
      "name email role isEmailVerified",
    );
    if (!user)
      return res
        .status(401)
        .json({ success: false, message: "User no longer exists" });
    req.user = user;
    next();
  } catch {
    res
      .status(401)
      .json({ success: false, message: "Invalid or expired session" });
  }
}

export const requireAdmin = (req, res, next) =>
  req.user.role === "ADMIN"
    ? next()
    : res
        .status(403)
        .json({ success: false, message: "Admin access required" });
