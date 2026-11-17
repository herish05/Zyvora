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
import { passport } from "./modules/auth/passport.js";

export const app = express();

app.use(
  pinoHttp({
    logger
  })
);

app.use(
  cors({
    origin: [env.CLIENT_WEB_URL, env.ADMIN_WEB_URL],
    credentials: true
  })
);
app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(passport.initialize());

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

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({ error }, "Unhandled API error");
  res.status(500).json({
    success: false,
    message: "Internal server error"
  });
});
