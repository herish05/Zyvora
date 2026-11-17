import { Router } from "express";
import { failure, success } from "../../shared/api-response.js";
import { requireAuth } from "../auth/auth.middleware.js";
import { cartItemInputSchema, cartItemUpdateSchema, idParamSchema, wishlistInputSchema } from "./commerce.schemas.js";
import {
  addCartItem,
  addWishlistItem,
  getCart,
  getWishlist,
  removeCartItem,
  removeWishlistItem,
  updateCartItem
} from "./commerce.service.js";

const commerceRouter = Router();

commerceRouter.use(requireAuth);

commerceRouter.get("/cart", async (req, res) => {
  try {
    const data = await getCart(req.auth!.userId);
    res.json(success("Cart fetched", data));
  } catch (error) {
    res.status(400).json(failure("Cart fetch failed", error));
  }
});

commerceRouter.post("/cart/items", async (req, res) => {
  try {
    const input = cartItemInputSchema.parse(req.body);
    const data = await addCartItem(req.auth!.userId, input);
    res.json(success("Cart item added", data));
  } catch (error) {
    res.status(400).json(failure("Add to cart failed", error));
  }
});

commerceRouter.put("/cart/items/:id", async (req, res) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    const input = cartItemUpdateSchema.parse(req.body);
    const data = await updateCartItem(req.auth!.userId, id, input.quantity);
    res.json(success("Cart item updated", data));
  } catch (error) {
    res.status(400).json(failure("Cart update failed", error));
  }
});

commerceRouter.delete("/cart/items/:id", async (req, res) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    const data = await removeCartItem(req.auth!.userId, id);
    res.json(success("Cart item removed", data));
  } catch (error) {
    res.status(400).json(failure("Remove from cart failed", error));
  }
});

commerceRouter.get("/wishlist", async (req, res) => {
  try {
    const data = await getWishlist(req.auth!.userId);
    res.json(success("Wishlist fetched", data));
  } catch (error) {
    res.status(400).json(failure("Wishlist fetch failed", error));
  }
});

commerceRouter.post("/wishlist/items", async (req, res) => {
  try {
    const input = wishlistInputSchema.parse(req.body);
    const data = await addWishlistItem(req.auth!.userId, input.productId);
    res.json(success("Wishlist item added", data));
  } catch (error) {
    res.status(400).json(failure("Add to wishlist failed", error));
  }
});

commerceRouter.delete("/wishlist/items/:id", async (req, res) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    const data = await removeWishlistItem(req.auth!.userId, id);
    res.json(success("Wishlist item removed", data));
  } catch (error) {
    res.status(400).json(failure("Remove from wishlist failed", error));
  }
});

export { commerceRouter };
