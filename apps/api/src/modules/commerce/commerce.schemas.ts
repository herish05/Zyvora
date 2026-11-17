import { z } from "zod";

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id format");

export const cartItemInputSchema = z.object({
  variantId: objectIdSchema,
  quantity: z.number().int().min(1).max(50)
});

export const cartItemUpdateSchema = z.object({
  quantity: z.number().int().min(1).max(50)
});

export const wishlistInputSchema = z.object({
  productId: objectIdSchema
});

export const idParamSchema = z.object({
  id: objectIdSchema
});

export type CartItemInput = z.infer<typeof cartItemInputSchema>;
export type CartItemUpdateInput = z.infer<typeof cartItemUpdateSchema>;
export type WishlistInput = z.infer<typeof wishlistInputSchema>;
