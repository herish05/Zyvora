export default function AdminHomePage() {
  return (
    <main className="mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-8">
      <header className="panel mb-6 p-6">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[#1f3a33]">Welcome</p>
          <h1 className="mt-1 text-3xl" style={{ fontFamily: "var(--font-display)" }}>Admin Home</h1>
          <p className="mt-2 text-sm text-[#5b6470]">Use the left sidebar for navigation. For a guided path, open Dashboard and follow Setup Workflow.</p>
        </div>
      </header>
      <section className="grid gap-4 sm:grid-cols-2">
        <a href="/dashboard" className="panel p-5 transition hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-lg" style={{ fontFamily: "var(--font-display)" }}>Open Dashboard</p>
          <p className="mt-2 text-sm text-[#5b6470]">See KPIs and step-by-step admin workflow.</p>
        </a>
        <a href="/signin" className="panel p-5 transition hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-lg" style={{ fontFamily: "var(--font-display)" }}>Sign in</p>
          <p className="mt-2 text-sm text-[#5b6470]">Use your admin account when prompted.</p>
        </a>
      </section>
    </main>
  );
}
