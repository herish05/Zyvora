import mongoose from "mongoose";
import { ProductModel } from "../products/product.model.js";
import { InventoryModel } from "../products/inventory.model.js";
import { ProductVariantModel } from "../products/product-variant.model.js";
import { CartModel } from "./cart.model.js";
import { WishlistModel } from "./wishlist.model.js";

const toObjectId = (id: string) => new mongoose.Types.ObjectId(id);

const getOrCreateCart = async (userId: string) => {
  let cart = await CartModel.findOne({ userId: toObjectId(userId) });
  if (!cart) {
    cart = await CartModel.create({ userId: toObjectId(userId), items: [] });
  }
  return cart;
};

const getOrCreateWishlist = async (userId: string) => {
  let wishlist = await WishlistModel.findOne({ userId: toObjectId(userId) });
  if (!wishlist) {
    wishlist = await WishlistModel.create({ userId: toObjectId(userId), productIds: [] });
  }
  return wishlist;
};

const buildCartView = async (cart: Awaited<ReturnType<typeof getOrCreateCart>>) => {
  const variantIds = cart.items.map((item) => item.variantId);

  if (variantIds.length === 0) {
    return {
      items: [],
      totals: {
        currency: "INR",
        subtotalMinor: 0,
        discountMinor: 0,
        taxMinor: 0,
        shippingMinor: 0,
        grandTotalMinor: 0
      }
    };
  }

  const variants = await ProductVariantModel.find({ _id: { $in: variantIds }, isActive: true }).lean();
  const inventories = await InventoryModel.find({ variantId: { $in: variantIds } }).lean();
  const products = await ProductModel.find({
    _id: { $in: variants.map((variant) => variant.productId) }
  }).lean();

  const variantMap = new Map(variants.map((variant) => [variant._id.toString(), variant]));
  const inventoryMap = new Map(inventories.map((inventory) => [inventory.variantId.toString(), inventory]));
  const productMap = new Map(products.map((product) => [product._id.toString(), product]));

  const lineItems = cart.items
    .map((item) => {
      const variant = variantMap.get(item.variantId.toString());
      if (!variant) {
        return null;
      }

      const inventory = inventoryMap.get(item.variantId.toString());
      const product = productMap.get(variant.productId.toString());
      const lineSubtotalMinor = variant.priceMinor * item.quantity;

      return {
        variantId: variant._id.toString(),
        sku: variant.sku,
        quantity: item.quantity,
        currency: variant.currency,
        unitPriceMinor: variant.priceMinor,
        lineSubtotalMinor,
        availableStock: inventory?.available ?? 0,
        inStock: !product?.isOutOfStock && (inventory?.available ?? 0) >= item.quantity,
        product: product
          ? {
              id: product._id.toString(),
              name: product.name,
              slug: product.slug,
              publicationStatus: product.publicationStatus
            }
          : null
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const subtotalMinor = lineItems.reduce((sum, item) => sum + item.lineSubtotalMinor, 0);
  const currency = lineItems[0]?.currency ?? "INR";

  return {
    items: lineItems,
    totals: {
      currency,
      subtotalMinor,
      discountMinor: 0,
      taxMinor: 0,
      shippingMinor: 0,
      grandTotalMinor: subtotalMinor
    }
  };
};

const ensureVariantForCart = async (variantId: string, quantity: number) => {
  const variant = await ProductVariantModel.findOne({ _id: toObjectId(variantId), isActive: true });
  if (!variant) {
    throw new Error("Variant not found or inactive");
  }

  const inventory = await InventoryModel.findOne({ variantId: variant._id });
  if (!inventory) {
    throw new Error("Inventory record not found for variant");
  }

  const product = await ProductModel.findById(variant.productId).select("isOutOfStock publicationStatus").lean();
  if (!product || product.publicationStatus !== "published" || product.isOutOfStock) {
    throw new Error("This product is currently unavailable");
  }

  if (inventory.available < quantity) {
    throw new Error("Requested quantity exceeds available stock");
  }

  return { variant, inventory };
};

export const getCart = async (userId: string) => {
  const cart = await getOrCreateCart(userId);
  return buildCartView(cart);
};

export const addCartItem = async (userId: string, input: { variantId: string; quantity: number }) => {
  await ensureVariantForCart(input.variantId, input.quantity);

  const cart = await getOrCreateCart(userId);
  const existing = cart.items.find((item) => item.variantId.toString() === input.variantId);

  if (existing) {
    const nextQuantity = existing.quantity + input.quantity;
    await ensureVariantForCart(input.variantId, nextQuantity);
    existing.quantity = nextQuantity;
  } else {
    cart.items.push({
      variantId: toObjectId(input.variantId),
      quantity: input.quantity,
      addedAt: new Date()
    });
  }

  await cart.save();
  return buildCartView(cart);
};

export const updateCartItem = async (userId: string, variantId: string, quantity: number) => {
  await ensureVariantForCart(variantId, quantity);

  const cart = await getOrCreateCart(userId);
  const item = cart.items.find((entry) => entry.variantId.toString() === variantId);
  if (!item) {
    throw new Error("Cart item not found");
  }

  item.quantity = quantity;
  await cart.save();
  return buildCartView(cart);
};

export const removeCartItem = async (userId: string, variantId: string) => {
  const cart = await getOrCreateCart(userId);
  cart.items = cart.items.filter((entry) => entry.variantId.toString() !== variantId);
  await cart.save();
  return buildCartView(cart);
};

export const getWishlist = async (userId: string) => {
  const wishlist = await getOrCreateWishlist(userId);
  const products = await ProductModel.find({ _id: { $in: wishlist.productIds }, publicationStatus: "published" }).lean();

  return {
    items: products.map((product) => ({
      id: product._id.toString(),
      name: product.name,
      slug: product.slug,
      publicationStatus: product.publicationStatus
    }))
  };
};

export const addWishlistItem = async (userId: string, productId: string) => {
  const product = await ProductModel.findOne({ _id: toObjectId(productId), publicationStatus: "published" });
  if (!product) {
    throw new Error("Product not found or unavailable");
  }

  const wishlist = await getOrCreateWishlist(userId);
  if (!wishlist.productIds.some((id) => id.toString() === productId)) {
    wishlist.productIds.push(toObjectId(productId));
    await wishlist.save();
  }

  return getWishlist(userId);
};

export const removeWishlistItem = async (userId: string, productId: string) => {
  const wishlist = await getOrCreateWishlist(userId);
  wishlist.productIds = wishlist.productIds.filter((id) => id.toString() !== productId);
  await wishlist.save();
  return getWishlist(userId);
};
