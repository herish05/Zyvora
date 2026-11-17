import mongoose, { Schema } from "mongoose";

export interface BusinessProfileDoc {
  key: string;
  brandName: string;
  legalBusinessName?: string;
  websiteDisplayName?: string;
  tagline?: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor: string;
  accentColor: string;
  supportEmail?: string;
  supportPhone?: string;
  currency: string;
  language: string;
  timezone: string;
  socialLinks: {
    instagram?: string;
    facebook?: string;
    youtube?: string;
    linkedin?: string;
    x?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const businessProfileSchema = new Schema<BusinessProfileDoc>(
  {
    key: { type: String, required: true, unique: true, index: true, default: "default" },
    brandName: { type: String, required: true, default: "Zyvora" },
    legalBusinessName: { type: String },
    websiteDisplayName: { type: String },
    tagline: { type: String, default: "Designed for inspired living" },
    logoUrl: { type: String },
    faviconUrl: { type: String },
    primaryColor: { type: String, default: "#A8742A" },
    accentColor: { type: String, default: "#1B1B1B" },
    supportEmail: { type: String },
    supportPhone: { type: String },
    currency: { type: String, default: "INR" },
    language: { type: String, default: "en-IN" },
    timezone: { type: String, default: "Asia/Kolkata" },
    socialLinks: {
      instagram: { type: String },
      facebook: { type: String },
      youtube: { type: String },
      linkedin: { type: String },
      x: { type: String }
    }
  },
  {
    timestamps: true
  }
);

export const BusinessProfileModel = mongoose.model<BusinessProfileDoc>("BusinessProfile", businessProfileSchema);
