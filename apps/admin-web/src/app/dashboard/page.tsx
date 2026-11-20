"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Boxes, CircleAlert, Package, Plus, ShoppingBag, Tags, TrendingUp } from "lucide-react";
import { apiRequest, getStoredAdminToken } from "../../lib/api";

type ProductSummary = { _id: string; name: string; slug: string; publicationStatus: string; updatedAt: string };
type CategorySummary = { _id: string; name: string };
type LowStockSummary = { inventory: { available: number; lowStockThreshold: number }; variant?: { sku: string }; product?: { name: string } };

export default function DashboardPage() {
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [lowStock, setLowStock] = useState<LowStockSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getStoredAdminToken();
    if (!token) {
      setError("Sign in to view live catalog data.");
      return;
    }
    Promise.all([
      apiRequest<ProductSummary[]>("/admin/products", undefined, token),
      apiRequest<CategorySummary[]>("/catalog/admin/categories", undefined, token),
      apiRequest<LowStockSummary[]>("/admin/inventory/low-stock", undefined, token)
    ]).then(([productResult, categoryResult, stockResult]) => {
      setProducts(productResult.data);
      setCategories(categoryResult.data);
      setLowStock(stockResult.data);
    }).catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Could not load your overview."));
  }, []);

  const publishedCount = products.filter((product) => product.publicationStatus === "published").length;
  const metricCards = [
    { label: "Products", value: products.length, detail: `${publishedCount} published to your store`, icon: Package, tone: "rose" },
    { label: "Categories", value: categories.length, detail: "Catalog collections", icon: Tags, tone: "sand" },
    { label: "Low stock", value: lowStock.length, detail: lowStock.length ? "Variants need attention" : "Inventory looks healthy", icon: CircleAlert, tone: "gold" },
    { label: "Store status", value: "Live", detail: "Catalog changes publish to web", icon: TrendingUp, tone: "green" }
  ];

  return (
    <main>
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div><p className="admin-eyebrow">Store overview</p><h1 className="admin-page-title mt-2">Your business, at a glance.</h1><p className="admin-page-subtitle">A clear view of your catalog and what needs attention today.</p></div>
        <Link href="/products/new" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#754241] px-5 text-sm font-medium text-white shadow-sm transition hover:bg-[#603634]"><Plus size={17} /> Add a product</Link>
      </div>

      {error ? <div className="mt-6 rounded-xl border border-[#edc8be] bg-[#fff3ef] px-4 py-3 text-sm text-[#9a463d]">{error}</div> : null}

      <section className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map(({ label, value, detail, icon: Icon, tone }) => (
          <article key={label} className="panel flex items-start justify-between gap-3 p-5 sm:p-5">
            <div><p className="text-xs font-medium text-[#826e67]">{label}</p><p className="mt-3 text-3xl font-semibold tracking-tight text-[#392623]">{value}</p><p className="mt-1 text-[11px] leading-5 text-[#927e76]">{detail}</p></div>
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] ${tone === "rose" ? "bg-[#f7e8e4] text-[#9c5e5d]" : tone === "sand" ? "bg-[#f5eee4] text-[#9a7655]" : tone === "gold" ? "bg-[#fbf1df] text-[#a4762d]" : "bg-[#eaf2eb] text-[#56806b]"}`}><Icon size={18} /></span>
          </article>
        ))}
      </section>

      <section className="mt-6 grid gap-5 xl:grid-cols-[1.45fr_0.85fr]">
        <div className="panel overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-[#f0e7e2] px-5 py-4 sm:px-6">
            <div><h2 className="font-display text-xl text-[#392623]">Recently updated</h2><p className="mt-1 text-xs text-[#927e76]">Your latest catalog changes</p></div>
            <Link href="/products" className="inline-flex items-center gap-1 text-xs font-semibold text-[#8e5552] hover:text-[#603634]">All products <ArrowRight size={14} /></Link>
          </div>
          {products.length ? <div className="divide-y divide-[#f0e7e2]">
            {[...products].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)).slice(0, 5).map((product) => (
              <Link key={product._id} href={`/products/${product._id}`} className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-[#fff9f6] sm:px-6">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f6ece7] text-[#9c5e5d]"><Package size={17} /></span>
                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-[#493530]">{product.name}</span><span className="mt-1 block truncate text-[11px] text-[#9a857d]">/{product.slug}</span></span>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize ${product.publicationStatus === "published" ? "bg-[#eaf2eb] text-[#50795f]" : "bg-[#f5eee4] text-[#91724c]"}`}>{product.publicationStatus}</span>
              </Link>
            ))}
          </div> : <div className="px-6 py-12 text-center"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f7eeea] text-[#9c5e5d]"><Boxes size={21} /></span><p className="mt-3 text-sm font-medium text-[#493530]">Your catalog starts here</p><p className="mt-1 text-xs text-[#927e76]">Add your first product to make it available to shoppers.</p><Link href="/products/new" className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#754241] px-4 py-2 text-xs font-medium text-white"><Plus size={14} /> Create a product</Link></div>}
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-1">
          <div className="panel p-5 sm:p-6"><div className="flex items-center justify-between"><div><p className="admin-eyebrow">Next steps</p><h2 className="mt-2 font-display text-xl text-[#392623]">Keep things moving</h2></div><ShoppingBag size={19} className="text-[#a2766e]" /></div>
            <div className="mt-4 grid gap-2">
              <Link href="/categories" className="admin-shortcut"><span className="admin-shortcut-icon"><Tags size={16} /></span><span><strong>Organize categories</strong><small>Build a clear shop structure</small></span><ArrowRight size={15} className="ml-auto text-[#a78d84]" /></Link>
              <Link href="/products" className="admin-shortcut"><span className="admin-shortcut-icon"><Boxes size={16} /></span><span><strong>Review inventory</strong><small>Check stock and product status</small></span><ArrowRight size={15} className="ml-auto text-[#a78d84]" /></Link>
            </div>
          </div>
          <div className="rounded-[18px] bg-[#754241] p-5 text-white sm:p-6"><p className="text-[9px] font-semibold uppercase tracking-[.2em] text-white/65">Inventory attention</p><div className="mt-2 flex items-end justify-between gap-3"><div><p className="font-display text-3xl">{lowStock.length ? `${lowStock.length} items` : "All clear"}</p><p className="mt-1 text-[11px] text-white/70">{lowStock.length ? "Variants at or below their stock threshold" : "No low stock variants right now"}</p></div><Link href="/products" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 transition hover:bg-white/25" aria-label="View inventory"><ArrowRight size={17} /></Link></div></div>
        </div>
      </section>
    </main>
  );
}
