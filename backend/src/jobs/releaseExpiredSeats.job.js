import { ShowSeat } from "../models/ShowSeat.js";

export function startSeatReleaseJob() {
  const timer = setInterval(async () => {
    try {
      await ShowSeat.updateMany(
        { status: "HELD", holdExpiresAt: { $lt: new Date() } },
        {
          $set: { status: "AVAILABLE" },
          $unset: { heldBy: "", holdExpiresAt: "" },
        },
      );
    } catch (error) {
      console.error("Failed to release expired seats", error);
    }
  }, 60_000);
  timer.unref();
  return timer;
}
