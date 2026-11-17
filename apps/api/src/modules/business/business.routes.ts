import { Router } from "express";
import { failure, success } from "../../shared/api-response.js";
import { requireAuth, requireRoles } from "../auth/auth.middleware.js";
import { updateBusinessProfileSchema } from "./business.schemas.js";
import { getOrCreateBusinessProfile, getPublicBranding, updateBusinessProfile } from "./business.service.js";

const businessRouter = Router();

businessRouter.get("/branding/public", async (_req, res) => {
  const branding = await getPublicBranding();
  res.json(success("Branding fetched", branding));
});

businessRouter.get("/profile", requireAuth, requireRoles("admin"), async (_req, res) => {
  const profile = await getOrCreateBusinessProfile();
  res.json(success("Business profile fetched", profile));
});

businessRouter.put("/profile", requireAuth, requireRoles("admin"), async (req, res) => {
  try {
    const input = updateBusinessProfileSchema.parse(req.body);
    const profile = await updateBusinessProfile(input);
    res.json(success("Business profile updated", profile));
  } catch (error) {
    res.status(400).json(failure("Business profile update failed", error));
  }
});

export { businessRouter };
