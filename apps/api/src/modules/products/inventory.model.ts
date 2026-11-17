import mongoose, { Schema, type Types } from "mongoose";

export interface InventoryDoc {
  variantId: Types.ObjectId;
  available: number;
  reserved: number;
  sold: number;
  lowStockThreshold: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryMovementDoc {
  variantId: Types.ObjectId;
  delta: number;
  reason: string;
  note?: string;
  actorUserId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const inventorySchema = new Schema<InventoryDoc>(
  {
    variantId: { type: Schema.Types.ObjectId, ref: "ProductVariant", required: true, unique: true, index: true },
    available: { type: Number, required: true, default: 0, min: 0 },
    reserved: { type: Number, required: true, default: 0, min: 0 },
    sold: { type: Number, required: true, default: 0, min: 0 },
    lowStockThreshold: { type: Number, required: true, default: 5, min: 0 }
  },
  { timestamps: true }
);

const inventoryMovementSchema = new Schema<InventoryMovementDoc>(
  {
    variantId: { type: Schema.Types.ObjectId, ref: "ProductVariant", required: true, index: true },
    delta: { type: Number, required: true },
    reason: { type: String, required: true, trim: true },
    note: { type: String },
    actorUserId: { type: Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

export const InventoryModel = mongoose.model<InventoryDoc>("Inventory", inventorySchema);
export const InventoryMovementModel = mongoose.model<InventoryMovementDoc>(
  "InventoryMovement",
  inventoryMovementSchema
);
