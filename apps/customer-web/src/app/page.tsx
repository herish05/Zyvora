import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import { mockProducts } from "../lib/mock-catalog";

const categoryShowcase = [
  { title: "Running Shoes", tone: "from-[#f0f6ff] to-[#ddeeff]" },
  { title: "Formal Shirts", tone: "from-[#fff3ed] to-[#ffe4d8]" },
  { title: "Denim Jeans", tone: "from-[#eef4ff] to-[#dbe7ff]" },
  { title: "Mini Purse", tone: "from-[#fff6ee] to-[#ffe8cf]" }
];

export default function HomePage() {
  const topProduct = mockProducts.at(0);

  return (
    <main className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-8">
      <section className="relative overflow-hidden rounded-3xl border border-[#e8dfd2] bg-gradient-to-br from-[#fff8eb] via-[#fffaf3] to-[#f2ece3] p-6 sm:p-10 lg:p-12">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#a8742a]/20 blur-3xl" />
        <div className="absolute -left-20 bottom-0 h-44 w-44 rounded-full bg-[#162e36]/15 blur-3xl" />
        <div className="max-w-2xl">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#d9c7af] px-3 py-1 text-xs uppercase tracking-[0.18em] text-[#7e5112]">
            New Drop Weekly
          </p>
          <h1 className="text-3xl leading-tight sm:text-5xl lg:text-6xl" style={{ fontFamily: "var(--font-display)" }}>
            Modern fashion marketplace with trusted product stories.
          </h1>
          <p className="mt-4 max-w-xl text-[#5f5a52]">
            Browse shoes, shirts, jeans and purses, explore detailed specs, compare options and buy confidently with real customer feedback.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/products" className="rounded-full bg-[#162e36] px-6 py-3 text-sm text-white">Start Shopping</Link>
            <Link href={topProduct ? `/products/${topProduct.slug}` : "/products"} className="rounded-full border border-[#162e36] px-6 py-3 text-sm">View Top Product</Link>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl sm:text-3xl" style={{ fontFamily: "var(--font-display)" }}>Shop by Category</h2>
          <Link href="/products" className="inline-flex items-center gap-2 text-sm text-[#7e5112]">See all <ArrowRight size={14} /></Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categoryShowcase.map((category) => (
            <article key={category.title} className={`rounded-2xl border border-[#e5d8c6] bg-gradient-to-br ${category.tone} p-5`}>
              <p className="text-xs uppercase tracking-[0.12em] text-[#7e5112]">Category</p>
              <h3 className="mt-2 text-xl" style={{ fontFamily: "var(--font-display)" }}>{category.title}</h3>
              <p className="mt-2 text-sm text-[#5f5a52]">Fresh arrivals, curated quality and fast shipping.</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl sm:text-3xl" style={{ fontFamily: "var(--font-display)" }}>Popular Products</h2>
          <Link href="/products" className="inline-flex items-center gap-2 text-sm text-[#7e5112]">Explore all <ArrowRight size={14} /></Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {mockProducts.map((product) => {
            const primaryVariant = product.variants.at(0);
            return (
              <Link key={product.id} href={`/products/${product.slug}`} className="card-premium glow-hover overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={product.images[0]} alt={product.name} className="h-48 w-full object-cover" />
                <div className="p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-[#7e5112]">{product.category}</p>
                  <h3 className="mt-1 text-lg" style={{ fontFamily: "var(--font-display)" }}>{product.name}</h3>
                  <p className="mt-2 text-sm text-[#5f5a52]">{product.shortDescription}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="font-semibold">₹{(((primaryVariant?.priceMinor ?? 0) / 100)).toLocaleString("en-IN")}</p>
                    <p className="inline-flex items-center gap-1 text-sm text-[#5f5a52]"><Star size={14} /> {product.rating}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-10 rounded-3xl border border-[#e8dfd2] bg-[#fffdf8] p-5 sm:p-6">
        <h2 className="text-2xl" style={{ fontFamily: "var(--font-display)" }}>Why shoppers choose Zyvora</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {[
            "Detailed specifications before purchase",
            "Image-backed reviews from verified buyers",
            "Similar product suggestions for easy comparison"
          ].map((item) => (
            <article key={item} className="rounded-xl border border-[#eadfce] p-4 text-sm text-[#5f5a52]">
              {item}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
