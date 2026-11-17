import mongoose from "mongoose";
import { env } from "./env.js";
import { logger } from "../shared/logger.js";

export const connectDatabase = async (): Promise<void> => {
  await mongoose.connect(env.MONGODB_URI, {
    dbName: "zyvora"
  });
  logger.info("MongoDB connected");
};
