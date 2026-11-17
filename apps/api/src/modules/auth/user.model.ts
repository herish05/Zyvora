import mongoose, { Schema } from "mongoose";

export type Role = "customer" | "admin";

export interface UserDoc {
  email: string;
  passwordHash?: string;
  firstName: string;
  lastName: string;
  role: Role;
  googleId?: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDoc>(
  {
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    role: { type: String, enum: ["customer", "admin"], default: "customer", index: true },
    googleId: { type: String, index: true, sparse: true },
    emailVerified: { type: Boolean, default: false }
  },
  {
    timestamps: true
  }
);

export const UserModel = mongoose.model<UserDoc>("User", userSchema);
