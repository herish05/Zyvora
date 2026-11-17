import mongoose, { Schema, type Types } from "mongoose";

export interface WishlistDoc {
  userId: Types.ObjectId;
  productIds: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const wishlistSchema = new Schema<WishlistDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    productIds: [{ type: Schema.Types.ObjectId, ref: "Product", index: true }]
  },
  {
    timestamps: true
  }
);

export const WishlistModel = mongoose.model<WishlistDoc>("Wishlist", wishlistSchema);
