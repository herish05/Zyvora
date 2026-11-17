import { Router } from "express";
import {
  bootstrapAdminSchema,
  requestSigninOtpSchema,
  signinSchema,
  signupSchema,
  verifySigninOtpSchema
} from "./auth.schemas.js";
import { failure, success } from "../../shared/api-response.js";
import {
  bootstrapAdmin,
  requestSigninOtp,
  revokeSessionFromRefreshToken,
  rotateRefreshToken,
  signin,
  signup,
  verifySigninOtp
} from "./auth.service.js";
import { env } from "../../config/env.js";

const authRouter = Router();

const refreshCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/api/v1/auth/refresh"
};

authRouter.post("/signup", async (req, res) => {
  try {
    const input = signupSchema.parse(req.body);
    const result = await signup(input, {
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip
    });

    res.cookie("refreshToken", result.refreshToken, refreshCookieOptions);

    res.status(201).json(
      success("Signup successful", {
        user: result.user,
        accessToken: result.accessToken
      })
    );
  } catch (error) {
    res.status(400).json(failure("Signup failed", error));
  }
});

authRouter.post("/bootstrap-admin", async (req, res) => {
  try {
    const input = bootstrapAdminSchema.parse(req.body);
    const result = await bootstrapAdmin(input, {
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip
    });

    res.cookie("refreshToken", result.refreshToken, refreshCookieOptions);
    res.status(201).json(
      success("Bootstrap admin created", {
        user: result.user,
        accessToken: result.accessToken
      })
    );
  } catch (error) {
    res.status(400).json(failure("Bootstrap admin failed", error));
  }
});

authRouter.post("/signin", async (req, res) => {
  try {
    const input = signinSchema.parse(req.body);
    const result = await signin(input, {
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip
    });

    res.cookie("refreshToken", result.refreshToken, refreshCookieOptions);

    res.json(
      success("Signin successful", {
        user: result.user,
        accessToken: result.accessToken
      })
    );
  } catch (error) {
    res.status(401).json(failure("Signin failed", error));
  }
});

authRouter.post("/otp/request", async (req, res) => {
  try {
    const input = requestSigninOtpSchema.parse(req.body);
    const result = await requestSigninOtp(input);

    res.json(success("OTP sent", result));
  } catch (error) {
    res.status(400).json(failure("Failed to request OTP", error));
  }
});

authRouter.post("/otp/verify", async (req, res) => {
  try {
    const input = verifySigninOtpSchema.parse(req.body);
    const result = await verifySigninOtp(input, {
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip
    });

    res.cookie("refreshToken", result.refreshToken, refreshCookieOptions);
    res.json(
      success("OTP verified", {
        user: result.user,
        accessToken: result.accessToken
      })
    );
  } catch (error) {
    res.status(401).json(failure("OTP verification failed", error));
  }
});

authRouter.post("/refresh", async (req, res) => {
  try {
    const currentRefreshToken = req.cookies.refreshToken as string | undefined;
    if (!currentRefreshToken) {
      res.status(401).json(failure("Missing refresh token"));
      return;
    }

    const result = await rotateRefreshToken(currentRefreshToken, {
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip
    });

    res.cookie("refreshToken", result.refreshToken, refreshCookieOptions);

    res.json(
      success("Token refreshed", {
        user: result.user,
        accessToken: result.accessToken
      })
    );
  } catch (error) {
    res.status(401).json(failure("Token refresh failed", error));
  }
});

authRouter.post("/signout", async (req, res) => {
  const currentRefreshToken = req.cookies.refreshToken as string | undefined;
  if (currentRefreshToken) {
    await revokeSessionFromRefreshToken(currentRefreshToken);
  }

  res.clearCookie("refreshToken", refreshCookieOptions);
  res.json(success("Signed out", { signedOut: true }));
});

export { authRouter };
