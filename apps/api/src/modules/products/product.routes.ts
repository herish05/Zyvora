import { Router } from "express";
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
