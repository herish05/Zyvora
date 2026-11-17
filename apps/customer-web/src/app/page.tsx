import Link from "next/link";
import { ArrowRight, ShoppingBag, Sparkles } from "lucide-react";

const sections = [
  { title: "Featured Categories", subtitle: "Curated picks across fashion, tech and living." },
  { title: "Trending Right Now", subtitle: "Products that customers are discovering this week." },
  { title: "Verified Experiences", subtitle: "Real customer photos, videos and post-delivery stories." }
];

export default function HomePage() {
  return (
    <main className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-8">
      <header className="mb-8 flex items-center justify-between rounded-2xl border border-[#e8dfd2] bg-[#fffaf2]/90 px-5 py-4 backdrop-blur">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-[#7e5112]">Zyvora</p>
          <p className="text-xl" style={{ fontFamily: "var(--font-display)" }}>Premium Commerce House</p>
        </div>
        <nav className="flex items-center gap-5 text-sm text-[#5f5a52]">
          <Link href="/products">Shop</Link>
          <Link href="/account">Account</Link>
          <Link href="/signin">Sign in</Link>
          <Link href="/cart" className="inline-flex items-center gap-2 rounded-full bg-[#1b1b1b] px-4 py-2 text-white">
            <ShoppingBag size={16} /> Cart
          </Link>
        </nav>
      </header>

      <section className="relative overflow-hidden rounded-3xl border border-[#e8dfd2] bg-gradient-to-br from-[#fff8eb] via-[#fffaf3] to-[#f2ece3] p-8 sm:p-12">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#a8742a]/20 blur-3xl" />
        <div className="max-w-2xl">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#d9c7af] px-3 py-1 text-xs uppercase tracking-[0.18em] text-[#7e5112]">
            <Sparkles size={14} /> New season arrivals
          </p>
          <h1 className="text-4xl leading-tight sm:text-6xl" style={{ fontFamily: "var(--font-display)" }}>
            Shopping convenience, wrapped in a luxury experience.
          </h1>
          <p className="mt-4 max-w-xl text-[#5f5a52]">
            Discover premium products with elegant browsing, smart search and trusted customer-led discovery.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/products" className="rounded-full bg-[#1b1b1b] px-6 py-3 text-sm text-white">Explore Catalog</Link>
            <Link href="/product/demo" className="rounded-full border border-[#1b1b1b] px-6 py-3 text-sm">View Signature Product</Link>
          </div>
        </div>
      </section>

      <section className="mt-10 grid gap-5 sm:grid-cols-3">
        {sections.map((section) => (
          <article key={section.title} className="card-premium glow-hover p-6">
            <h2 className="text-2xl" style={{ fontFamily: "var(--font-display)" }}>{section.title}</h2>
            <p className="mt-3 text-sm text-[#5f5a52]">{section.subtitle}</p>
            <Link href="/products" className="mt-4 inline-flex items-center gap-2 text-sm text-[#7e5112]">
              Open section <ArrowRight size={14} />
            </Link>
          </article>
        ))}
      </section>
    </main>
  );
}
