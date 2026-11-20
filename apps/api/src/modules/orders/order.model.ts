import mongoose, { Schema, type Types } from "mongoose";

export const orderStatuses = ["new", "confirmed", "processing", "shipped", "out_for_delivery", "delivered", "cancelled"] as const;
export type OrderStatus = (typeof orderStatuses)[number];

export interface OrderItemSnapshot {
  productId: Types.ObjectId;
  variantId: Types.ObjectId;
  productName: string;
  productSlug: string;
  sku: string;
  optionLabel: string;
  imageUrl?: string;
  quantity: number;
  unitPriceMinor: number;
  lineTotalMinor: number;
}

export interface OrderDoc {
  orderNumber: string;
  userId: Types.ObjectId;
  customerName: string;
  customerEmail: string;
  status: OrderStatus;
  paymentMethod: "cash_on_delivery";
  paymentStatus: "pending" | "paid" | "refunded";
  items: OrderItemSnapshot[];
  subtotalMinor: number;
  shippingMinor: number;
  totalMinor: number;
  shippingAddress: {
    fullName: string;
    mobile: string;
    line1: string;
    city: string;
    state: string;
    postalCode: string;
    landmark?: string;
  };
  trackingNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

const itemSchema = new Schema<OrderItemSnapshot>({
  productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  variantId: { type: Schema.Types.ObjectId, ref: "ProductVariant", required: true },
  productName: { type: String, required: true },
  productSlug: { type: String, required: true },
  sku: { type: String, required: true },
  optionLabel: { type: String, required: true },
  imageUrl: { type: String },
  quantity: { type: Number, required: true, min: 1 },
  unitPriceMinor: { type: Number, required: true, min: 0 },
  lineTotalMinor: { type: Number, required: true, min: 0 }
}, { _id: false });

const orderSchema = new Schema<OrderDoc>({
  orderNumber: { type: String, required: true, unique: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true, lowercase: true },
  status: { type: String, enum: orderStatuses, default: "new", index: true },
  paymentMethod: { type: String, enum: ["cash_on_delivery"], required: true },
  paymentStatus: { type: String, enum: ["pending", "paid", "refunded"], default: "pending" },
  items: [itemSchema],
  subtotalMinor: { type: Number, required: true, min: 0 },
  shippingMinor: { type: Number, required: true, min: 0, default: 0 },
  totalMinor: { type: Number, required: true, min: 0 },
  shippingAddress: {
    fullName: { type: String, required: true },
    mobile: { type: String, required: true },
    line1: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    landmark: { type: String }
  },
  trackingNumber: { type: String, trim: true }
}, { timestamps: true });

orderSchema.index({ createdAt: -1 });

export const OrderModel = mongoose.model<OrderDoc>("Order", orderSchema);
