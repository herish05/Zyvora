import mongoose, { Schema, type Types } from "mongoose";

export interface SessionDoc {
  sid: string;
  userId: Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  revokedAt?: Date;
  userAgent?: string;
  ipAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

const sessionSchema = new Schema<SessionDoc>(
  {
    sid: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: true },
    revokedAt: { type: Date },
    userAgent: { type: String },
    ipAddress: { type: String }
  },
  { timestamps: true }
);

export const SessionModel = mongoose.model<SessionDoc>("Session", sessionSchema);
