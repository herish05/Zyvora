export default function ProductsLoading() {
  return (
    <main className="mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-8">
      <div className="h-10 w-64 animate-pulse rounded bg-[#eadfce]" />
      <div className="mt-4 h-11 w-full animate-pulse rounded-xl bg-[#eadfce]" />
      <div className="mt-6 grid gap-4 lg:grid-cols-[260px_1fr]">
        <aside className="card-premium hidden p-5 lg:block">
          <div className="h-6 w-24 animate-pulse rounded bg-[#eadfce]" />
          <div className="mt-4 space-y-3">
            <div className="h-4 w-full animate-pulse rounded bg-[#eadfce]" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-[#eadfce]" />
            <div className="h-4 w-4/5 animate-pulse rounded bg-[#eadfce]" />
            <div className="h-4 w-full animate-pulse rounded bg-[#eadfce]" />
          </div>
        </aside>
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <article key={`route-skeleton-${index}`} className="card-premium overflow-hidden">
              <div className="h-44 w-full animate-pulse bg-[#eadfce]" />
              <div className="space-y-3 p-4">
                <div className="h-3 w-24 animate-pulse rounded bg-[#eadfce]" />
                <div className="h-6 w-3/4 animate-pulse rounded bg-[#e4d6c0]" />
                <div className="h-4 w-full animate-pulse rounded bg-[#eadfce]" />
                <div className="h-4 w-5/6 animate-pulse rounded bg-[#eadfce]" />
                <div className="h-7 w-28 animate-pulse rounded-full bg-[#eadfce]" />
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
