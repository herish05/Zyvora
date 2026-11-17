import mongoose, { Schema, type Types } from "mongoose";

export interface VariantOptionValue {
  attributeCode: string;
  label: string;
  value: string;
}

export interface ProductVariantDoc {
  productId: Types.ObjectId;
  sku: string;
  title?: string;
  optionValues: VariantOptionValue[];
  priceMinor: number;
  compareAtMinor?: number;
  costMinor?: number;
  currency: string;
  taxClass?: string;
  mediaUrls: string[];
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const optionValueSchema = new Schema<VariantOptionValue>(
  {
    attributeCode: { type: String, required: true, trim: true, lowercase: true },
    label: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true }
  },
  { _id: false }
);

const productVariantSchema = new Schema<ProductVariantDoc>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    sku: { type: String, required: true, unique: true, trim: true, uppercase: true },
    title: { type: String, trim: true },
    optionValues: [optionValueSchema],
    priceMinor: { type: Number, required: true, min: 0 },
    compareAtMinor: { type: Number, min: 0 },
    costMinor: { type: Number, min: 0 },
    currency: { type: String, required: true, uppercase: true, minlength: 3, maxlength: 3 },
    taxClass: { type: String, trim: true },
    mediaUrls: [{ type: String }],
    isActive: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0 }
  },
  {
    timestamps: true
  }
);

productVariantSchema.index({ productId: 1, isActive: 1 });

export const ProductVariantModel = mongoose.model<ProductVariantDoc>("ProductVariant", productVariantSchema);
