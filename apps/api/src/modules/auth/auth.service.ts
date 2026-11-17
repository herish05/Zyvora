import bcrypt from "bcryptjs";
import { createHash, randomInt, randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import { UserModel, type Role } from "./user.model.js";
import type {
  BootstrapAdminInput,
  RequestSigninOtpInput,
  SigninInput,
  SignupInput,
  VerifySigninOtpInput
} from "./auth.schemas.js";
import { SessionModel } from "./session.model.js";
import { redisClient } from "../../config/redis.js";
import { sendSigninOtpEmail } from "../../shared/mailer.js";

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
const OTP_TTL_SECONDS = 5 * 60;
const OTP_MAX_ATTEMPTS = 5;
const OTP_REQUEST_COOLDOWN_SECONDS = 30;

const otpKeyForEmail = (email: string) => `zyvora:otp:signin:${email}`;
const otpRequestCooldownKeyForEmail = (email: string) => `zyvora:otp:signin:cooldown:${email}`;

const hashOtpCode = (code: string) => createHash("sha256").update(code).digest("hex");

const generateOtpCode = () => String(randomInt(0, 1_000_000)).padStart(6, "0");

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

export const requestSigninOtp = async (input: RequestSigninOtpInput) => {
  const email = input.email.toLowerCase();
  const cooldownKey = otpRequestCooldownKeyForEmail(email);
  const retryAfterSeconds = await redisClient.ttl(cooldownKey);

  if (retryAfterSeconds > 0) {
    throw new Error(`Please wait ${retryAfterSeconds} seconds before requesting another OTP`);
  }

  let user = await UserModel.findOne({ email });

  if (!user) {
    const localPart = email.split("@")[0] || "customer";
    user = await UserModel.create({
      email,
      firstName: localPart,
      lastName: "User",
      role: "customer",
      emailVerified: false
    });
  }

  if (user.role !== "customer") {
    throw new Error("OTP sign-in is only available for customer accounts");
  }

  const otp = generateOtpCode();
  const key = otpKeyForEmail(email);

  await redisClient.setEx(
    key,
    OTP_TTL_SECONDS,
    JSON.stringify({
      userId: user._id.toString(),
      otpHash: hashOtpCode(otp),
      attempts: 0
    })
  );

  await redisClient.setEx(cooldownKey, OTP_REQUEST_COOLDOWN_SECONDS, "1");

  await sendSigninOtpEmail(email, otp, OTP_TTL_SECONDS);

  return {
    expiresInSeconds: OTP_TTL_SECONDS,
    retryAfterSeconds: OTP_REQUEST_COOLDOWN_SECONDS
  };
};

export const verifySigninOtp = async (
  input: VerifySigninOtpInput,
  context?: { userAgent?: string; ipAddress?: string }
) => {
  const email = input.email.toLowerCase();
  const key = otpKeyForEmail(email);
  const otpStateRaw = await redisClient.get(key);

  if (!otpStateRaw) {
    throw new Error("OTP expired or not requested");
  }

  const otpState = JSON.parse(otpStateRaw) as {
    userId: string;
    otpHash: string;
    attempts: number;
  };

  if (hashOtpCode(input.otp) !== otpState.otpHash) {
    const nextAttempts = otpState.attempts + 1;

    if (nextAttempts >= OTP_MAX_ATTEMPTS) {
      await redisClient.del(key);
      throw new Error("Too many invalid OTP attempts. Please request a new code.");
    }

    const remainingTtl = await redisClient.ttl(key);
    const ttlSeconds = remainingTtl > 0 ? remainingTtl : OTP_TTL_SECONDS;

    await redisClient.setEx(
      key,
      ttlSeconds,
      JSON.stringify({
        ...otpState,
        attempts: nextAttempts
      })
    );
    throw new Error("Invalid OTP code");
  }

  await redisClient.del(key);

  const user = await UserModel.findById(otpState.userId);
  if (!user) {
    throw new Error("User not found");
  }

  if (!user.emailVerified) {
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
