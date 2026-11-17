export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-8">
      <h1 className="text-4xl" style={{ fontFamily: "var(--font-display)" }}>Business Overview</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {["Total Revenue", "Orders", "AOV", "Returning Customers"].map((metric) => (
          <article key={metric} className="panel p-5">
            <p className="text-xs uppercase tracking-[0.12em] text-[#5b6470]">{metric}</p>
            <p className="mt-3 text-2xl font-semibold">Live data pending</p>
          </article>
        ))}
      </div>
    </main>
  );
}
