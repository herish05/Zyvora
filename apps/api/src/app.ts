import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { env } from "./config/env.js";
import { logger } from "./shared/logger.js";
import { healthRouter } from "./modules/health/health.routes.js";
import { businessRouter } from "./modules/business/business.routes.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { catalogRouter } from "./modules/catalog/catalog.routes.js";
import { productRouter } from "./modules/products/product.routes.js";
import { commerceRouter } from "./modules/commerce/commerce.routes.js";

export const app = express();

app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger
  })
);

const allowedOrigins = [
  env.CLIENT_WEB_URL,
  env.ADMIN_WEB_URL,
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",") : [])
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server, Render health check)
      if (!origin) {
        return callback(null, true);
      }
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith(".vercel.app") ||
        /^http:\/\/localhost:\d+$/.test(origin) ||
        /^http:\/\/127\.0\.0\.1:\d+$/.test(origin)
      ) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true
  })
);
app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000
  })
);

app.use("/api/v1/health", healthRouter);
app.use("/api/v1/business", businessRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/catalog", catalogRouter);
app.use("/api/v1", productRouter);
app.use("/api/v1", commerceRouter);

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({ error }, "Unhandled API error");
  res.status(500).json({
    success: false,
    message: "Internal server error"
  });
});
