"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "../../lib/api";

export default function AdminSignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      window.localStorage.setItem("zyvora_admin_access_token", result.data.accessToken);
      router.push("/dashboard");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Sign in failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-md px-4 pb-12 pt-10 sm:px-0">
      <section className="panel p-6">
        <h1 className="text-3xl" style={{ fontFamily: "var(--font-display)" }}>Admin Sign in</h1>
        <form className="mt-6 space-y-3" onSubmit={onSubmit}>
          <input
            placeholder="Email"
            className="w-full rounded-xl border border-[#d3d7dd] px-4 py-2.5"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            required
          />
          <input
            placeholder="Password"
            type="password"
            className="w-full rounded-xl border border-[#d3d7dd] px-4 py-2.5"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <button disabled={isLoading} className="w-full rounded-full bg-[#111827] py-2.5 text-white disabled:opacity-60">
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
        </form>
        {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
      </section>
    </main>
  );
}
