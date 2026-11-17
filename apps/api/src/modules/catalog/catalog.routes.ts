import { Router } from "express";
import { failure, success } from "../../shared/api-response.js";
import { requireAuth, requireRoles } from "../auth/auth.middleware.js";
import {
  categorySlugParamSchema,
  createAttributeDefinitionSchema,
  createCategorySchema,
  idParamSchema,
  updateAttributeDefinitionSchema,
  updateCategorySchema
} from "./catalog.schemas.js";
import {
  createAttributeDefinition,
  createCategory,
  getCategoryFilterDefinitions,
  listAdminCategories,
  listAttributeDefinitions,
  listPublicCategoryTree,
  updateAttributeDefinition,
  updateCategory
} from "./catalog.service.js";

const catalogRouter = Router();

catalogRouter.get("/categories/public-tree", async (_req, res) => {
  const tree = await listPublicCategoryTree();
  res.json(success("Public category tree fetched", tree));
});

catalogRouter.get("/categories/:slug/filters", async (req, res) => {
  try {
    const { slug } = categorySlugParamSchema.parse(req.params);
    const data = await getCategoryFilterDefinitions(slug);
    res.json(success("Category filters fetched", data));
  } catch (error) {
    res.status(400).json(failure("Category filters fetch failed", error));
  }
});

catalogRouter.get("/admin/categories", requireAuth, requireRoles("admin"), async (_req, res) => {
  const categories = await listAdminCategories();
  res.json(success("Admin categories fetched", categories));
});

catalogRouter.post("/admin/categories", requireAuth, requireRoles("admin"), async (req, res) => {
  try {
    const input = createCategorySchema.parse(req.body);
    const category = await createCategory(input);
    res.status(201).json(success("Category created", category));
  } catch (error) {
    res.status(400).json(failure("Category creation failed", error));
  }
});

catalogRouter.put("/admin/categories/:id", requireAuth, requireRoles("admin"), async (req, res) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    const input = updateCategorySchema.parse(req.body);
    const category = await updateCategory(id, input);
    res.json(success("Category updated", category));
  } catch (error) {
    res.status(400).json(failure("Category update failed", error));
  }
});

catalogRouter.get("/admin/attributes", requireAuth, requireRoles("admin"), async (_req, res) => {
  const attributes = await listAttributeDefinitions();
  res.json(success("Attribute definitions fetched", attributes));
});

catalogRouter.post("/admin/attributes", requireAuth, requireRoles("admin"), async (req, res) => {
  try {
    const input = createAttributeDefinitionSchema.parse(req.body);
    const attribute = await createAttributeDefinition(input);
    res.status(201).json(success("Attribute definition created", attribute));
  } catch (error) {
    res.status(400).json(failure("Attribute definition creation failed", error));
  }
});

catalogRouter.put("/admin/attributes/:id", requireAuth, requireRoles("admin"), async (req, res) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    const input = updateAttributeDefinitionSchema.parse(req.body);
    const attribute = await updateAttributeDefinition(id, input);
    res.json(success("Attribute definition updated", attribute));
  } catch (error) {
    res.status(400).json(failure("Attribute definition update failed", error));
  }
});

export { catalogRouter };
