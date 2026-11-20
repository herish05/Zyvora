import { Router } from "express";
import { createHash } from "node:crypto";
import { env } from "../../config/env.js";
import { failure, success } from "../../shared/api-response.js";
import { requireAuth, requireRoles } from "../auth/auth.middleware.js";
import {
  createProductSchema,
  createVariantSchema,
  idParamSchema,
  inventoryAdjustmentSchema,
  publicProductQuerySchema,
  slugParamSchema,
  updateLowStockThresholdSchema,
  updateProductSchema,
  updateVariantSchema
} from "./product.schemas.js";
import {
  adjustVariantInventory,
  createProduct,
  createVariant,
  deleteProduct,
  getAdminProduct,
  getPublicProductBySlug,
  listAdminProducts,
  listLowStockVariants,
  listPublicProducts,
  updateProduct,
  updateVariant,
  updateVariantLowStockThreshold
} from "./product.service.js";

const productRouter = Router();

productRouter.post("/admin/media/signature", requireAuth, requireRoles("admin"), (req, res) => {
  const { CLOUDINARY_CLOUD_NAME: cloudName, CLOUDINARY_API_KEY: apiKey, CLOUDINARY_API_SECRET: apiSecret } = env;

  if (!cloudName || !apiKey || !apiSecret) {
    res.status(503).json(failure("Product media uploads are not configured"));
    return;
  }

  const kind = req.body?.kind ?? "products";
  if (kind !== "products" && kind !== "categories") {
    res.status(400).json(failure("Invalid media destination"));
    return;
  }
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = `zyvora/${kind}`;
  const signature = createHash("sha1")
    .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
    .digest("hex");

  res.json(success("Upload signature created", { cloudName, apiKey, timestamp, folder, signature }));
});

productRouter.get("/public/products", async (req, res) => {
  try {
    const query = publicProductQuerySchema.parse(req.query);
    const data = await listPublicProducts(query);
    res.json(success("Public products fetched", data));
  } catch (error) {
    res.status(400).json(failure("Public products fetch failed", error));
  }
});

productRouter.get("/public/products/:slug", async (req, res) => {
  try {
    const { slug } = slugParamSchema.parse(req.params);
    const product = await getPublicProductBySlug(slug);
    res.json(success("Public product fetched", product));
  } catch (error) {
    res.status(404).json(failure("Public product fetch failed", error));
  }
});

productRouter.get("/admin/products", requireAuth, requireRoles("admin"), async (_req, res) => {
  const products = await listAdminProducts();
  res.json(success("Admin products fetched", products));
});

productRouter.get("/admin/products/:id", requireAuth, requireRoles("admin"), async (req, res) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    const product = await getAdminProduct(id);
    res.json(success("Admin product fetched", product));
  } catch (error) {
    res.status(404).json(failure("Admin product fetch failed", error));
  }
});

productRouter.post("/admin/products", requireAuth, requireRoles("admin"), async (req, res) => {
  try {
    const input = createProductSchema.parse(req.body);
    const product = await createProduct(input);
    res.status(201).json(success("Product created", product));
  } catch (error) {
    res.status(400).json(failure("Product creation failed", error));
  }
});

productRouter.put("/admin/products/:id", requireAuth, requireRoles("admin"), async (req, res) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    const input = updateProductSchema.parse(req.body);
    const product = await updateProduct(id, input);
    res.json(success("Product updated", product));
  } catch (error) {
    res.status(400).json(failure("Product update failed", error));
  }
});

productRouter.delete("/admin/products/:id", requireAuth, requireRoles("admin"), async (req, res) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    const result = await deleteProduct(id);
    res.json(success("Product deleted", result));
  } catch (error) {
    res.status(400).json(failure("Product deletion failed", error));
  }
});

productRouter.post(
  "/admin/products/:id/variants",
  requireAuth,
  requireRoles("admin"),
  async (req, res) => {
    try {
      const { id } = idParamSchema.parse(req.params);
      const input = createVariantSchema.parse(req.body);
      const variant = await createVariant(id, input);
      res.status(201).json(success("Variant created", variant));
    } catch (error) {
      res.status(400).json(failure("Variant creation failed", error));
    }
  }
);

productRouter.put(
  "/admin/variants/:id",
  requireAuth,
  requireRoles("admin"),
  async (req, res) => {
    try {
      const { id } = idParamSchema.parse(req.params);
      const input = updateVariantSchema.parse(req.body);
      const variant = await updateVariant(id, input);
      res.json(success("Variant updated", variant));
    } catch (error) {
      res.status(400).json(failure("Variant update failed", error));
    }
  }
);

productRouter.post(
  "/admin/variants/:id/inventory-adjustments",
  requireAuth,
  requireRoles("admin"),
  async (req, res) => {
    try {
      const { id } = idParamSchema.parse(req.params);
      const input = inventoryAdjustmentSchema.parse(req.body);
      const inventory = await adjustVariantInventory(id, input, req.auth?.userId);
      res.json(success("Inventory adjusted", inventory));
    } catch (error) {
      res.status(400).json(failure("Inventory adjustment failed", error));
    }
  }
);

productRouter.put(
  "/admin/variants/:id/low-stock-threshold",
  requireAuth,
  requireRoles("admin"),
  async (req, res) => {
    try {
      const { id } = idParamSchema.parse(req.params);
      const input = updateLowStockThresholdSchema.parse(req.body);
      const inventory = await updateVariantLowStockThreshold(id, input.lowStockThreshold);
      res.json(success("Low stock threshold updated", inventory));
    } catch (error) {
      res.status(400).json(failure("Low stock threshold update failed", error));
    }
  }
);

productRouter.get(
  "/admin/inventory/low-stock",
  requireAuth,
  requireRoles("admin"),
  async (_req, res) => {
    const lowStock = await listLowStockVariants();
    res.json(success("Low stock variants fetched", lowStock));
  }
);

export { productRouter };
