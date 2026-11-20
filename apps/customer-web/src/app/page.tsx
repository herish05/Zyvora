"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowDown, ArrowRight, ArrowUpRight, Heart, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { mockProducts } from "../lib/mock-catalog";
import { getStorefrontProducts } from "../lib/storefront-catalog";

const collections = [
  {
    title: "The bag edit",
    eyebrow: "Carry your day",
    href: "/products?category=purse",
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1100&q=85",
    className: "collection-bags",
    number: "01"
  },
  {
    title: "Step into style",
    eyebrow: "Shoes with a point of view",
    href: "/products?category=shoes",
    image: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=1100&q=85",
    className: "collection-shoes",
    number: "02"
  },
  {
    title: "Wear it your way",
    eyebrow: "Everyday, elevated",
    href: "/products?category=shirts",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1100&q=85",
    className: "collection-clothes",
    number: "03"
  }
];

const reveal = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } }
};

export default async function HomePage() {
  const catalogProducts = await getStorefrontProducts() ?? (process.env.NODE_ENV === "production" ? [] : mockProducts);
  const featured = catalogProducts.find((product) => product.category === "purse" || product.categorySlug === "purse") ?? catalogProducts[0];

  return (
    <main className="overflow-hidden pb-20">
      <section className="fashion-hero relative mx-auto mt-4 grid max-w-[1440px] overflow-hidden md:mt-6 md:rounded-[2rem]">
        <div className="hero-copy relative z-10 flex flex-col justify-center px-6 py-12 sm:px-12 sm:py-16 lg:px-20 lg:py-24">
          <motion.div initial="hidden" animate="visible" variants={reveal}>
            <p className="mb-5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#9b635f]">
              <span className="h-px w-8 bg-[#9b635f]" /> A little more you
            </p>
            <h1 className="max-w-[680px] font-display text-[3.25rem] leading-[0.96] tracking-[-0.055em] text-[#342421] sm:text-6xl lg:text-[5.35rem]">
              Find your <em className="font-normal text-[#a45f61]">kind</em> of beautiful.
            </h1>
            <p className="mt-6 max-w-md text-sm leading-7 text-[#715f59] sm:text-base">
              The little things that make getting dressed feel like you. Discover bags, shoes and pieces worth wearing on repeat.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href="/products" className="group inline-flex items-center gap-3 rounded-full bg-[#382421] px-6 py-3.5 text-sm font-medium text-white transition hover:bg-[#a45f61]">
                Explore the collection <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <a href="#collections" className="inline-flex items-center gap-2 px-2 py-3 text-sm font-medium text-[#604a44] hover:text-[#a45f61]">
                Find your edit <ArrowDown size={15} />
              </a>
            </div>
            <div className="mt-11 flex items-center gap-3 text-xs text-[#765f59]">
              <span className="flex -space-x-2" aria-hidden="true">
                <span className="h-8 w-8 rounded-full border-2 border-[#f4e7df] bg-[url('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80')] bg-cover" />
                <span className="h-8 w-8 rounded-full border-2 border-[#f4e7df] bg-[url('https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=100&q=80')] bg-cover" />
                <span className="h-8 w-8 rounded-full border-2 border-[#f4e7df] bg-[url('https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=100&q=80')] bg-cover" />
              </span>
              <span><strong className="font-semibold text-[#382421]">Made for real life.</strong> Loved by women like you.</span>
            </div>
          </motion.div>
        </div>
        <div className="hero-image relative min-h-[340px] sm:min-h-[400px] md:min-h-[500px] lg:min-h-[660px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1500&q=90" alt="Friends discovering their personal style" className="absolute inset-0 h-full w-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#39231e]/25 via-transparent to-transparent" />
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.6 }} className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4 sm:bottom-9 sm:left-9 sm:right-9">
            <div className="rounded-2xl border border-white/40 bg-white/85 p-4 shadow-xl backdrop-blur-md sm:p-5">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#a45f61]">The new season</p>
              <p className="mt-1 font-display text-2xl text-[#382421]">Little joys, daily.</p>
            </div>
            <Link href={featured ? `/products/${featured.slug}` : "/products"} aria-label="Shop the featured edit" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#fbf4ed] text-[#382421] shadow-lg transition hover:-translate-y-1 hover:bg-white"><ArrowUpRight size={20} /></Link>
          </motion.div>
          <div className="absolute right-7 top-7 hidden h-[88px] w-[88px] rotate-12 flex-col items-center justify-center rounded-full border border-white/70 bg-[#f2d8cb]/90 text-center text-[9px] font-semibold uppercase leading-4 tracking-[0.16em] text-[#69433d] shadow-lg md:flex">
            <Sparkles size={14} className="mb-1" /> Picked for you
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1280px] grid-cols-2 gap-px bg-[#e8d9d0] px-5 sm:grid-cols-4 sm:px-8 lg:px-10">
        {[
          [<Truck key="truck" size={17} />, "Free shipping", "On orders over ₹1,999"],
          [<ShieldCheck key="shield" size={17} />, "Easy returns", "A little time to decide"],
          [<Heart key="heart" size={17} />, "Thoughtful finds", "Styles picked with care"],
          [<Sparkles key="sparkles" size={17} />, "A lovely unboxing", "Made to feel special"]
        ].map(([icon, title, detail]) => (
          <div key={String(title)} className="flex items-start gap-3 bg-[#fcf8f4] px-3 py-5 sm:px-5 sm:py-6">
            <span className="mt-0.5 text-[#a45f61]">{icon}</span>
            <div><p className="text-xs font-semibold text-[#45322e] sm:text-sm">{title}</p><p className="mt-1 text-[10px] text-[#907b73] sm:text-xs">{detail}</p></div>
          </div>
        ))}
      </section>

      <section id="collections" className="mx-auto max-w-[1280px] scroll-mt-24 px-5 pt-16 sm:px-8 sm:pt-24 lg:px-10">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={reveal} className="mb-7 flex items-end justify-between gap-4 sm:mb-9">
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#a45f61]">A good place to start</p>
            <h2 className="font-display text-4xl tracking-[-0.04em] text-[#382421] sm:text-5xl">Shop your mood</h2>
          </div>
          <Link href="/products" className="mb-1 hidden items-center gap-2 text-sm font-medium text-[#765f59] transition hover:text-[#a45f61] sm:flex">All the good things <ArrowRight size={15} /></Link>
        </motion.div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection, index) => (
            <motion.div key={collection.title} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.15 }} variants={reveal} transition={{ delay: index * 0.1 }}>
              <Link href={collection.href} className={`collection-card ${collection.className} group relative flex min-h-[380px] overflow-hidden rounded-[1.6rem] sm:min-h-[450px]`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={collection.image} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]" />
                <span className="absolute inset-0 bg-gradient-to-t from-[#281a18]/70 via-[#281a18]/5 to-transparent" />
                <span className="absolute left-5 top-5 rounded-full border border-white/60 bg-white/75 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#553e38] backdrop-blur">The edit / {collection.number}</span>
                <span className="relative mt-auto flex w-full items-end justify-between p-6 text-white sm:p-7">
                  <span><span className="block text-[10px] font-medium uppercase tracking-[0.2em] text-white/75">{collection.eyebrow}</span><span className="mt-1 block font-display text-3xl sm:text-4xl">{collection.title}</span></span>
                  <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/60 transition group-hover:border-white group-hover:bg-white group-hover:text-[#382421]"><ArrowUpRight size={18} /></span>
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-5 pt-16 sm:px-8 sm:pt-24 lg:px-10">
        <div className="mb-7 flex items-end justify-between gap-4 sm:mb-9">
          <div><p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#a45f61]">Good things go quickly</p><h2 className="font-display text-4xl tracking-[-0.04em] text-[#382421] sm:text-5xl">A few current favourites</h2></div>
          <Link href="/products" className="mb-1 inline-flex items-center gap-2 text-xs font-semibold text-[#765f59] transition hover:text-[#a45f61] sm:text-sm">Shop everything <ArrowRight size={15} /></Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
          {catalogProducts.map((product, index) => {
            const variant = product.variants[0];
            return (
              <motion.div key={product.id} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.5, delay: index * 0.08 }}>
                <Link href={`/products/${product.slug}`} className="product-tile group block">
                  <div className="relative aspect-[0.82] overflow-hidden rounded-2xl bg-[#eee4dd] sm:rounded-[1.4rem]">
                    {product.images[0] ? <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]" />
                    </> : <span className="flex h-full items-center justify-center text-xs text-[#9b8076]">Product photo</span>}
                    <span className="absolute left-3 top-3 rounded-full bg-[#fffaf6]/90 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#795b52] backdrop-blur">{index === 0 ? "Loved" : "Just right"}</span>
                    <span className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#513a35] shadow-sm transition group-hover:bg-[#382421] group-hover:text-white"><ArrowUpRight size={16} /></span>
                  </div>
                  <div className="px-1 pt-3 sm:px-2 sm:pt-4">
                    <p className="text-[9px] uppercase tracking-[0.18em] text-[#a45f61] sm:text-[10px]">{product.brand}</p>
                    <div className="mt-1 flex items-start justify-between gap-2"><h3 className="font-medium text-[#382421] sm:text-[15px]">{product.name}</h3>{product.reviewCount > 0 ? <span className="shrink-0 text-[10px] text-[#9a8178]">★ {product.rating}</span> : null}</div>
                    <p className="mt-1.5 text-sm font-semibold text-[#382421]">₹{((variant?.priceMinor ?? 0) / 100).toLocaleString("en-IN")}</p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      <section className="mx-5 mt-16 overflow-hidden rounded-[1.8rem] bg-[#e9d5c9] sm:mx-8 sm:mt-24 lg:mx-auto lg:max-w-[1280px]">
        <div className="grid items-center lg:grid-cols-[1fr_0.9fr]">
          <div className="px-6 py-10 sm:px-12 sm:py-14 lg:px-16">
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#965c58]">A note from us</p>
            <h2 className="mt-3 max-w-lg font-display text-4xl leading-[1.04] tracking-[-0.04em] text-[#382421] sm:text-5xl">Style should feel like a little celebration.</h2>
            <p className="mt-4 max-w-md text-sm leading-7 text-[#725b54]">Find pieces that fit your life, your plans and all the in-between moments. We bring the lovely details; you make them yours.</p>
            <Link href="/products" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#513a35] transition hover:gap-3">Find your next favourite <ArrowRight size={16} /></Link>
          </div>
          <div className="relative min-h-[260px] sm:min-h-[350px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=85" alt="A confident look styled for your own kind of day" className="absolute inset-0 h-full w-full object-cover object-[center_35%]" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#e9d5c9] via-transparent to-transparent lg:bg-gradient-to-r" />
          </div>
        </div>
      </section>
    </main>
  );
}
