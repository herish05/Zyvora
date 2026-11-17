import { z } from "zod";

const optionalUrl = z.string().url().optional().or(z.literal(""));

export const updateBusinessProfileSchema = z.object({
  brandName: z.string().min(2).max(120),
  legalBusinessName: z.string().max(160).optional(),
  websiteDisplayName: z.string().max(120).optional(),
  tagline: z.string().max(220).optional(),
  logoUrl: optionalUrl,
  faviconUrl: optionalUrl,
  primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6})$/, "Use 6-digit hex color"),
  accentColor: z.string().regex(/^#([A-Fa-f0-9]{6})$/, "Use 6-digit hex color"),
  supportEmail: z.string().email().optional(),
  supportPhone: z.string().max(40).optional(),
  currency: z.string().min(3).max(3),
  language: z.string().min(2).max(12),
  timezone: z.string().min(3).max(64),
  socialLinks: z
    .object({
      instagram: optionalUrl,
      facebook: optionalUrl,
      youtube: optionalUrl,
      linkedin: optionalUrl,
      x: optionalUrl
    })
    .default({})
});

export type UpdateBusinessProfileInput = z.infer<typeof updateBusinessProfileSchema>;
