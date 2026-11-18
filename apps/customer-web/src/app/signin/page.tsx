"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { customerApiRequest, ensureActiveCustomerToken, setStoredCustomerToken } from "../../lib/api";
import { ensureCustomerProfileEmail, hasCustomerProfileSetup } from "../../lib/mock-account";

type OtpRequestResponse = {
  expiresInSeconds: number;
  retryAfterSeconds: number;
};

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"request" | "verify">("request");
  const [otpHint, setOtpHint] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const checkSession = async () => {
      const token = await ensureActiveCustomerToken();
      if (!token || cancelled) {
        return;
      }

      const nextPath = searchParams.get("next") || "/account/profile";
      router.replace(nextPath);
    };

    void checkSession();

    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  useEffect(() => {
    if (resendIn <= 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      setResendIn((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [resendIn]);

  const requestOtpForEmail = async () => {
    const result = await customerApiRequest<OtpRequestResponse>("/auth/otp/request", {
      method: "POST",
      body: JSON.stringify({ email })
    });

    setOtpHint("OTP sent to your email.");

    setResendIn(result.data.retryAfterSeconds || 30);
    setStep("verify");
  };

  const requestOtp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await requestOtpForEmail();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await customerApiRequest<{
        user: { email: string };
        accessToken: string;
      }>("/auth/otp/verify", {
        method: "POST",
        body: JSON.stringify({ email, otp })
      });

      setStoredCustomerToken(result.data.accessToken);
      ensureCustomerProfileEmail(result.data.user.email);
      const nextPath = searchParams.get("next") || "/account/profile";
      const profileSetupComplete = hasCustomerProfileSetup();
      router.push(profileSetupComplete ? nextPath : "/account/profile?setup=1");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "OTP verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-md px-4 pb-12 pt-10 sm:px-0">
      <section className="card-premium p-6">
        <h1 className="text-3xl" style={{ fontFamily: "var(--font-display)" }}>Sign in to Zyvora</h1>
        <form className="mt-6 space-y-3" onSubmit={step === "request" ? requestOtp : verifyOtp}>
          <input
            placeholder="Email"
            className="w-full rounded-xl border border-[#d8c8b0] bg-white px-4 py-2.5"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            disabled={step === "verify"}
          />

          {step === "verify" ? (
            <input
              placeholder="Enter 6-digit OTP"
              className="w-full rounded-xl border border-[#d8c8b0] bg-white px-4 py-2.5"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={otp}
              onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
              required
            />
          ) : null}

          <button disabled={isLoading} className="w-full rounded-full bg-[#1b1b1b] py-2.5 text-white disabled:opacity-60">
            {isLoading ? "Please wait..." : step === "request" ? "Send OTP" : "Verify OTP"}
          </button>
        </form>

        {step === "verify" ? (
          <button
            type="button"
            onClick={() => {
              setStep("request");
              setOtp("");
              setOtpHint(null);
              setResendIn(0);
              setError(null);
            }}
            className="mt-2 w-full rounded-full border border-[#1b1b1b] py-2.5 text-sm"
          >
            Change email
          </button>
        ) : null}

        {step === "verify" ? (
          <button
            type="button"
            disabled={isLoading || resendIn > 0}
            onClick={async () => {
              try {
                setError(null);
                setIsLoading(true);
                await requestOtpForEmail();
              } catch (submitError) {
                setError(submitError instanceof Error ? submitError.message : "Failed to resend OTP");
              } finally {
                setIsLoading(false);
              }
            }}
            className="mt-2 w-full rounded-full border border-[#1b1b1b] py-2.5 text-sm disabled:opacity-60"
          >
            {resendIn > 0 ? `Resend OTP in ${resendIn}s` : "Resend OTP"}
          </button>
        ) : null}

        {otpHint ? <p className="mt-3 text-sm text-[#1e5a39]">{otpHint}</p> : null}
        {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
      </section>
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-md px-4 py-16 text-center text-sm text-[#5f5a52]">Loading sign in...</main>}>
      <SignInForm />
    </Suspense>
  );
}
