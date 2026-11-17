import { z } from "zod";
import { attributeDataTypes } from "./catalog.types.js";

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id format");
const optionalUrl = z.string().url().optional().or(z.literal(""));

export const createCategorySchema = z.object({
  name: z.string().min(2).max(120),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be kebab-case")
    .optional(),
  description: z.string().max(1000).optional(),
  imageUrl: optionalUrl,
  parentCategoryId: objectIdSchema.optional(),
  isVisible: z.boolean().default(true),
  sortOrder: z.number().int().min(-9999).max(9999).default(0),
  attributeDefinitionIds: z.array(objectIdSchema).default([])
});

export const updateCategorySchema = createCategorySchema.partial().extend({
  parentCategoryId: objectIdSchema.nullable().optional()
});

export const createAttributeDefinitionSchema = z.object({
  name: z.string().min(2).max(120),
  code: z
    .string()
    .regex(/^[a-z0-9]+(?:_[a-z0-9]+)*$/, "Code must be snake_case")
    .optional(),
  dataType: z.enum(attributeDataTypes),
  options: z.array(z.string().min(1).max(80)).max(100).default([]),
  unit: z.string().max(30).optional(),
  isFilterable: z.boolean().default(true),
  isVariantAxis: z.boolean().default(false),
  appliesToCategoryIds: z.array(objectIdSchema).default([]),
  isActive: z.boolean().default(true)
});

export const updateAttributeDefinitionSchema = createAttributeDefinitionSchema.partial();

export const idParamSchema = z.object({
  id: objectIdSchema
});

export const categorySlugParamSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateAttributeDefinitionInput = z.infer<typeof createAttributeDefinitionSchema>;
export type UpdateAttributeDefinitionInput = z.infer<typeof updateAttributeDefinitionSchema>;
