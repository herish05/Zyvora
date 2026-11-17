import Link from "next/link";

const workflowSteps = [
  {
    title: "Step 1: Build Catalog",
    description: "Create categories and product attributes to define your structure.",
    href: "/categories",
    cta: "Open Categories"
  },
  {
    title: "Step 2: Add Products",
    description: "Create products, add variants, set pricing, and upload data.",
    href: "/products/new",
    cta: "Create Product"
  },
  {
    title: "Step 3: Set Inventory",
    description: "Adjust stock levels and low-stock thresholds for each variant.",
    href: "/products",
    cta: "Manage Inventory"
  },
  {
    title: "Step 4: Track Orders",
    description: "Monitor incoming orders and fulfillment statuses in one place.",
    href: "/orders",
    cta: "Open Orders"
  }
];

export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-8">
      <h1 className="text-3xl sm:text-4xl" style={{ fontFamily: "var(--font-display)" }}>Business Overview</h1>
      <p className="mt-2 text-sm text-[#5b6470]">If you are new here, follow the workflow below from Step 1 to Step 4.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {["Total Revenue", "Orders", "AOV", "Returning Customers"].map((metric) => (
          <article key={metric} className="panel p-5">
            <p className="text-xs uppercase tracking-[0.12em] text-[#5b6470]">{metric}</p>
            <p className="mt-3 text-2xl font-semibold">Live data pending</p>
          </article>
        ))}
      </div>

      <section className="panel mt-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-2xl" style={{ fontFamily: "var(--font-display)" }}>Setup Workflow</h2>
          <span className="rounded-full bg-[#eef5f2] px-3 py-1 text-xs text-[#1f3a33]">Start here</span>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {workflowSteps.map((step) => (
            <article key={step.title} className="rounded-xl border border-[#e5e7eb] bg-white p-4">
              <p className="font-semibold text-[#0f172a]">{step.title}</p>
              <p className="mt-1 text-sm text-[#5b6470]">{step.description}</p>
              <Link
                href={step.href}
                className="mt-3 inline-block rounded-full border border-[#111827] px-3 py-1.5 text-xs"
              >
                {step.cta}
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
