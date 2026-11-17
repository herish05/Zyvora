import Link from "next/link";

export default function ProductsPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl" style={{ fontFamily: "var(--font-display)" }}>Products</h1>
        <Link href="/products/new" className="rounded-full bg-[#111827] px-4 py-2 text-sm text-white">Create Product</Link>
      </div>
      <div className="panel mt-6 p-5">Product listing table scaffold with search, filter and status controls.</div>
    </main>
  );
}
