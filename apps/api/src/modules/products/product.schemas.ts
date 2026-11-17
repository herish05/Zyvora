import { z } from "zod";
import { publicationStatuses } from "./product.types.js";

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id format");
const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be kebab-case");
const skuSchema = z.string().regex(/^[A-Z0-9-]+$/, "SKU must be uppercase alphanumeric and dash only");
const optionalUrl = z.string().url().optional().or(z.literal(""));

const productAttributeValueSchema = z.object({
  attributeCode: z.string().regex(/^[a-z0-9_]+$/, "Use snake_case attribute code"),
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())])
});

const variantOptionValueSchema = z.object({
  attributeCode: z.string().regex(/^[a-z0-9_]+$/),
  label: z.string().min(1).max(80),
  value: z.string().min(1).max(80)
});

export const createProductSchema = z.object({
  name: z.string().min(2).max(160),
  slug: slugSchema.optional(),
  skuRoot: skuSchema,
  brand: z.string().max(120).optional(),
  shortDescription: z.string().max(500).optional(),
  description: z.string().max(10000).optional(),
  highlights: z.array(z.string().min(1).max(200)).max(30).default([]),
  tags: z.array(z.string().min(1).max(40)).max(50).default([]),
  categoryIds: z.array(objectIdSchema).min(1),
  publicationStatus: z.enum(publicationStatuses).default("draft"),
  scheduledAt: z.coerce.date().optional(),
  seoTitle: z.string().max(160).optional(),
  seoDescription: z.string().max(320).optional(),
  attributeValues: z.array(productAttributeValueSchema).default([])
});

export const updateProductSchema = createProductSchema.partial();

export const createVariantSchema = z.object({
  sku: skuSchema,
  title: z.string().max(160).optional(),
  optionValues: z.array(variantOptionValueSchema).max(20).default([]),
  priceMinor: z.number().int().min(0),
  compareAtMinor: z.number().int().min(0).optional(),
  costMinor: z.number().int().min(0).optional(),
  currency: z.string().length(3),
  taxClass: z.string().max(80).optional(),
  mediaUrls: z.array(optionalUrl).max(20).default([]),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(-9999).max(9999).default(0),
  initialStock: z.number().int().min(0).default(0),
  lowStockThreshold: z.number().int().min(0).max(100000).default(5)
});

export const updateVariantSchema = createVariantSchema.partial().omit({
  initialStock: true,
  lowStockThreshold: true
});

export const inventoryAdjustmentSchema = z.object({
  delta: z.number().int().refine((n) => n !== 0, "Delta cannot be zero"),
  reason: z.string().min(3).max(120),
  note: z.string().max(500).optional()
});

export const updateLowStockThresholdSchema = z.object({
  lowStockThreshold: z.number().int().min(0).max(100000)
});

export const idParamSchema = z.object({
  id: objectIdSchema
});

export const slugParamSchema = z.object({
  slug: slugSchema
});

export const publicProductQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().max(120).optional(),
  categorySlug: slugSchema.optional()
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateVariantInput = z.infer<typeof createVariantSchema>;
export type UpdateVariantInput = z.infer<typeof updateVariantSchema>;
export type InventoryAdjustmentInput = z.infer<typeof inventoryAdjustmentSchema>;
