"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowUpRight, Package, Plus, Search, Star, Trash2 } from "lucide-react";
import { apiRequest, getStoredAdminToken } from "../../lib/api";

type ProductItem = { _id: string; name: string; slug: string; publicationStatus: string; updatedAt: string; isOutOfStock?: boolean; isBestSeller?: boolean };
type LowStockRow = { inventory: { available: number; lowStockThreshold: number }; variant?: { sku: string }; product?: { name: string } };

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [lowStock, setLowStock] = useState<LowStockRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadData = async (authToken: string) => {
    const [productsRes, lowStockRes] = await Promise.all([
      apiRequest<ProductItem[]>("/admin/products", undefined, authToken),
      apiRequest<LowStockRow[]>("/admin/inventory/low-stock", undefined, authToken)
    ]);
    setProducts(productsRes.data);
    setLowStock(lowStockRes.data);
  };

  useEffect(() => {
    const token = getStoredAdminToken();
    if (!token) {
      setError("Your admin session is missing. Sign in again to manage the catalog.");
      setLoading(false);
      return;
    }
    setToken(token);
    loadData(token).catch((loadError) => {
      setError(loadError instanceof Error ? loadError.message : "Failed to load product data.");
    }).finally(() => setLoading(false));
  }, []);

  const updateProduct = async (product: ProductItem, updates: Partial<Pick<ProductItem, "isOutOfStock" | "isBestSeller">>) => {
    if (!token) return;
    setBusyId(product._id);
    setError(null);
    try {
      await apiRequest(`/admin/products/${product._id}`, { method: "PUT", body: JSON.stringify(updates) }, token);
      await loadData(token);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Product could not be updated.");
    } finally {
      setBusyId(null);
    }
  };

  const deleteProduct = async (product: ProductItem) => {
    if (!token || !window.confirm(`Delete “${product.name}” and its inventory records? This cannot be undone.`)) return;
    setBusyId(product._id);
    setError(null);
    try {
      await apiRequest(`/admin/products/${product._id}`, { method: "DELETE" }, token);
      await loadData(token);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Product could not be deleted.");
    } finally {
      setBusyId(null);
    }
  };

  const filteredProducts = useMemo(() => products.filter((product) => {
    const matchesQuery = `${product.name} ${product.slug}`.toLowerCase().includes(query.trim().toLowerCase());
    return matchesQuery && (statusFilter === "all" || product.publicationStatus === statusFilter);
  }), [products, query, statusFilter]);

  const publishedCount = products.filter((product) => product.publicationStatus === "published").length;
  const metricCards = [
    { label: "All products", value: products.length, tone: "bg-[#f7ece7] text-[#9c5e5d]", icon: Package },
    { label: "Published", value: publishedCount, tone: "bg-[#eaf2eb] text-[#56806b]", icon: ArrowUpRight },
    { label: "Low stock", value: lowStock.length, tone: "bg-[#fbf1df] text-[#a4762d]", icon: AlertTriangle }
  ];

  return (
    <main>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="admin-eyebrow">Catalog / Products</p><h1 className="admin-page-title mt-2">Products</h1><p className="admin-page-subtitle">Manage the pieces customers see in your store.</p></div>
        <Link href="/products/new" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#754241] px-5 text-sm font-medium text-white hover:bg-[#603634]"><Plus size={17} /> Add product</Link>
      </div>

      {error ? <div className="mt-6 rounded-xl border border-[#edc8be] bg-[#fff3ef] px-4 py-3 text-sm text-[#9a463d]">{error}</div> : null}

      <div className="mt-7 grid gap-3 sm:grid-cols-3">
        {metricCards.map(({ label, value, tone, icon: Icon }) => <article key={label} className="panel flex items-center gap-3 p-4"><span className={`flex h-10 w-10 items-center justify-center rounded-[13px] ${tone}`}><Icon size={18} /></span><span><span className="block text-[11px] text-[#907a72]">{label}</span><strong className="mt-0.5 block text-xl text-[#392623]">{value}</strong></span></article>)}
      </div>

      <section className="panel mt-5 overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-[#f0e7e2] p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div><h2 className="font-display text-xl text-[#392623]">Your catalog</h2><p className="mt-1 text-xs text-[#927e76]">{filteredProducts.length} products</p></div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative"><Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#a18c84]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products" className="admin-field w-full pl-9 sm:w-52" /></label>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="admin-field sm:w-40"><option value="all">All statuses</option>{["published", "draft", "scheduled", "unpublished", "archived"].map((status) => <option key={status} value={status}>{status}</option>)}</select>
          </div>
        </div>

        {loading ? <div className="p-8 text-center text-sm text-[#907a72]">Loading your catalog…</div> : filteredProducts.length === 0 ? <div className="px-5 py-12 text-center"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f7eeea] text-[#9c5e5d]"><Package size={21} /></span><p className="mt-3 text-sm font-medium text-[#493530]">{products.length ? "No products match those filters" : "No products yet"}</p><p className="mt-1 text-xs text-[#927e76]">{products.length ? "Try another search or status." : "Create a product to start building your storefront."}</p>{!products.length ? <Link href="/products/new" className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#754241] px-4 py-2 text-xs font-medium text-white"><Plus size={14} /> Add first product</Link> : null}</div> : (
          <>
            <div className="divide-y divide-[#f0e7e2] md:hidden">{filteredProducts.map((product) => <article key={product._id} className="flex items-center gap-3 p-4"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f7ece7] text-[#9c5e5d]"><Package size={18} /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-[#493530]">{product.name}</p><p className="mt-1 truncate text-[10px] text-[#927e76]">/{product.slug}</p><span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[9px] font-semibold capitalize ${product.publicationStatus === "published" ? "bg-[#eaf2eb] text-[#50795f]" : "bg-[#f5eee4] text-[#91724c]"}`}>{product.publicationStatus}</span><div className="mt-2 flex flex-wrap gap-1.5"><button type="button" disabled={busyId === product._id} onClick={() => updateProduct(product, { isOutOfStock: !product.isOutOfStock })} className="rounded-full bg-[#f4eee9] px-2.5 py-1 text-[9px] font-medium text-[#806c64]">{product.isOutOfStock ? "Restore stock" : "Mark out of stock"}</button><button type="button" disabled={busyId === product._id} onClick={() => updateProduct(product, { isBestSeller: !product.isBestSeller })} className="rounded-full bg-[#f7ece7] px-2.5 py-1 text-[9px] font-medium text-[#8e5552]">{product.isBestSeller ? "Remove bestseller" : "Mark bestseller"}</button></div></div><div className="flex flex-col gap-1"><Link href={`/products/${product._id}`} className="rounded-full border border-[#eaded7] p-2 text-[#754241]" aria-label={`Edit ${product.name}`}><ArrowUpRight size={16} /></Link><button type="button" onClick={() => deleteProduct(product)} disabled={busyId === product._id} className="rounded-full p-2 text-[#9a625b] hover:bg-[#fff0ec]" aria-label={`Delete ${product.name}`}><Trash2 size={15} /></button></div></article>)}</div>
            <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[900px] text-left text-sm"><thead><tr className="border-b border-[#f0e7e2] text-[10px] uppercase tracking-[.13em] text-[#9a857d]"><th className="px-5 py-3 font-semibold">Product</th><th className="px-4 py-3 font-semibold">Slug</th><th className="px-4 py-3 font-semibold">Status</th><th className="px-4 py-3 font-semibold">Customer labels</th><th className="px-4 py-3 font-semibold">Last updated</th><th className="px-5 py-3" /></tr></thead><tbody>{filteredProducts.map((product) => <tr key={product._id} className="border-b border-[#f5efeb] last:border-0 hover:bg-[#fffaf7]"><td className="px-5 py-4 font-medium text-[#493530]">{product.name}</td><td className="px-4 py-4 text-xs text-[#907a72]">/{product.slug}</td><td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize ${product.publicationStatus === "published" ? "bg-[#eaf2eb] text-[#50795f]" : "bg-[#f5eee4] text-[#91724c]"}`}>{product.publicationStatus}</span></td><td className="px-4 py-4"><div className="flex flex-wrap gap-1.5"><button type="button" disabled={busyId === product._id} onClick={() => updateProduct(product, { isOutOfStock: !product.isOutOfStock })} className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${product.isOutOfStock ? "bg-[#fbf1df] text-[#956b2e]" : "bg-[#f4eee9] text-[#806c64]"}`}>{product.isOutOfStock ? "Out of stock" : "In stock"}</button><button type="button" disabled={busyId === product._id} onClick={() => updateProduct(product, { isBestSeller: !product.isBestSeller })} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium ${product.isBestSeller ? "bg-[#f7ece7] text-[#8e5552]" : "bg-[#f4eee9] text-[#806c64]"}`}><Star size={11} />{product.isBestSeller ? "Bestseller" : "Mark bestseller"}</button></div></td><td className="px-4 py-4 text-xs text-[#907a72]">{new Date(product.updatedAt).toLocaleDateString()}</td><td className="px-5 py-4 text-right"><div className="inline-flex items-center gap-3"><Link href={`/products/${product._id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-[#8e5552] hover:text-[#603634]">Edit <ArrowUpRight size={14} /></Link><button type="button" onClick={() => deleteProduct(product)} disabled={busyId === product._id} className="rounded-full p-2 text-[#9a625b] hover:bg-[#fff0ec] disabled:opacity-50" aria-label={`Delete ${product.name}`}><Trash2 size={14} /></button></div></td></tr>)}</tbody></table></div>
          </>
        )}
      </section>

      <section className="panel mt-5 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="admin-eyebrow">Inventory watch</p><h2 className="mt-1 font-display text-xl text-[#392623]">Low stock alerts</h2></div><span className="rounded-full bg-[#fbf1df] px-3 py-1 text-[10px] font-semibold text-[#956b2e]">{lowStock.length} need attention</span></div>
        {lowStock.length === 0 ? <p className="mt-4 text-sm text-[#907a72]">No low-stock variants currently.</p> : <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{lowStock.map((row, index) => <article key={`${row.variant?.sku ?? "missing"}-${index}`} className="flex items-center gap-3 rounded-xl border border-[#f0e7e2] p-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fbf1df] text-[#a4762d]"><AlertTriangle size={16} /></span><div className="min-w-0"><p className="truncate text-xs font-semibold text-[#493530]">{row.product?.name ?? "Unknown product"}</p><p className="mt-1 truncate text-[10px] text-[#927e76]">{row.variant?.sku ?? "No SKU"} · {row.inventory.available} left · alert at {row.inventory.lowStockThreshold}</p></div></article>)}</div>}
      </section>
    </main>
  );
}
