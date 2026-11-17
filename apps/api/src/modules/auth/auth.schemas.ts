import { z } from "zod";

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(64),
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80)
});

export const signinSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(64)
});

export const requestSigninOtpSchema = z.object({
  email: z.string().email()
});

export const verifySigninOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().regex(/^\d{6}$/, "OTP must be a 6-digit code")
});

export const bootstrapAdminSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(64),
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  bootstrapKey: z.string().min(16)
});

export type SignupInput = z.infer<typeof signupSchema>;
export type SigninInput = z.infer<typeof signinSchema>;
export type RequestSigninOtpInput = z.infer<typeof requestSigninOtpSchema>;
export type VerifySigninOtpInput = z.infer<typeof verifySigninOtpSchema>;
export type BootstrapAdminInput = z.infer<typeof bootstrapAdminSchema>;
