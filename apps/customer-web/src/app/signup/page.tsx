"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { customerApiRequest } from "../../lib/api";

export default function SignUpPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await customerApiRequest<{
        user: { email: string };
        accessToken: string;
      }>("/auth/signup", {
        method: "POST",
        body: JSON.stringify({ firstName, lastName, email, password })
      });

      window.localStorage.setItem("zyvora_access_token", result.data.accessToken);
      router.push("/account");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Sign up failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-md px-4 pb-12 pt-10 sm:px-0">
      <section className="card-premium p-6">
        <h1 className="text-3xl" style={{ fontFamily: "var(--font-display)" }}>Create your account</h1>
        <form className="mt-6 space-y-3" onSubmit={onSubmit}>
          <input placeholder="First name" className="w-full rounded-xl border border-[#d8c8b0] bg-white px-4 py-2.5" value={firstName} onChange={(event) => setFirstName(event.target.value)} required />
          <input placeholder="Last name" className="w-full rounded-xl border border-[#d8c8b0] bg-white px-4 py-2.5" value={lastName} onChange={(event) => setLastName(event.target.value)} required />
          <input placeholder="Email" type="email" className="w-full rounded-xl border border-[#d8c8b0] bg-white px-4 py-2.5" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <input placeholder="Password" type="password" className="w-full rounded-xl border border-[#d8c8b0] bg-white px-4 py-2.5" value={password} onChange={(event) => setPassword(event.target.value)} required />
          <button disabled={isLoading} className="w-full rounded-full bg-[#1b1b1b] py-2.5 text-white disabled:opacity-60">{isLoading ? "Creating..." : "Create account"}</button>
        </form>
        {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
      </section>
    </main>
  );
}
