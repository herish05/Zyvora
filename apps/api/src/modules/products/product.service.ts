import mongoose from "mongoose";
import { CategoryModel } from "../catalog/category.model.js";
import { ProductModel } from "./product.model.js";
import {
  InventoryModel,
  InventoryMovementModel
} from "./inventory.model.js";
import { ProductVariantModel } from "./product-variant.model.js";
import type {
  CreateProductInput,
  CreateVariantInput,
  InventoryAdjustmentInput,
  UpdateProductInput,
  UpdateVariantInput
} from "./product.schemas.js";
import { canTransitionPublicationStatus, type PublicationStatus } from "./product.types.js";

const normalizeOptional = (value?: string) => (value && value.trim().length > 0 ? value.trim() : undefined);

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const toObjectId = (id: string) => new mongoose.Types.ObjectId(id);

const nonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

const validatePriceFields = (input: {
  priceMinor?: number;
  compareAtMinor?: number;
  costMinor?: number;
}) => {
  if (typeof input.compareAtMinor === "number" && typeof input.priceMinor === "number") {
    if (input.compareAtMinor < input.priceMinor) {
      throw new Error("compareAtMinor cannot be lower than priceMinor");
    }
  }

  if (typeof input.costMinor === "number" && typeof input.priceMinor === "number") {
    if (input.costMinor > input.priceMinor) {
      throw new Error("costMinor cannot exceed selling price");
    }
  }
};

const ensureCategoriesExist = async (categoryIds: string[]) => {
  const count = await CategoryModel.countDocuments({
    _id: { $in: categoryIds.map(toObjectId) }
  });

  if (count !== categoryIds.length) {
    throw new Error("One or more categories do not exist");
  }
};

const ensureUniqueProductSlug = async (slug: string, ignoreId?: string) => {
  const exists = await ProductModel.findOne({
    slug,
    ...(ignoreId ? { _id: { $ne: ignoreId } } : {})
  });

  if (exists) {
    throw new Error("Product slug already exists");
  }
};

const ensureUniqueVariantSku = async (sku: string, ignoreId?: string) => {
  const exists = await ProductVariantModel.findOne({
    sku,
    ...(ignoreId ? { _id: { $ne: ignoreId } } : {})
  });

  if (exists) {
    throw new Error("Variant SKU already exists");
  }
};

const applyPublicationTransition = (
  currentStatus: PublicationStatus,
  nextStatus: PublicationStatus
) => {
  if (!canTransitionPublicationStatus(currentStatus, nextStatus)) {
    throw new Error(`Invalid publication transition: ${currentStatus} -> ${nextStatus}`);
  }
};

export const createProduct = async (input: CreateProductInput) => {
  await ensureCategoriesExist(input.categoryIds);

  const slug = (input.slug ? input.slug : slugify(input.name)).toLowerCase();
  await ensureUniqueProductSlug(slug);

  if (input.publicationStatus === "scheduled" && !input.scheduledAt) {
    throw new Error("scheduledAt is required for scheduled publication status");
  }

  const now = new Date();
  const publicationStatus = input.publicationStatus;

  return ProductModel.create({
    name: input.name,
    slug,
    skuRoot: input.skuRoot,
    brand: normalizeOptional(input.brand),
    shortDescription: normalizeOptional(input.shortDescription),
    description: normalizeOptional(input.description),
    highlights: input.highlights,
    tags: input.tags,
    categoryIds: input.categoryIds.map(toObjectId),
    publicationStatus,
    isOutOfStock: input.isOutOfStock,
    isBestSeller: input.isBestSeller,
    publishedAt: publicationStatus === "published" ? now : undefined,
    scheduledAt: publicationStatus === "scheduled" ? input.scheduledAt : undefined,
    seoTitle: normalizeOptional(input.seoTitle),
    seoDescription: normalizeOptional(input.seoDescription),
    attributeValues: input.attributeValues
  });
};

export const updateProduct = async (id: string, input: UpdateProductInput) => {
  const product = await ProductModel.findById(id);
  if (!product) {
    throw new Error("Product not found");
  }

  if (input.categoryIds) {
    await ensureCategoriesExist(input.categoryIds);
    product.categoryIds = input.categoryIds.map(toObjectId);
  }

  if (input.name) {
    product.name = input.name;
  }

  if (input.slug) {
    const slug = input.slug.toLowerCase();
    await ensureUniqueProductSlug(slug, id);
    product.slug = slug;
  }

  if (Object.prototype.hasOwnProperty.call(input, "brand")) {
    product.brand = normalizeOptional(input.brand);
  }

  if (Object.prototype.hasOwnProperty.call(input, "shortDescription")) {
    product.shortDescription = normalizeOptional(input.shortDescription);
  }

  if (Object.prototype.hasOwnProperty.call(input, "description")) {
    product.description = normalizeOptional(input.description);
  }

  if (input.highlights) {
    product.highlights = input.highlights;
  }

  if (input.tags) {
    product.tags = input.tags;
  }

  if (typeof input.isOutOfStock === "boolean") product.isOutOfStock = input.isOutOfStock;
  if (typeof input.isBestSeller === "boolean") product.isBestSeller = input.isBestSeller;

  if (input.attributeValues) {
    product.attributeValues = input.attributeValues;
  }

  if (Object.prototype.hasOwnProperty.call(input, "seoTitle")) {
    product.seoTitle = normalizeOptional(input.seoTitle);
  }

  if (Object.prototype.hasOwnProperty.call(input, "seoDescription")) {
    product.seoDescription = normalizeOptional(input.seoDescription);
  }

  if (input.publicationStatus) {
    applyPublicationTransition(product.publicationStatus, input.publicationStatus);
    product.publicationStatus = input.publicationStatus;

    if (input.publicationStatus === "published") {
      product.publishedAt = new Date();
      product.scheduledAt = undefined;
    }

    if (input.publicationStatus === "scheduled") {
      if (!input.scheduledAt) {
        throw new Error("scheduledAt is required for scheduled publication status");
      }
      product.scheduledAt = input.scheduledAt;
    }
  }

  if (Object.prototype.hasOwnProperty.call(input, "scheduledAt")) {
    product.scheduledAt = input.scheduledAt;
  }

  await product.save();
  return product;
};

export const listAdminProducts = async () =>
  ProductModel.find({}).sort({ updatedAt: -1 }).lean();

export const deleteProduct = async (id: string) => {
  const product = await ProductModel.findById(id).lean();
  if (!product) throw new Error("Product not found");
  const variants = await ProductVariantModel.find({ productId: product._id }).select("_id").lean();
  const variantIds = variants.map((variant) => variant._id);
  await Promise.all([
    InventoryMovementModel.deleteMany({ variantId: { $in: variantIds } }),
    InventoryModel.deleteMany({ variantId: { $in: variantIds } }),
    ProductVariantModel.deleteMany({ _id: { $in: variantIds } })
  ]);
  await ProductModel.deleteOne({ _id: product._id });
  return { id };
};

export const getAdminProduct = async (id: string) => {
  const product = await ProductModel.findById(id).lean();
  if (!product) {
    throw new Error("Product not found");
  }

  const variants = await ProductVariantModel.find({ productId: product._id })
    .sort({ sortOrder: 1, createdAt: 1 })
    .lean();

  const inventories = await InventoryModel.find({
    variantId: { $in: variants.map((v) => v._id) }
  }).lean();

  const inventoryByVariant = new Map(
    inventories.map((inventory) => [inventory.variantId.toString(), inventory])
  );

  return {
    ...product,
    variants: variants.map((variant) => ({
      ...variant,
      inventory: inventoryByVariant.get(variant._id.toString()) ?? null
    }))
  };
};

export const createVariant = async (productId: string, input: CreateVariantInput) => {
  const product = await ProductModel.findById(productId);
  if (!product) {
    throw new Error("Product not found");
  }

  validatePriceFields(input);
  await ensureUniqueVariantSku(input.sku);

  const variant = await ProductVariantModel.create({
    productId: product._id,
    sku: input.sku,
    title: normalizeOptional(input.title),
    optionValues: input.optionValues,
    priceMinor: input.priceMinor,
    compareAtMinor: input.compareAtMinor,
    costMinor: input.costMinor,
    currency: input.currency.toUpperCase(),
    taxClass: normalizeOptional(input.taxClass),
    mediaUrls: input.mediaUrls.filter(nonEmptyString),
    isActive: input.isActive,
    sortOrder: input.sortOrder
  });

  await InventoryModel.create({
    variantId: variant._id,
    available: input.initialStock,
    reserved: 0,
    sold: 0,
    lowStockThreshold: input.lowStockThreshold
  });

  if (input.initialStock !== 0) {
    await InventoryMovementModel.create({
      variantId: variant._id,
      delta: input.initialStock,
      reason: "initial_stock",
      note: "Initial stock on variant creation"
    });
  }

  return variant;
};

export const updateVariant = async (variantId: string, input: UpdateVariantInput) => {
  const variant = await ProductVariantModel.findById(variantId);
  if (!variant) {
    throw new Error("Variant not found");
  }

  validatePriceFields({
    priceMinor: input.priceMinor ?? variant.priceMinor,
    compareAtMinor: input.compareAtMinor ?? variant.compareAtMinor,
    costMinor: input.costMinor ?? variant.costMinor
  });

  if (input.sku) {
    await ensureUniqueVariantSku(input.sku, variantId);
    variant.sku = input.sku;
  }

  if (Object.prototype.hasOwnProperty.call(input, "title")) {
    variant.title = normalizeOptional(input.title);
  }

  if (input.optionValues) {
    variant.optionValues = input.optionValues;
  }

  if (typeof input.priceMinor === "number") {
    variant.priceMinor = input.priceMinor;
  }

  if (Object.prototype.hasOwnProperty.call(input, "compareAtMinor")) {
    variant.compareAtMinor = input.compareAtMinor;
  }

  if (Object.prototype.hasOwnProperty.call(input, "costMinor")) {
    variant.costMinor = input.costMinor;
  }

  if (input.currency) {
    variant.currency = input.currency.toUpperCase();
  }

  if (Object.prototype.hasOwnProperty.call(input, "taxClass")) {
    variant.taxClass = normalizeOptional(input.taxClass);
  }

  if (input.mediaUrls) {
    variant.mediaUrls = input.mediaUrls.filter(nonEmptyString);
  }

  if (typeof input.isActive === "boolean") {
    variant.isActive = input.isActive;
  }

  if (typeof input.sortOrder === "number") {
    variant.sortOrder = input.sortOrder;
  }

  await variant.save();
  return variant;
};

export const adjustVariantInventory = async (
  variantId: string,
  input: InventoryAdjustmentInput,
  actorUserId?: string
) => {
  const variant = await ProductVariantModel.findById(variantId);
  if (!variant) {
    throw new Error("Variant not found");
  }

  const inventory = await InventoryModel.findOne({ variantId: variant._id });
  if (!inventory) {
    throw new Error("Inventory record not found");
  }

  const nextAvailable = inventory.available + input.delta;
  if (nextAvailable < 0) {
    throw new Error("Insufficient available stock for this adjustment");
  }

  inventory.available = nextAvailable;
  await inventory.save();

  await InventoryMovementModel.create({
    variantId: variant._id,
    delta: input.delta,
    reason: input.reason,
    note: normalizeOptional(input.note),
    actorUserId: actorUserId ? toObjectId(actorUserId) : undefined
  });

  return inventory;
};

export const updateVariantLowStockThreshold = async (
  variantId: string,
  lowStockThreshold: number
) => {
  const inventory = await InventoryModel.findOne({ variantId: toObjectId(variantId) });
  if (!inventory) {
    throw new Error("Inventory record not found");
  }

  inventory.lowStockThreshold = lowStockThreshold;
  await inventory.save();
  return inventory;
};

export const listLowStockVariants = async () => {
  const lowInventories = await InventoryModel.find({
    $expr: {
      $lte: ["$available", "$lowStockThreshold"]
    }
  }).lean();

  const variants = await ProductVariantModel.find({
    _id: { $in: lowInventories.map((i) => i.variantId) }
  }).lean();

  const products = await ProductModel.find({
    _id: { $in: variants.map((v) => v.productId) }
  }).lean();

  const variantMap = new Map(variants.map((variant) => [variant._id.toString(), variant]));
  const productMap = new Map(products.map((product) => [product._id.toString(), product]));

  return lowInventories.map((inventory) => {
    const variant = variantMap.get(inventory.variantId.toString());
    const product = variant ? productMap.get(variant.productId.toString()) : undefined;

    return {
      inventory,
      variant,
      product
    };
  });
};

export const listPublicProducts = async (query: {
  page: number;
  limit: number;
  q?: string;
  categorySlug?: string;
}) => {
  const filter: Record<string, unknown> = {
    publicationStatus: "published"
  };

  if (query.q) {
    filter.$text = { $search: query.q };
  }

  if (query.categorySlug) {
    const category = await CategoryModel.findOne({ slug: query.categorySlug, isVisible: true }).lean();
    if (!category) {
      return {
        items: [],
        total: 0,
        page: query.page,
        limit: query.limit
      };
    }

    const visibleCategories = await CategoryModel.find({ isVisible: true }).select("_id parentCategoryId").lean();
    const includedIds = new Set([category._id.toString()]);
    let expanded = true;
    while (expanded) {
      expanded = false;
      for (const child of visibleCategories) {
        if (child.parentCategoryId && includedIds.has(child.parentCategoryId.toString()) && !includedIds.has(child._id.toString())) {
          includedIds.add(child._id.toString());
          expanded = true;
        }
      }
    }
    filter.categoryIds = { $in: [...includedIds].map(toObjectId) };
  }

  const skip = (query.page - 1) * query.limit;

  const [total, products] = await Promise.all([
    ProductModel.countDocuments(filter),
    ProductModel.find(filter)
      .sort({ publishedAt: -1, _id: -1 })
      .skip(skip)
      .limit(query.limit)
      .lean()
  ]);

  const [variants, categories] = await Promise.all([
    ProductVariantModel.find({ productId: { $in: products.map((product) => product._id) }, isActive: true })
      .sort({ sortOrder: 1, createdAt: 1 })
      .lean(),
    CategoryModel.find({ _id: { $in: products.flatMap((product) => product.categoryIds) } }).lean()
  ]);
  const inventories = await InventoryModel.find({ variantId: { $in: variants.map((variant) => variant._id) } }).lean();
  const inventoryByVariant = new Map(inventories.map((inventory) => [inventory.variantId.toString(), inventory]));
  const categoriesById = new Map(categories.map((category) => [category._id.toString(), category]));
  const variantsByProduct = new Map<string, typeof variants>();
  for (const variant of variants) {
    const productId = variant.productId.toString();
    variantsByProduct.set(productId, [...(variantsByProduct.get(productId) ?? []), variant]);
  }

  const items = products.map((product) => ({
    ...product,
    categories: product.categoryIds.map((id) => categoriesById.get(id.toString())).filter(Boolean).map((category) => ({
      id: category!._id.toString(),
      name: category!.name,
      slug: category!.slug
    })),
    variants: (variantsByProduct.get(product._id.toString()) ?? []).map((variant) => ({
      ...variant,
      inventory: product.isOutOfStock
        ? { ...(inventoryByVariant.get(variant._id.toString()) ?? { available: 0 }), available: 0 }
        : inventoryByVariant.get(variant._id.toString()) ?? null
    }))
  }));

  return {
    items,
    total,
    page: query.page,
    limit: query.limit
  };
};

export const getPublicProductBySlug = async (slug: string) => {
  const product = await ProductModel.findOne({ slug, publicationStatus: "published" }).lean();
  if (!product) {
    throw new Error("Product not found");
  }

  const [variants, categories] = await Promise.all([
    ProductVariantModel.find({ productId: product._id, isActive: true }).sort({ sortOrder: 1, createdAt: 1 }).lean(),
    CategoryModel.find({ _id: { $in: product.categoryIds }, isVisible: true }).lean()
  ]);

  const inventories = await InventoryModel.find({
    variantId: { $in: variants.map((v) => v._id) }
  }).lean();

  const inventoryByVariant = new Map(
    inventories.map((inventory) => [inventory.variantId.toString(), inventory])
  );

  return {
    ...product,
    categories: categories.map((category) => ({
      id: category._id.toString(),
      name: category.name,
      slug: category.slug
    })),
    variants: variants.map((variant) => ({
      ...variant,
      inventory: product.isOutOfStock
        ? { ...(inventoryByVariant.get(variant._id.toString()) ?? { available: 0 }), available: 0 }
        : inventoryByVariant.get(variant._id.toString()) ?? null
    }))
  };
};
