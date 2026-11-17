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

export const bootstrapAdminSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(64),
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  bootstrapKey: z.string().min(16)
});

export type SignupInput = z.infer<typeof signupSchema>;
export type SigninInput = z.infer<typeof signinSchema>;
export type BootstrapAdminInput = z.infer<typeof bootstrapAdminSchema>;
