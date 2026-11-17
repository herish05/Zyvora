import bcrypt from "bcryptjs";
import { createHash, randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import { UserModel, type Role } from "./user.model.js";
import type { BootstrapAdminInput, SigninInput, SignupInput } from "./auth.schemas.js";
import { SessionModel } from "./session.model.js";

type JwtTtl = `${number}${"ms" | "s" | "m" | "h" | "d" | "w" | "y"}`;

type AuthTokenPayload = {
  userId: string;
  email: string;
  role: Role;
};

type RefreshTokenPayload = AuthTokenPayload & {
  sid: string;
};

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

const buildAccessToken = (payload: AuthTokenPayload) =>
  jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_TTL as JwtTtl
  });

const buildRefreshToken = (payload: RefreshTokenPayload) =>
  jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_TTL as JwtTtl
  });

const getExpiryDateFromToken = (token: string): Date => {
  const decoded = jwt.decode(token) as { exp?: number } | null;
  const expSeconds = decoded?.exp;

  if (!expSeconds) {
    throw new Error("Unable to derive refresh token expiry");
  }

  return new Date(expSeconds * 1000);
};

const issueSessionTokens = async (
  payload: AuthTokenPayload,
  context?: { userAgent?: string; ipAddress?: string }
) => {
  const accessToken = buildAccessToken(payload);
  const sid = randomUUID();
  const refreshToken = buildRefreshToken({ ...payload, sid });

  await SessionModel.create({
    sid,
    userId: payload.userId,
    tokenHash: hashToken(refreshToken),
    expiresAt: getExpiryDateFromToken(refreshToken),
    userAgent: context?.userAgent,
    ipAddress: context?.ipAddress
  });

  return { accessToken, refreshToken };
};

const toPublicUser = (user: { _id: { toString: () => string }; email: string; firstName: string; lastName: string; role: Role }) => ({
  id: user._id.toString(),
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  role: user.role
});

export const signup = async (input: SignupInput, context?: { userAgent?: string; ipAddress?: string }) => {
  const existing = await UserModel.findOne({ email: input.email.toLowerCase() });
  if (existing) {
    throw new Error("Email is already registered");
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await UserModel.create({
    email: input.email.toLowerCase(),
    passwordHash,
    firstName: input.firstName,
    lastName: input.lastName,
    role: "customer",
    emailVerified: false
  });

  const tokens = await issueSessionTokens(
    {
      userId: user._id.toString(),
      email: user.email,
      role: user.role
    },
    context
  );

  return {
    user: toPublicUser(user),
    ...tokens
  };
};

export const signin = async (input: SigninInput, context?: { userAgent?: string; ipAddress?: string }) => {
  const user = await UserModel.findOne({ email: input.email.toLowerCase() });
  if (!user || !user.passwordHash) {
    throw new Error("Invalid credentials");
  }

  const passwordOk = await bcrypt.compare(input.password, user.passwordHash);
  if (!passwordOk) {
    throw new Error("Invalid credentials");
  }

  const tokens = await issueSessionTokens(
    {
      userId: user._id.toString(),
      email: user.email,
      role: user.role
    },
    context
  );

  return {
    user: toPublicUser(user),
    ...tokens
  };
};

export const findOrCreateGoogleUser = async (
  profile: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  },
  context?: { userAgent?: string; ipAddress?: string }
) => {
  let user = await UserModel.findOne({
    $or: [{ googleId: profile.id }, { email: profile.email.toLowerCase() }]
  });

  if (!user) {
    user = await UserModel.create({
      email: profile.email.toLowerCase(),
      firstName: profile.firstName,
      lastName: profile.lastName,
      role: "customer",
      googleId: profile.id,
      emailVerified: true
    });
  } else if (!user.googleId) {
    user.googleId = profile.id;
    user.emailVerified = true;
    await user.save();
  }

  const tokens = await issueSessionTokens(
    {
      userId: user._id.toString(),
      email: user.email,
      role: user.role
    },
    context
  );

  return {
    user: toPublicUser(user),
    ...tokens
  };
};

export const rotateRefreshToken = async (
  refreshToken: string,
  context?: { userAgent?: string; ipAddress?: string }
) => {
  let payload: RefreshTokenPayload;

  try {
    payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
  } catch {
    throw new Error("Invalid refresh token");
  }

  const existingSession = await SessionModel.findOne({ sid: payload.sid, revokedAt: { $exists: false } });
  if (!existingSession) {
    throw new Error("Session not found");
  }

  if (existingSession.expiresAt.getTime() <= Date.now()) {
    throw new Error("Session expired");
  }

  if (existingSession.tokenHash !== hashToken(refreshToken)) {
    existingSession.revokedAt = new Date();
    await existingSession.save();
    throw new Error("Session token mismatch");
  }

  const user = await UserModel.findById(payload.userId);
  if (!user) {
    throw new Error("User not found");
  }

  existingSession.revokedAt = new Date();
  await existingSession.save();

  const tokens = await issueSessionTokens(
    {
      userId: user._id.toString(),
      email: user.email,
      role: user.role
    },
    context
  );

  return {
    user: toPublicUser(user),
    ...tokens
  };
};

export const revokeSessionFromRefreshToken = async (refreshToken: string) => {
  try {
    const payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
    await SessionModel.updateOne(
      { sid: payload.sid, revokedAt: { $exists: false } },
      {
        $set: {
          revokedAt: new Date()
        }
      }
    );
  } catch {
    return;
  }
};

export const bootstrapAdmin = async (
  input: BootstrapAdminInput,
  context?: { userAgent?: string; ipAddress?: string }
) => {
  if (!env.ADMIN_BOOTSTRAP_KEY || input.bootstrapKey !== env.ADMIN_BOOTSTRAP_KEY) {
    throw new Error("Invalid bootstrap key");
  }

  const adminCount = await UserModel.countDocuments({ role: "admin" });
  if (adminCount > 0) {
    throw new Error("Admin account already exists");
  }

  const existing = await UserModel.findOne({ email: input.email.toLowerCase() });
  if (existing) {
    throw new Error("Email is already registered");
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const admin = await UserModel.create({
    email: input.email.toLowerCase(),
    passwordHash,
    firstName: input.firstName,
    lastName: input.lastName,
    role: "admin",
    emailVerified: true
  });

  const tokens = await issueSessionTokens(
    {
      userId: admin._id.toString(),
      email: admin.email,
      role: admin.role
    },
    context
  );

  return {
    user: toPublicUser(admin),
    ...tokens
  };
};
