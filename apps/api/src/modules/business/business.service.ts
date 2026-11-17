import { BusinessProfileModel } from "./business.model.js";
import type { UpdateBusinessProfileInput } from "./business.schemas.js";

const profileKey = "default";

const normalizeOptional = (value?: string) => (value && value.trim().length > 0 ? value : undefined);

export const getOrCreateBusinessProfile = async () => {
  let profile = await BusinessProfileModel.findOne({ key: profileKey });
  if (!profile) {
    profile = await BusinessProfileModel.create({ key: profileKey });
  }
  return profile;
};

export const getPublicBranding = async () => {
  const profile = await getOrCreateBusinessProfile();
  return {
    brandName: profile.websiteDisplayName || profile.brandName,
    tagline: profile.tagline,
    logoUrl: profile.logoUrl,
    primaryColor: profile.primaryColor,
    accentColor: profile.accentColor
  };
};

export const updateBusinessProfile = async (input: UpdateBusinessProfileInput) => {
  const profile = await getOrCreateBusinessProfile();

  profile.brandName = input.brandName;
  profile.legalBusinessName = normalizeOptional(input.legalBusinessName);
  profile.websiteDisplayName = normalizeOptional(input.websiteDisplayName);
  profile.tagline = normalizeOptional(input.tagline);
  profile.logoUrl = normalizeOptional(input.logoUrl);
  profile.faviconUrl = normalizeOptional(input.faviconUrl);
  profile.primaryColor = input.primaryColor;
  profile.accentColor = input.accentColor;
  profile.supportEmail = normalizeOptional(input.supportEmail);
  profile.supportPhone = normalizeOptional(input.supportPhone);
  profile.currency = input.currency.toUpperCase();
  profile.language = input.language;
  profile.timezone = input.timezone;
  profile.socialLinks = {
    instagram: normalizeOptional(input.socialLinks.instagram),
    facebook: normalizeOptional(input.socialLinks.facebook),
    youtube: normalizeOptional(input.socialLinks.youtube),
    linkedin: normalizeOptional(input.socialLinks.linkedin),
    x: normalizeOptional(input.socialLinks.x)
  };

  await profile.save();
  return profile;
};
