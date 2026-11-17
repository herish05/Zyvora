export default function AccountPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 pb-12 pt-6 sm:px-8">
      <h1 className="text-4xl" style={{ fontFamily: "var(--font-display)" }}>Customer Account</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <section className="card-premium p-5">Orders and tracking timeline</section>
        <section className="card-premium p-5">Wishlist and saved items</section>
        <section className="card-premium p-5">Addresses and profile settings</section>
        <section className="card-premium p-5">Reviews and uploaded media</section>
      </div>
    </main>
  );
}
