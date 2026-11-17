import mongoose, { Schema, type Types } from "mongoose";

export interface CartItemDoc {
  variantId: Types.ObjectId;
  quantity: number;
  addedAt: Date;
}

export interface CartDoc {
  userId: Types.ObjectId;
  items: CartItemDoc[];
  couponCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

const cartItemSchema = new Schema<CartItemDoc>(
  {
    variantId: { type: Schema.Types.ObjectId, ref: "ProductVariant", required: true },
    quantity: { type: Number, required: true, min: 1 },
    addedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const cartSchema = new Schema<CartDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    items: [cartItemSchema],
    couponCode: { type: String }
  },
  {
    timestamps: true
  }
);

export const CartModel = mongoose.model<CartDoc>("Cart", cartSchema);
