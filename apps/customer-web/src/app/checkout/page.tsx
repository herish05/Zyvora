export default function CheckoutPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 pb-14 pt-6 sm:px-8">
      <h1 className="text-4xl" style={{ fontFamily: "var(--font-display)" }}>Checkout</h1>
      <div className="card-premium mt-6 p-6">
        <p className="text-sm text-[#5f5a52]">Checkout structure includes address, shipping, coupon, payment and order review sections. Backend-owned amount calculation will be connected in next commerce phase.</p>
      </div>
    </main>
  );
}
