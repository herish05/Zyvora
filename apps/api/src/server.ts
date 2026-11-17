import { app } from "./app.js";
import { env } from "./config/env.js";
import { connectDatabase } from "./config/database.js";
import { connectRedis } from "./config/redis.js";
import { logger } from "./shared/logger.js";

const start = async () => {
  try {
    await connectDatabase();
    await connectRedis();

    app.listen(env.API_PORT, () => {
      logger.info(`API listening on port ${env.API_PORT}`);
    });
  } catch (error) {
    logger.error({ error }, "Failed to start API");
    process.exit(1);
  }
};

void start();
