import { app } from "./app.js";
import { env } from "./config/env.js";
import { connectDatabase } from "./config/database.js";
import { connectRedis } from "./config/redis.js";
import { logger } from "./shared/logger.js";

const start = async () => {
  try {
    await connectDatabase();
    await connectRedis();

    const port = Number(process.env.PORT) || env.API_PORT || 4000;
    app.listen(port, "0.0.0.0", () => {
      logger.info(`API listening on 0.0.0.0:${port}`);
    });
  } catch (error) {
    logger.error({ error }, "Failed to start API");
    process.exit(1);
  }
};

void start();
