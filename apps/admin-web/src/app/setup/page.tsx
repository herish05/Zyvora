"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiRequest, setStoredAdminToken } from "../../lib/api";

export default function AdminSetupPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bootstrapKey, setBootstrapKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const createFirstAdmin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsCreating(true);
    try {
      const result = await apiRequest<{ user: { role: "admin" | "customer" }; accessToken: string }>("/auth/bootstrap-admin", {
        method: "POST",
        body: JSON.stringify({ firstName, lastName, email, password, bootstrapKey })
      });
      if (result.data.user.role !== "admin") throw new Error("This account was not created as an admin.");
      setStoredAdminToken(result.data.accessToken);
      router.replace("/dashboard");
    } catch (setupError) {
      setError(setupError instanceof Error ? setupError.message : "Admin setup could not be completed.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="panel w-full max-w-lg p-6 sm:p-8">
        <Link href="/signin" className="mb-7 inline-flex items-center gap-2.5"><span className="admin-brand-mark">Z</span><span><strong className="block font-display text-xl text-[#392623]">Zyvora</strong><small className="mt-1 block text-[8px] font-semibold tracking-[.2em] text-[#a18178]">STUDIO / ADMIN</small></span></Link>
        <p className="admin-eyebrow">One-time setup</p><h1 className="mt-2 font-display text-3xl text-[#392623]">Create the first admin</h1><p className="mt-2 text-xs leading-5 text-[#927e76]">This is only for the store’s initial admin account. It requires the setup key configured on the API and closes after the account is created.</p>
        {error ? <p className="mt-4 rounded-xl border border-[#edc8be] bg-[#fff3ef] p-3 text-sm text-[#9a463d]">{error}</p> : null}
        <form className="mt-6 grid gap-3 sm:grid-cols-2" onSubmit={createFirstAdmin}>
          <label className="admin-label">First name<input value={firstName} onChange={(event) => setFirstName(event.target.value)} className="admin-field mt-1.5" required maxLength={80} /></label>
          <label className="admin-label">Last name<input value={lastName} onChange={(event) => setLastName(event.target.value)} className="admin-field mt-1.5" required maxLength={80} /></label>
          <label className="admin-label sm:col-span-2">Work email<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" className="admin-field mt-1.5" required /></label>
          <label className="admin-label sm:col-span-2">Password<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" className="admin-field mt-1.5" minLength={8} maxLength={64} required /></label>
          <label className="admin-label sm:col-span-2">API admin setup key<input value={bootstrapKey} onChange={(event) => setBootstrapKey(event.target.value)} type="password" className="admin-field mt-1.5" minLength={16} required /><span className="mt-1 block text-[10px] font-normal text-[#a18d84]">Use the ADMIN_BOOTSTRAP_KEY from the API environment.</span></label>
          <button disabled={isCreating} className="mt-2 min-h-11 rounded-full bg-[#754241] text-sm font-medium text-white transition hover:bg-[#603634] disabled:opacity-60 sm:col-span-2">{isCreating ? "Creating admin…" : "Create admin account"}</button>
        </form>
        <p className="mt-5 text-center text-xs text-[#927e76]">Already have an admin account? <Link href="/signin" className="font-semibold text-[#754241] underline">Sign in</Link></p>
      </section>
    </main>
  );
}
