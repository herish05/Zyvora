import { createClient } from "redis";
import { env } from "./env.js";
import { logger } from "../shared/logger.js";

export const redisClient = createClient({
  url: env.REDIS_URL
});

redisClient.on("error", (error) => {
  logger.error({ error }, "Redis error");
});

export const connectRedis = async (): Promise<void> => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
    logger.info("Redis connected");
  }
};
