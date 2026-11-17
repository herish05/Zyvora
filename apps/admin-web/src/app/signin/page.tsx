const apiBase = process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL ?? "http://localhost:4000/api/v1";

export default function AdminSignInPage() {
  return (
    <main className="mx-auto max-w-md px-4 pb-12 pt-10 sm:px-0">
      <section className="panel p-6">
        <h1 className="text-3xl" style={{ fontFamily: "var(--font-display)" }}>Admin Sign in</h1>
        <form className="mt-6 space-y-3">
          <input placeholder="Email" className="w-full rounded-xl border border-[#d3d7dd] px-4 py-2.5" />
          <input placeholder="Password" type="password" className="w-full rounded-xl border border-[#d3d7dd] px-4 py-2.5" />
          <button className="w-full rounded-full bg-[#111827] py-2.5 text-white">Sign in</button>
        </form>
        <a href={`${apiBase}/auth/google`} className="mt-3 block rounded-full border border-[#111827] py-2.5 text-center text-sm">
          Continue with Google
        </a>
      </section>
    </main>
  );
}
