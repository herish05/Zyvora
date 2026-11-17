export default function ProductDetailRouteLoading() {
  return (
    <main className="mx-auto max-w-7xl px-4 pb-14 pt-6 sm:px-8">
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card-premium p-5">
          <div className="h-64 animate-pulse rounded-2xl bg-[#efe5d6] sm:h-80" />
          <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={`pdp-route-thumb-${idx}`} className="h-20 animate-pulse rounded-lg bg-[#eadcc8]" />
            ))}
          </div>
        </section>

        <section className="card-premium p-6">
          <div className="h-3 w-24 animate-pulse rounded bg-[#eadcc8]" />
          <div className="mt-3 h-10 w-3/4 animate-pulse rounded bg-[#e4d6c0]" />
          <div className="mt-2 h-4 w-40 animate-pulse rounded bg-[#eadcc8]" />
          <div className="mt-4 h-8 w-32 animate-pulse rounded bg-[#e4d6c0]" />
          <div className="mt-4 h-4 w-full animate-pulse rounded bg-[#eadcc8]" />
          <div className="mt-2 h-4 w-5/6 animate-pulse rounded bg-[#eadcc8]" />
          <div className="mt-5 h-10 w-full animate-pulse rounded-xl bg-[#eadcc8]" />
        </section>
      </div>
    </main>
  );
}
