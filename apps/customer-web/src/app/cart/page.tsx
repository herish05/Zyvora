export default function CartPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 pb-12 pt-6 sm:px-8">
      <h1 className="text-4xl" style={{ fontFamily: "var(--font-display)" }}>Your Cart</h1>
      <div className="mt-6 grid gap-5 sm:grid-cols-[1fr_320px]">
        <section className="card-premium p-5">
          <p className="text-sm text-[#5f5a52]">Cart API wiring in progress. This page is ready for dynamic totals, coupon and shipping estimate integration.</p>
        </section>
        <aside className="card-premium p-5">
          <h2 className="text-xl" style={{ fontFamily: "var(--font-display)" }}>Order Summary</h2>
          <p className="mt-4 text-sm">Subtotal: ₹18,499</p>
          <p className="text-sm">Shipping: ₹199</p>
          <p className="mt-2 font-semibold">Total: ₹18,698</p>
        </aside>
      </div>
    </main>
  );
}
