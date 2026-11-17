"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest, getStoredAdminToken } from "../../lib/api";

type ProductItem = {
  _id: string;
  name: string;
  slug: string;
  publicationStatus: string;
  updatedAt: string;
};

type LowStockRow = {
  inventory: { available: number; lowStockThreshold: number };
  variant?: { sku: string };
  product?: { name: string };
};

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [lowStock, setLowStock] = useState<LowStockRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getStoredAdminToken();
    if (!token) {
      setError("Admin token not found. Please sign in first.");
      return;
    }

    Promise.all([
      apiRequest<ProductItem[]>("/admin/products", undefined, token),
      apiRequest<LowStockRow[]>("/admin/inventory/low-stock", undefined, token)
    ])
      .then(([productsRes, lowStockRes]) => {
        setProducts(productsRes.data);
        setLowStock(lowStockRes.data);
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Failed to load product data");
      });
  }, []);

  return (
    <main className="mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl sm:text-4xl" style={{ fontFamily: "var(--font-display)" }}>Products</h1>
        <Link href="/products/new" className="rounded-full bg-[#111827] px-4 py-2 text-sm text-white">Create Product</Link>
      </div>

      {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}

      <div className="panel mt-6 w-full max-w-full overflow-x-auto p-5">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead>
            <tr className="border-b border-[#e5e7eb] text-[#5b6470]">
              <th className="py-2 pr-4">Name</th>
              <th className="py-2 pr-4">Slug</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">Updated</th>
              <th className="py-2 pr-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product._id} className="border-b border-[#f0f2f4]">
                <td className="py-2 pr-4">{product.name}</td>
                <td className="py-2 pr-4">{product.slug}</td>
                <td className="py-2 pr-4">{product.publicationStatus}</td>
                <td className="py-2 pr-4">{new Date(product.updatedAt).toLocaleString()}</td>
                <td className="py-2 pr-4">
                  <Link href={`/products/${product._id}`} className="text-[#1f3a33] underline">Open</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="panel mt-6 p-5">
        <h2 className="text-xl" style={{ fontFamily: "var(--font-display)" }}>Low Stock Alerts</h2>
        <div className="mt-3 space-y-2 text-sm">
          {lowStock.length === 0 ? <p className="text-[#5b6470]">No low-stock variants currently.</p> : null}
          {lowStock.map((row, index) => (
            <div key={`${row.variant?.sku ?? "missing"}-${index}`} className="rounded-lg border border-[#e5e7eb] p-3">
              <p className="font-medium">{row.product?.name ?? "Unknown product"}</p>
              <p className="text-[#5b6470]">
                SKU {row.variant?.sku ?? "-"} • available {row.inventory.available} • threshold {row.inventory.lowStockThreshold}
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
