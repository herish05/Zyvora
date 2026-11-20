import { Router } from "express";
import { failure, success } from "../../shared/api-response.js";
import { requireAuth, requireRoles } from "../auth/auth.middleware.js";
import { orderIdSchema, placeOrderSchema, updateOrderSchema } from "./order.schemas.js";
import { createOrder, listAdminOrders, listCustomerOrders, updateAdminOrder } from "./order.service.js";

const orderRouter = Router();
orderRouter.use(requireAuth);

orderRouter.post("/orders", requireRoles("customer"), async (req, res) => {
  try {
    const input = placeOrderSchema.parse(req.body);
    const order = await createOrder(req.auth!.userId, input);
    res.status(201).json(success("Order placed", order));
  } catch (error) {
    res.status(400).json(failure("Order could not be placed", error));
  }
});

orderRouter.get("/orders", requireRoles("customer"), async (req, res) => {
  try {
    const orders = await listCustomerOrders(req.auth!.userId);
    res.json(success("Customer orders fetched", orders));
  } catch (error) {
    res.status(400).json(failure("Customer orders could not be fetched", error));
  }
});

orderRouter.get("/admin/orders", requireRoles("admin"), async (_req, res) => {
  try {
    const orders = await listAdminOrders();
    res.json(success("Admin orders fetched", orders));
  } catch (error) {
    res.status(400).json(failure("Admin orders could not be fetched", error));
  }
});

orderRouter.put("/admin/orders/:id", requireRoles("admin"), async (req, res) => {
  try {
    const { id } = orderIdSchema.parse(req.params);
    const input = updateOrderSchema.parse(req.body);
    const order = await updateAdminOrder(id, input);
    res.json(success("Order updated", order));
  } catch (error) {
    res.status(400).json(failure("Order could not be updated", error));
  }
});

export { orderRouter };
