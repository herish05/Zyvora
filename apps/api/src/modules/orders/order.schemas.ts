import { z } from "zod";
import { orderStatuses } from "./order.model.js";

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id format");

export const placeOrderSchema = z.object({
  items: z.array(z.object({
    variantId: objectIdSchema,
    quantity: z.number().int().min(1).max(50)
  })).min(1).max(50),
  shippingAddress: z.object({
    fullName: z.string().min(2).max(160),
    mobile: z.string().min(8).max(24),
    line1: z.string().min(4).max(300),
    city: z.string().min(2).max(100),
    state: z.string().min(2).max(100),
    postalCode: z.string().min(4).max(16),
    landmark: z.string().max(200).optional()
  })
});

export const updateOrderSchema = z.object({
  status: z.enum(orderStatuses).optional(),
  paymentStatus: z.enum(["pending", "paid", "refunded"]).optional(),
  trackingNumber: z.string().max(120).optional()
}).refine((value) => Object.values(value).some((field) => field !== undefined), "Provide an order update");

export const orderIdSchema = z.object({ id: objectIdSchema });
export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;
