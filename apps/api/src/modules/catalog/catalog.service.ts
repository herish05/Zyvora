import mongoose from "mongoose";
import { AttributeDefinitionModel } from "./attribute-definition.model.js";
import { CategoryModel } from "./category.model.js";
import { ProductModel } from "../products/product.model.js";
import type {
  CreateAttributeDefinitionInput,
  CreateCategoryInput,
  UpdateAttributeDefinitionInput,
  UpdateCategoryInput
} from "./catalog.schemas.js";
import { buildCategoryTree } from "./catalog.utils.js";

const normalizeOptional = (value?: string) => (value && value.trim().length > 0 ? value : undefined);

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const codify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s_]/g, "")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_");

const toObjectId = (id: string) => new mongoose.Types.ObjectId(id);

const ensureParentExists = async (parentCategoryId?: string | null) => {
  if (!parentCategoryId) {
    return;
  }

  const parent = await CategoryModel.findById(parentCategoryId);
  if (!parent) {
    throw new Error("Parent category not found");
  }
};

const ensureCategoryNoCycle = async (categoryId: string, nextParentId?: string | null) => {
  if (!nextParentId) {
    return;
  }

  if (categoryId === nextParentId) {
    throw new Error("Category cannot be its own parent");
  }

  let cursor = await CategoryModel.findById(nextParentId);
  while (cursor?.parentCategoryId) {
    if (cursor.parentCategoryId.toString() === categoryId) {
      throw new Error("Category hierarchy cycle detected");
    }
    cursor = await CategoryModel.findById(cursor.parentCategoryId);
  }
};

const ensureUniqueCategorySlug = async (slug: string, ignoreCategoryId?: string) => {
  const existing = await CategoryModel.findOne({ slug, ...(ignoreCategoryId ? { _id: { $ne: ignoreCategoryId } } : {}) });
  if (existing) {
    throw new Error("Category slug already exists");
  }
};

const ensureUniqueAttributeCode = async (code: string, ignoreAttributeId?: string) => {
  const existing = await AttributeDefinitionModel.findOne({
    code,
    ...(ignoreAttributeId ? { _id: { $ne: ignoreAttributeId } } : {})
  });

  if (existing) {
    throw new Error("Attribute code already exists");
  }
};

const assertAttributeDefinitionsExist = async (ids: string[]) => {
  if (ids.length === 0) {
    return;
  }

  const count = await AttributeDefinitionModel.countDocuments({
    _id: { $in: ids.map(toObjectId) }
  });

  if (count !== ids.length) {
    throw new Error("One or more attribute definitions do not exist");
  }
};

const assertCategoriesExist = async (ids: string[]) => {
  if (ids.length === 0) {
    return;
  }

  const count = await CategoryModel.countDocuments({
    _id: { $in: ids.map(toObjectId) }
  });

  if (count !== ids.length) {
    throw new Error("One or more categories do not exist");
  }
};

export const createCategory = async (input: CreateCategoryInput) => {
  await ensureParentExists(input.parentCategoryId);
  await assertAttributeDefinitionsExist(input.attributeDefinitionIds);

  const slug = input.slug ? input.slug.toLowerCase() : slugify(input.name);
  await ensureUniqueCategorySlug(slug);

  return CategoryModel.create({
    name: input.name,
    slug,
    description: normalizeOptional(input.description),
    imageUrl: normalizeOptional(input.imageUrl),
    parentCategoryId: input.parentCategoryId ? toObjectId(input.parentCategoryId) : undefined,
    isVisible: input.isVisible,
    sortOrder: input.sortOrder,
    attributeDefinitionIds: input.attributeDefinitionIds.map(toObjectId)
  });
};

export const updateCategory = async (id: string, input: UpdateCategoryInput) => {
  const category = await CategoryModel.findById(id);
  if (!category) {
    throw new Error("Category not found");
  }

  if (Object.prototype.hasOwnProperty.call(input, "parentCategoryId")) {
    await ensureParentExists(input.parentCategoryId ?? undefined);
    await ensureCategoryNoCycle(id, input.parentCategoryId ?? undefined);
    category.parentCategoryId = input.parentCategoryId ? toObjectId(input.parentCategoryId) : undefined;
  }

  if (input.name) {
    category.name = input.name;
  }

  if (input.slug) {
    const slug = input.slug.toLowerCase();
    await ensureUniqueCategorySlug(slug, id);
    category.slug = slug;
  }

  if (Object.prototype.hasOwnProperty.call(input, "description")) {
    category.description = normalizeOptional(input.description);
  }

  if (Object.prototype.hasOwnProperty.call(input, "imageUrl")) {
    category.imageUrl = normalizeOptional(input.imageUrl);
  }

  if (typeof input.isVisible === "boolean") {
    category.isVisible = input.isVisible;
  }

  if (typeof input.sortOrder === "number") {
    category.sortOrder = input.sortOrder;
  }

  if (input.attributeDefinitionIds) {
    await assertAttributeDefinitionsExist(input.attributeDefinitionIds);
    category.attributeDefinitionIds = input.attributeDefinitionIds.map(toObjectId);
  }

  await category.save();
  return category;
};

export const deleteCategory = async (id: string) => {
  const category = await CategoryModel.findById(id);
  if (!category) throw new Error("Category not found");
  const [productCount, childCount] = await Promise.all([
    ProductModel.countDocuments({ categoryIds: category._id }),
    CategoryModel.countDocuments({ parentCategoryId: category._id })
  ]);
  if (productCount) throw new Error("Move or remove products from this category before deleting it");
  if (childCount) throw new Error("Move or delete child categories before deleting this category");
  await AttributeDefinitionModel.updateMany(
    { appliesToCategoryIds: category._id },
    { $pull: { appliesToCategoryIds: category._id } }
  );
  await category.deleteOne();
  return { id };
};

export const listAdminCategories = async () =>
  CategoryModel.find({}).sort({ sortOrder: 1, name: 1 }).populate("attributeDefinitionIds").lean();

export const listPublicCategoryTree = async () => {
  const categories = await CategoryModel.find({ isVisible: true }).sort({ sortOrder: 1, name: 1 }).lean();

  return buildCategoryTree(
    categories.map((category) => ({
      id: category._id.toString(),
      name: category.name,
      slug: category.slug,
      description: category.description,
      imageUrl: category.imageUrl,
      parentCategoryId: category.parentCategoryId?.toString(),
      sortOrder: category.sortOrder
    }))
  );
};

const getCategoryLineageIds = async (categoryId: string) => {
  const lineage = new Set<string>();
  let cursor = await CategoryModel.findById(categoryId).lean();

  while (cursor) {
    const id = cursor._id.toString();
    if (lineage.has(id)) {
      break;
    }

    lineage.add(id);
    if (!cursor.parentCategoryId) {
      break;
    }

    cursor = await CategoryModel.findById(cursor.parentCategoryId).lean();
  }

  return [...lineage];
};

export const getCategoryFilterDefinitions = async (slug: string) => {
  const category = await CategoryModel.findOne({ slug, isVisible: true }).lean();
  if (!category) {
    throw new Error("Category not found");
  }

  const lineageIds = await getCategoryLineageIds(category._id.toString());

  const lineageCategories = await CategoryModel.find({ _id: { $in: lineageIds.map(toObjectId) } })
    .select("attributeDefinitionIds")
    .lean();

  const explicitIds = lineageCategories.flatMap((c) => c.attributeDefinitionIds.map((id) => id.toString()));

  const attributes = await AttributeDefinitionModel.find({
    isActive: true,
    $or: [
      { _id: { $in: explicitIds.map(toObjectId) } },
      { appliesToCategoryIds: { $in: lineageIds.map(toObjectId) } }
    ]
  })
    .sort({ name: 1 })
    .lean();

  return {
    category: {
      id: category._id.toString(),
      name: category.name,
      slug: category.slug
    },
    filters: attributes.map((attr) => ({
      id: attr._id.toString(),
      name: attr.name,
      code: attr.code,
      dataType: attr.dataType,
      options: attr.options,
      unit: attr.unit,
      isFilterable: attr.isFilterable,
      isVariantAxis: attr.isVariantAxis
    }))
  };
};

export const createAttributeDefinition = async (input: CreateAttributeDefinitionInput) => {
  await assertCategoriesExist(input.appliesToCategoryIds);

  const code = input.code ? input.code.toLowerCase() : codify(input.name);
  await ensureUniqueAttributeCode(code);

  return AttributeDefinitionModel.create({
    name: input.name,
    code,
    dataType: input.dataType,
    options: input.options,
    unit: normalizeOptional(input.unit),
    isFilterable: input.isFilterable,
    isVariantAxis: input.isVariantAxis,
    appliesToCategoryIds: input.appliesToCategoryIds.map(toObjectId),
    isActive: input.isActive
  });
};

export const updateAttributeDefinition = async (id: string, input: UpdateAttributeDefinitionInput) => {
  const attribute = await AttributeDefinitionModel.findById(id);
  if (!attribute) {
    throw new Error("Attribute definition not found");
  }

  if (input.appliesToCategoryIds) {
    await assertCategoriesExist(input.appliesToCategoryIds);
    attribute.appliesToCategoryIds = input.appliesToCategoryIds.map(toObjectId);
  }

  if (input.name) {
    attribute.name = input.name;
  }

  if (input.code) {
    const code = input.code.toLowerCase();
    await ensureUniqueAttributeCode(code, id);
    attribute.code = code;
  }

  if (input.dataType) {
    attribute.dataType = input.dataType;
  }

  if (input.options) {
    attribute.options = input.options;
  }

  if (Object.prototype.hasOwnProperty.call(input, "unit")) {
    attribute.unit = normalizeOptional(input.unit);
  }

  if (typeof input.isFilterable === "boolean") {
    attribute.isFilterable = input.isFilterable;
  }

  if (typeof input.isVariantAxis === "boolean") {
    attribute.isVariantAxis = input.isVariantAxis;
  }

  if (typeof input.isActive === "boolean") {
    attribute.isActive = input.isActive;
  }

  await attribute.save();
  return attribute;
};

export const listAttributeDefinitions = async () =>
  AttributeDefinitionModel.find({}).sort({ name: 1 }).lean();
