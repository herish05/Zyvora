export default function ProductCreatePage() {
  return (
    <main className="mx-auto max-w-5xl px-4 pb-12 pt-6 sm:px-8">
      <h1 className="text-4xl" style={{ fontFamily: "var(--font-display)" }}>Create Product</h1>
      <div className="panel mt-6 space-y-3 p-6">
        <p>1. Basic information</p>
        <p>2. Product media</p>
        <p>3. Pricing and tax</p>
        <p>4. Category and attributes</p>
        <p>5. Variants and inventory</p>
        <p>6. Publication settings</p>
      </div>
    </main>
  );
}
