import { Router } from "express";
import { bootstrapAdminSchema, signinSchema, signupSchema } from "./auth.schemas.js";
import { failure, success } from "../../shared/api-response.js";
import { bootstrapAdmin, findOrCreateGoogleUser, revokeSessionFromRefreshToken, rotateRefreshToken, signin, signup } from "./auth.service.js";
import { env } from "../../config/env.js";
import { passport } from "./passport.js";

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

authRouter.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

authRouter.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: `${env.CLIENT_WEB_URL}/signin?error=google_auth` }),
  async (req, res) => {
    try {
      const profile = req.user as {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
      };

      const result = await findOrCreateGoogleUser(profile, {
        userAgent: req.headers["user-agent"],
        ipAddress: req.ip
      });
      res.cookie("refreshToken", result.refreshToken, refreshCookieOptions);

      const redirect = new URL(`${env.CLIENT_WEB_URL}/auth/callback`);
      redirect.searchParams.set("token", result.accessToken);

      res.redirect(redirect.toString());
    } catch (error) {
      res.redirect(`${env.CLIENT_WEB_URL}/signin?error=google_callback`);
    }
  }
);

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
