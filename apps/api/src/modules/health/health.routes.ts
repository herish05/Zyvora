import { Router } from "express";
import { success } from "../../shared/api-response.js";

const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  res.json(
    success("Service healthy", {
      service: "zyvora-api",
      timestamp: new Date().toISOString()
    })
  );
});

export { healthRouter };
