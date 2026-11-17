import mongoose, { Schema, type Types } from "mongoose";
import { attributeDataTypes, type AttributeDataType } from "./catalog.types.js";

export interface AttributeDefinitionDoc {
  name: string;
  code: string;
  dataType: AttributeDataType;
  options: string[];
  unit?: string;
  isFilterable: boolean;
  isVariantAxis: boolean;
  appliesToCategoryIds: Types.ObjectId[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const attributeDefinitionSchema = new Schema<AttributeDefinitionDoc>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    dataType: { type: String, required: true, enum: attributeDataTypes },
    options: [{ type: String }],
    unit: { type: String },
    isFilterable: { type: Boolean, default: true, index: true },
    isVariantAxis: { type: Boolean, default: false },
    appliesToCategoryIds: [{ type: Schema.Types.ObjectId, ref: "Category" }],
    isActive: { type: Boolean, default: true, index: true }
  },
  {
    timestamps: true
  }
);

export const AttributeDefinitionModel = mongoose.model<AttributeDefinitionDoc>(
  "AttributeDefinition",
  attributeDefinitionSchema
);
