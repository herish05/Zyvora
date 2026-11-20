import mongoose from "mongoose";
import { InventoryModel, InventoryMovementModel } from "../products/inventory.model.js";
import { ProductModel } from "../products/product.model.js";
import { ProductVariantModel } from "../products/product-variant.model.js";
import { UserModel } from "../auth/user.model.js";
import type { PlaceOrderInput, UpdateOrderInput } from "./order.schemas.js";
import { OrderModel, type OrderStatus } from "./order.model.js";

const toObjectId = (id: string) => new mongoose.Types.ObjectId(id);

const statusTransitions: Record<OrderStatus, OrderStatus[]> = {
  new: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["out_for_delivery"],
  out_for_delivery: ["delivered"],
  delivered: [],
  cancelled: []
};

export const createOrder = async (userId: string, input: PlaceOrderInput) => {
  const user = await UserModel.findById(userId).lean();
  if (!user) throw new Error("Customer account not found");

  const requested = new Map<string, number>();
  for (const item of input.items) requested.set(item.variantId, (requested.get(item.variantId) ?? 0) + item.quantity);
  const variantIds = [...requested.keys()];
  const variants = await ProductVariantModel.find({ _id: { $in: variantIds }, isActive: true }).lean();
  if (variants.length !== variantIds.length) throw new Error("One or more product options are unavailable");

  const products = await ProductModel.find({
    _id: { $in: variants.map((variant) => variant.productId) },
    publicationStatus: "published"
  }).lean();
  const productById = new Map(products.map((product) => [product._id.toString(), product]));
  const variantById = new Map(variants.map((variant) => [variant._id.toString(), variant]));
  if (products.length !== new Set(variants.map((variant) => variant.productId.toString())).size) {
    throw new Error("One or more products are no longer available");
  }

  const itemSnapshots = variantIds.map((variantId) => {
    const variant = variantById.get(variantId)!;
    const product = productById.get(variant.productId.toString())!;
    const quantity = requested.get(variantId)!;
    const imageUrl = variant.mediaUrls.find((url) => !/\.(mp4|webm|mov|ogg)(\?.*)?$/i.test(url));
    const optionLabel = variant.title || variant.optionValues.map((option) => option.value).join(" / ") || "Standard";
    return {
      productId: product._id,
      variantId: variant._id,
      productName: product.name,
      productSlug: product.slug,
      sku: variant.sku,
      optionLabel,
      imageUrl,
      quantity,
      unitPriceMinor: variant.priceMinor,
      lineTotalMinor: variant.priceMinor * quantity
    };
  });

  const reserved: Array<{ variantId: string; quantity: number }> = [];
  let createdOrderId: mongoose.Types.ObjectId | null = null;
  try {
    for (const [variantId, quantity] of requested) {
      const inventory = await InventoryModel.findOneAndUpdate(
        { variantId: toObjectId(variantId), available: { $gte: quantity } },
        { $inc: { available: -quantity, reserved: quantity } },
        { new: true }
      );
      if (!inventory) throw new Error("Requested quantity is no longer in stock");
      reserved.push({ variantId, quantity });
    }

    const subtotalMinor = itemSnapshots.reduce((sum, item) => sum + item.lineTotalMinor, 0);
    const customerName = `${input.shippingAddress.fullName}`.trim();
    const order = await OrderModel.create({
      orderNumber: `ZYV-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
      userId: toObjectId(userId),
      customerName,
      customerEmail: user.email,
      status: "new",
      paymentMethod: "cash_on_delivery",
      paymentStatus: "pending",
      items: itemSnapshots,
      subtotalMinor,
      shippingMinor: 0,
      totalMinor: subtotalMinor,
      shippingAddress: input.shippingAddress
    });
    createdOrderId = order._id;

    await InventoryMovementModel.insertMany(reserved.map((item) => ({
      variantId: toObjectId(item.variantId),
      delta: -item.quantity,
      reason: "order_placed",
      note: `Reserved for ${order.orderNumber}`,
      actorUserId: toObjectId(userId)
    })));
    return order;
  } catch (error) {
    if (createdOrderId) await OrderModel.deleteOne({ _id: createdOrderId });
    await Promise.all(reserved.map(({ variantId, quantity }) => InventoryModel.updateOne(
      { variantId: toObjectId(variantId) },
      { $inc: { available: quantity, reserved: -quantity } }
    )));
    throw error;
  }
};

export const listCustomerOrders = async (userId: string) => OrderModel.find({ userId: toObjectId(userId) }).sort({ createdAt: -1 }).lean();

export const listAdminOrders = async () => OrderModel.find({}).sort({ createdAt: -1 }).limit(200).lean();

export const updateAdminOrder = async (id: string, input: UpdateOrderInput) => {
  const order = await OrderModel.findById(id);
  if (!order) throw new Error("Order not found");

  if (input.status && input.status !== order.status) {
    if (!statusTransitions[order.status].includes(input.status)) {
      throw new Error(`Cannot move an order from ${order.status} to ${input.status}`);
    }
    if (input.status === "cancelled") {
      for (const item of order.items) {
        await InventoryModel.updateOne(
          { variantId: item.variantId },
          { $inc: { available: item.quantity, reserved: -item.quantity } }
        );
        await InventoryMovementModel.create({
          variantId: item.variantId,
          delta: item.quantity,
          reason: "order_cancelled",
          note: `Restocked from ${order.orderNumber}`
        });
      }
    }
    if (input.status === "delivered") {
      for (const item of order.items) {
        await InventoryModel.updateOne({ variantId: item.variantId }, { $inc: { reserved: -item.quantity, sold: item.quantity } });
      }
    }
    order.status = input.status;
  }

  if (input.paymentStatus) order.paymentStatus = input.paymentStatus;
  if (input.trackingNumber !== undefined) order.trackingNumber = input.trackingNumber.trim() || undefined;
  await order.save();
  return order;
};
