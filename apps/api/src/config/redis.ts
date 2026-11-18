import { createClient } from "redis";
import { env } from "./env.js";
import { logger } from "../shared/logger.js";

type MemoryEntry = {
  value: string;
  expiresAt: number;
};

class MemoryRedisFallback {
  private store = new Map<string, MemoryEntry>();

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async setEx(key: string, seconds: number, value: string): Promise<string> {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + seconds * 1000
    });
    return "OK";
  }

  async ttl(key: string): Promise<number> {
    const entry = this.store.get(key);
    if (!entry) return -2;
    const remainingMs = entry.expiresAt - Date.now();
    if (remainingMs <= 0) {
      this.store.delete(key);
      return -2;
    }
    return Math.ceil(remainingMs / 1000);
  }

  async del(key: string): Promise<number> {
    return this.store.delete(key) ? 1 : 0;
  }
}

const memoryFallback = new MemoryRedisFallback();
let useFallback = false;

const rawRedisClient = createClient({
  url: env.REDIS_URL
});

rawRedisClient.on("error", (error) => {
  if (!useFallback) {
    logger.warn({ error }, "Redis client notification");
  }
});

export const redisClient = {
  get isOpen() {
    return rawRedisClient.isOpen;
  },
  async get(key: string): Promise<string | null> {
    if (useFallback || !rawRedisClient.isOpen) {
      return memoryFallback.get(key);
    }
    try {
      return await rawRedisClient.get(key);
    } catch {
      return memoryFallback.get(key);
    }
  },
  async setEx(key: string, seconds: number, value: string): Promise<string> {
    if (useFallback || !rawRedisClient.isOpen) {
      return memoryFallback.setEx(key, seconds, value);
    }
    try {
      return await rawRedisClient.setEx(key, seconds, value);
    } catch {
      return memoryFallback.setEx(key, seconds, value);
    }
  },
  async ttl(key: string): Promise<number> {
    if (useFallback || !rawRedisClient.isOpen) {
      return memoryFallback.ttl(key);
    }
    try {
      return await rawRedisClient.ttl(key);
    } catch {
      return memoryFallback.ttl(key);
    }
  },
  async del(key: string): Promise<number> {
    if (useFallback || !rawRedisClient.isOpen) {
      return memoryFallback.del(key);
    }
    try {
      return await rawRedisClient.del(key);
    } catch {
      return memoryFallback.del(key);
    }
  }
};

export const connectRedis = async (): Promise<void> => {
  if (!env.REDIS_URL) {
    logger.warn("REDIS_URL not configured. Operating with in-memory cache fallback.");
    useFallback = true;
    return;
  }

  try {
    if (!rawRedisClient.isOpen) {
      await rawRedisClient.connect();
      logger.info("Redis connected successfully");
    }
  } catch (error) {
    logger.warn(
      { error },
      "Unable to connect to Redis. Operating with in-memory cache fallback (safe for free tier previews)."
    );
    useFallback = true;
  }
};
