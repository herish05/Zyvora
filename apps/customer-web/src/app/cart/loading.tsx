export default function CartRouteLoading() {
  return (
    <main className="mx-auto max-w-6xl px-4 pb-12 pt-6 sm:px-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="h-10 w-48 animate-pulse rounded bg-[#e4d6c0]" />
        <div className="h-10 w-36 animate-pulse rounded-full bg-[#eadcc8]" />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_320px]">
        <section className="card-premium p-5">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, idx) => (
              <article key={`cart-route-skeleton-${idx}`} className="rounded-xl border border-[#eadcc8] bg-white p-4">
                <div className="flex gap-3">
                  <div className="h-20 w-20 animate-pulse rounded-lg bg-[#eadcc8]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-2/3 animate-pulse rounded bg-[#eadcc8]" />
                    <div className="h-4 w-1/2 animate-pulse rounded bg-[#efe5d6]" />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="card-premium p-5">
          <div className="h-7 w-40 animate-pulse rounded bg-[#e4d6c0]" />
          <div className="mt-4 space-y-2">
            <div className="h-4 w-full animate-pulse rounded bg-[#eadcc8]" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-[#eadcc8]" />
            <div className="h-4 w-4/6 animate-pulse rounded bg-[#eadcc8]" />
          </div>
          <div className="mt-4 h-10 w-full animate-pulse rounded-full bg-[#eadcc8]" />
        </aside>
      </div>
    </main>
  );
}
