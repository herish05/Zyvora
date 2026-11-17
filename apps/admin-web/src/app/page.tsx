import Link from "next/link";

const adminSections: Array<{ label: string; href: string }> = [
  { label: "Overview", href: "/dashboard" },
  { label: "Products", href: "/products" },
  { label: "Orders", href: "/orders" },
  { label: "Settings", href: "/settings" }
];

export default function AdminHomePage() {
  return (
    <main className="mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-8">
      <header className="panel mb-8 flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[#1f3a33]">Zyvora</p>
          <h1 className="text-3xl" style={{ fontFamily: "var(--font-display)" }}>Control Center</h1>
        </div>
        <Link href="/signin" className="rounded-full bg-[#111827] px-5 py-2 text-sm text-white">Admin Sign in</Link>
      </header>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {adminSections.map(({ label, href }) => (
          <Link key={label} href={href} className="panel p-5 transition hover:-translate-y-0.5 hover:shadow-md">
            <p className="text-lg" style={{ fontFamily: "var(--font-display)" }}>{label}</p>
            <p className="mt-2 text-sm text-[#5b6470]">Open {label.toLowerCase()} workspace</p>
          </Link>
        ))}
      </section>
    </main>
  );
}
