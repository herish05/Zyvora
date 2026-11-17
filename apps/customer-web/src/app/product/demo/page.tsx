export default function ProductDetailPage() {
  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 pb-14 pt-6 sm:grid-cols-2 sm:px-8">
      <section className="card-premium p-5">
        <div className="h-80 rounded-2xl bg-[#efe5d6]" />
        <div className="mt-4 grid grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="h-20 rounded-lg bg-[#eadcc8]" />
          ))}
        </div>
      </section>
      <section className="card-premium p-6">
        <p className="text-xs uppercase tracking-[0.14em] text-[#7e5112]">Zyvora Atelier</p>
        <h1 className="mt-2 text-4xl leading-tight" style={{ fontFamily: "var(--font-display)" }}>Aurum Leather Weekender</h1>
        <p className="mt-2 text-sm text-[#5f5a52]">SKU: ZYV-WKD-4092</p>
        <p className="mt-4 text-2xl font-semibold">₹18,499</p>
        <p className="text-sm text-[#5f5a52] line-through">₹21,999</p>
        <p className="mt-4 text-sm text-[#5f5a52]">Hand-finished vegetable-tanned leather, expandable interior and a dedicated laptop sleeve.</p>
        <div className="mt-6 flex gap-3">
          <button className="rounded-full bg-[#1b1b1b] px-5 py-2.5 text-white">Add to Cart</button>
          <button className="rounded-full border border-[#1b1b1b] px-5 py-2.5">Buy Now</button>
        </div>
      </section>
    </main>
  );
}
