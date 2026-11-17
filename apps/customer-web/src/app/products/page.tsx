const products = [
  { name: "Aurum Leather Weekender", price: "₹18,499", rating: "4.8", tag: "Best seller" },
  { name: "Kairo Smart Ambient Lamp", price: "₹6,990", rating: "4.6", tag: "New" },
  { name: "Velar Ceramic Brew Set", price: "₹3,450", rating: "4.7", tag: "Trending" }
];

export default function ProductListingPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-8">
      <h1 className="text-4xl" style={{ fontFamily: "var(--font-display)" }}>Product Listing</h1>
      <p className="mt-2 text-sm text-[#5f5a52]">Dynamic filters and search API integration hooks are ready for next phase implementation.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-[260px_1fr]">
        <aside className="card-premium p-5">
          <h2 className="text-lg">Filters</h2>
          <ul className="mt-3 space-y-2 text-sm text-[#5f5a52]">
            <li>Price range</li>
            <li>Brand</li>
            <li>Rating</li>
            <li>Availability</li>
            <li>Category attributes</li>
          </ul>
        </aside>
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <article key={p.name} className="card-premium glow-hover p-5">
              <div className="h-40 rounded-xl bg-[#efe5d6]" />
              <p className="mt-4 text-xs uppercase tracking-[0.12em] text-[#7e5112]">{p.tag}</p>
              <h3 className="mt-1 text-xl" style={{ fontFamily: "var(--font-display)" }}>{p.name}</h3>
              <p className="mt-1 text-sm text-[#5f5a52]">⭐ {p.rating}</p>
              <p className="mt-3 font-semibold">{p.price}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
