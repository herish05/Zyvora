import nodemailer, { type Transporter } from "nodemailer";
import { env } from "../config/env.js";
import { logger } from "./logger.js";

type MailInput = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

const hasSmtpConfig = () =>
  Boolean(env.SMTP_HOST && env.SMTP_PORT && env.SMTP_USER && env.SMTP_PASS && env.MAIL_FROM);

let transporter: Transporter | null = null;

const getTransporter = () => {
  if (transporter) {
    return transporter;
  }

  if (!hasSmtpConfig()) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: Number(env.SMTP_PORT),
    secure: Number(env.SMTP_PORT) === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS
    }
  });

  return transporter;
};

export const sendMail = async (input: MailInput) => {
  const activeTransporter = getTransporter();
  if (!activeTransporter) {
    throw new Error("SMTP is not configured");
  }

  await activeTransporter.sendMail({
    from: env.MAIL_FROM,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html
  });
};

export const sendSigninOtpEmail = async (email: string, otp: string, expiresInSeconds: number) => {
  const expiresInMinutes = Math.floor(expiresInSeconds / 60);
  const subject = "Your Zyvora sign-in OTP";
  const text = `Your OTP is ${otp}. It will expire in ${expiresInMinutes} minutes.`;
  const html = `
    <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.5;">
      <h2 style="margin: 0 0 12px;">Sign in to Zyvora</h2>
      <p style="margin: 0 0 12px;">Use this one-time password to continue:</p>
      <p style="margin: 0 0 12px; font-size: 24px; letter-spacing: 4px; font-weight: 700;">${otp}</p>
      <p style="margin: 0 0 12px;">This code expires in ${expiresInMinutes} minutes.</p>
      <p style="margin: 0; color: #6b7280; font-size: 12px;">If you did not request this, you can ignore this email.</p>
    </div>
  `;

  try {
    await sendMail({ to: email, subject, text, html });
  } catch (error) {
    if (env.NODE_ENV === "production") {
      throw error;
    }

    logger.warn(
      {
        email,
        otp,
        error: error instanceof Error ? error.message : error
      },
      "SMTP not configured or email send failed. Using development OTP fallback log"
    );
  }
};
