"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, setStoredAdminToken } from "../../lib/api";

export default function AdminSignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    setSessionExpired(new URLSearchParams(window.location.search).get("expired") === "1");
  }, []);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await apiRequest<{
        user: { role: "admin" | "customer"; email: string };
        accessToken: string;
      }>("/auth/signin", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });

      if (result.data.user.role !== "admin") {
        throw new Error("This account is not authorized for admin access");
      }

      setStoredAdminToken(result.data.accessToken);
      const requestedPath = new URLSearchParams(window.location.search).get("next");
      const nextPath = requestedPath?.startsWith("/") && !requestedPath.startsWith("//") && requestedPath !== "/signin"
        ? requestedPath
        : "/dashboard";
      router.replace(nextPath);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Sign in failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="panel w-full max-w-md p-6 sm:p-8">
        <Link href="/" className="mb-8 inline-flex items-center gap-2.5"><span className="admin-brand-mark">Z</span><span><strong className="block font-display text-xl text-[#392623]">Zyvora</strong><small className="mt-1 block text-[8px] font-semibold tracking-[.2em] text-[#a18178]">STUDIO / ADMIN</small></span></Link>
        <p className="admin-eyebrow">Welcome back</p><h1 className="mt-2 font-display text-3xl text-[#392623]">Admin sign in</h1><p className="mt-2 text-xs leading-5 text-[#927e76]">Sign in to manage products, categories, and your store profile.</p>
        {sessionExpired ? <p className="mt-4 rounded-xl border border-[#eedfce] bg-[#fffaf3] p-3 text-sm text-[#806c64]">Your admin session expired. Sign in again to continue.</p> : null}
        <form className="mt-6 space-y-3" onSubmit={onSubmit}>
          <input
            placeholder="Email"
            className="admin-field"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            required
          />
          <input
            placeholder="Password"
            type="password"
            className="admin-field"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <button disabled={isLoading} className="mt-2 min-h-11 w-full rounded-full bg-[#754241] text-sm font-medium text-white transition hover:bg-[#603634] disabled:opacity-60">
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
        </form>
        {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
        <p className="mt-5 border-t border-[#f0e7e2] pt-4 text-xs leading-5 text-[#927e76]">First time setting up this store? <Link href="/setup" className="font-semibold text-[#754241] underline">Create the initial admin account</Link>. This setup closes once the first admin is created.</p>
      </section>
    </main>
  );
}
