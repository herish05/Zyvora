import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import type { Role } from "./user.model.js";

type AccessTokenPayload = {
  userId: string;
  email: string;
  role: Role;
};

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ success: false, message: "Authentication required" });
    return;
  }

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
    req.auth = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role
    };
    next();
  } catch {
    res.status(401).json({ success: false, message: "Invalid or expired access token" });
  }
};

export const requireRoles = (...roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = req.auth?.role;
    if (!role || !roles.includes(role)) {
      res.status(403).json({ success: false, message: "Forbidden" });
      return;
    }
    next();
  };
};
