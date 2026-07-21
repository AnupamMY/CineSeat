import { app } from "./app.js";
import { connectDatabase } from "./config/database.js";
import { env } from "./config/env.js";
import { startSeatReleaseJob } from "./jobs/releaseExpiredSeats.job.js";

connectDatabase()
  .then(() => {
    app.listen(env.port, () =>
      console.log(`API listening on http://localhost:${env.port}`),
    );
    startSeatReleaseJob();
  })
  .catch((error) => {
    console.error("Database connection failed", error);
    process.exit(1);
  });
