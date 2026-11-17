import mongoose, { Schema, type Types } from "mongoose";

export interface CategoryDoc {
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  parentCategoryId?: Types.ObjectId;
  isVisible: boolean;
  sortOrder: number;
  attributeDefinitionIds: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<CategoryDoc>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    description: { type: String },
    imageUrl: { type: String },
    parentCategoryId: { type: Schema.Types.ObjectId, ref: "Category", index: true },
    isVisible: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0, index: true },
    attributeDefinitionIds: [{ type: Schema.Types.ObjectId, ref: "AttributeDefinition" }]
  },
  {
    timestamps: true
  }
);

export const CategoryModel = mongoose.model<CategoryDoc>("Category", categorySchema);
