import crypto from "crypto";

export const generateOtp = () => crypto.randomInt(100000, 1000000).toString();
export const generateBookingNumber = () =>
  `BK-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
