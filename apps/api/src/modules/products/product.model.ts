import mongoose, { Schema, type Types } from "mongoose";
import { publicationStatuses, type PublicationStatus } from "./product.types.js";

export interface ProductAttributeValue {
  attributeCode: string;
  value: string | number | boolean | string[];
}

export interface ProductDoc {
  name: string;
  slug: string;
  skuRoot: string;
  brand?: string;
  shortDescription?: string;
  description?: string;
  highlights: string[];
  tags: string[];
  categoryIds: Types.ObjectId[];
  publicationStatus: PublicationStatus;
  publishedAt?: Date;
  scheduledAt?: Date;
  seoTitle?: string;
  seoDescription?: string;
  attributeValues: ProductAttributeValue[];
  createdAt: Date;
  updatedAt: Date;
}

const productAttributeValueSchema = new Schema<ProductAttributeValue>(
  {
    attributeCode: { type: String, required: true, trim: true, lowercase: true },
    value: { type: Schema.Types.Mixed, required: true }
  },
  { _id: false }
);

const productSchema = new Schema<ProductDoc>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true, trim: true, lowercase: true },
    skuRoot: { type: String, required: true, trim: true, uppercase: true },
    brand: { type: String, trim: true },
    shortDescription: { type: String },
    description: { type: String },
    highlights: [{ type: String }],
    tags: [{ type: String, lowercase: true, trim: true }],
    categoryIds: [{ type: Schema.Types.ObjectId, ref: "Category", index: true }],
    publicationStatus: {
      type: String,
      enum: publicationStatuses,
      default: "draft",
      index: true
    },
    publishedAt: { type: Date },
    scheduledAt: { type: Date },
    seoTitle: { type: String },
    seoDescription: { type: String },
    attributeValues: [productAttributeValueSchema]
  },
  {
    timestamps: true
  }
);

productSchema.index({ name: "text", brand: "text", tags: "text" });

export const ProductModel = mongoose.model<ProductDoc>("Product", productSchema);
