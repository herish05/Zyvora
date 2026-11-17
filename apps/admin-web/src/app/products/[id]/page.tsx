"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiRequest, getStoredAdminToken } from "../../../lib/api";

type ProductDetail = {
  _id: string;
  name: string;
  slug: string;
  publicationStatus: "draft" | "published" | "scheduled" | "unpublished" | "archived";
  variants: Array<{
    _id: string;
    sku: string;
    priceMinor: number;
    currency: string;
    mediaUrls?: string[];
    inventory?: {
      available: number;
      lowStockThreshold: number;
    } | null;
  }>;
};

const parseMediaUrls = (value: string) =>
  value
    .split(/[\n,]/g)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

export default function ProductDetailPage() {
  const params = useParams();
  const productId = String(params.id ?? "");

  const [token, setToken] = useState<string | null>(null);
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [sku, setSku] = useState("");
  const [priceMinor, setPriceMinor] = useState(0);
  const [initialStock, setInitialStock] = useState(0);
  const [mediaUrlsText, setMediaUrlsText] = useState("");

  const [adjustmentVariantId, setAdjustmentVariantId] = useState("");
  const [adjustmentDelta, setAdjustmentDelta] = useState(0);
  const [adjustmentReason, setAdjustmentReason] = useState("manual_adjustment");
  const [publicationStatus, setPublicationStatus] = useState<ProductDetail["publicationStatus"]>("draft");
  const [scheduledAt, setScheduledAt] = useState("");
  const [thresholdVariantId, setThresholdVariantId] = useState("");
  const [lowStockThreshold, setLowStockThreshold] = useState(5);

  const loadProduct = async (authToken: string) => {
    const result = await apiRequest<ProductDetail>(`/admin/products/${productId}`, undefined, authToken);
    setProduct(result.data);
    setPublicationStatus(result.data.publicationStatus);

    const firstVariant = result.data.variants.at(0);
    if (firstVariant && !adjustmentVariantId) {
      setAdjustmentVariantId(firstVariant._id);
    }
    if (firstVariant && !thresholdVariantId) {
      setThresholdVariantId(firstVariant._id);
      setLowStockThreshold(firstVariant.inventory?.lowStockThreshold ?? 5);
    }
  };

  useEffect(() => {
    if (!productId) {
      setError("Invalid product id");
      return;
    }

    const storedToken = getStoredAdminToken();
    if (!storedToken) {
      setError("Admin token not found. Please sign in first.");
      return;
    }

    setToken(storedToken);
    loadProduct(storedToken).catch((loadError) => {
      setError(loadError instanceof Error ? loadError.message : "Failed to load product");
    });
  }, [productId]);

  const createVariant = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;

    try {
      await apiRequest(
        `/admin/products/${productId}/variants`,
        {
          method: "POST",
          body: JSON.stringify({
            sku,
            optionValues: [],
            priceMinor,
            currency: "INR",
            mediaUrls: parseMediaUrls(mediaUrlsText),
            isActive: true,
            sortOrder: 0,
            initialStock,
            lowStockThreshold: 5
          })
        },
        token
      );

      setSku("");
      setPriceMinor(0);
      setInitialStock(0);
      setMediaUrlsText("");
      await loadProduct(token);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to create variant");
    }
  };

  const adjustInventory = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !adjustmentVariantId) return;

    try {
      await apiRequest(
        `/admin/variants/${adjustmentVariantId}/inventory-adjustments`,
        {
          method: "POST",
          body: JSON.stringify({
            delta: adjustmentDelta,
            reason: adjustmentReason
          })
        },
        token
      );

      setAdjustmentDelta(0);
      await loadProduct(token);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Inventory adjustment failed");
    }
  };

  const updatePublication = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;

    try {
      await apiRequest(
        `/admin/products/${productId}`,
        {
          method: "PUT",
          body: JSON.stringify({
            publicationStatus,
            scheduledAt: publicationStatus === "scheduled" && scheduledAt ? new Date(scheduledAt).toISOString() : undefined
          })
        },
        token
      );

      await loadProduct(token);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Publication update failed");
    }
  };

  const updateThreshold = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !thresholdVariantId) return;

    try {
      await apiRequest(
        `/admin/variants/${thresholdVariantId}/low-stock-threshold`,
        {
          method: "PUT",
          body: JSON.stringify({ lowStockThreshold })
        },
        token
      );

      await loadProduct(token);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Low stock threshold update failed");
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 pb-12 pt-6 sm:px-8">
      <h1 className="text-4xl" style={{ fontFamily: "var(--font-display)" }}>
        Product Detail
      </h1>

      {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}

      {product ? (
        <>
          <section className="panel mt-6 p-6">
            <h2 className="text-2xl" style={{ fontFamily: "var(--font-display)" }}>{product.name}</h2>
            <p className="mt-2 text-sm text-[#5b6470]">/{product.slug} • {product.publicationStatus}</p>
          </section>

          <section className="panel mt-6 p-6">
            <h3 className="text-xl" style={{ fontFamily: "var(--font-display)" }}>Publication Settings</h3>
            <form className="mt-4 grid gap-3 sm:grid-cols-3" onSubmit={updatePublication}>
              <select
                value={publicationStatus}
                onChange={(event) => setPublicationStatus(event.target.value as ProductDetail["publicationStatus"])}
                className="rounded-xl border border-[#d3d7dd] px-4 py-2.5"
              >
                {["draft", "published", "scheduled", "unpublished", "archived"].map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(event) => setScheduledAt(event.target.value)}
                className="rounded-xl border border-[#d3d7dd] px-4 py-2.5"
              />
              <button className="rounded-full bg-[#111827] px-4 py-2 text-sm text-white">Update Publication</button>
            </form>
          </section>

          <section className="panel mt-6 p-6">
            <h3 className="text-xl" style={{ fontFamily: "var(--font-display)" }}>Add Variant</h3>
            <form className="mt-4 grid gap-3 sm:grid-cols-3" onSubmit={createVariant}>
              <input
                value={sku}
                onChange={(event) => setSku(event.target.value.toUpperCase())}
                placeholder="Variant SKU"
                className="rounded-xl border border-[#d3d7dd] px-4 py-2.5"
                required
              />
              <input
                value={priceMinor}
                onChange={(event) => setPriceMinor(Number(event.target.value))}
                placeholder="Price minor (e.g. paise)"
                type="number"
                min={0}
                className="rounded-xl border border-[#d3d7dd] px-4 py-2.5"
                required
              />
              <input
                value={initialStock}
                onChange={(event) => setInitialStock(Number(event.target.value))}
                placeholder="Initial stock"
                type="number"
                min={0}
                className="rounded-xl border border-[#d3d7dd] px-4 py-2.5"
                required
              />
              <textarea
                value={mediaUrlsText}
                onChange={(event) => setMediaUrlsText(event.target.value)}
                placeholder="Media URLs (one per line or comma separated)"
                className="rounded-xl border border-[#d3d7dd] px-4 py-2.5 sm:col-span-3"
                rows={4}
              />
              <button className="rounded-full bg-[#111827] px-4 py-2 text-sm text-white sm:col-span-3">Create Variant</button>
            </form>
          </section>

          <section className="panel mt-6 p-6">
            <h3 className="text-xl" style={{ fontFamily: "var(--font-display)" }}>Variants</h3>
            <div className="mt-3 space-y-3 text-sm">
              {product.variants.map((variant) => (
                <article key={variant._id} className="rounded-lg border border-[#e5e7eb] p-4">
                  <p className="font-medium">{variant.sku}</p>
                  <p className="text-[#5b6470]">Price: {variant.priceMinor} {variant.currency}</p>
                  <p className="text-[#5b6470]">
                    Stock: {variant.inventory?.available ?? 0} • Low stock threshold: {variant.inventory?.lowStockThreshold ?? 0}
                  </p>
                  <p className="text-[#5b6470]">Media assets: {variant.mediaUrls?.length ?? 0}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="panel mt-6 p-6">
            <h3 className="text-xl" style={{ fontFamily: "var(--font-display)" }}>Adjust Inventory</h3>
            <form className="mt-4 grid gap-3 sm:grid-cols-3" onSubmit={adjustInventory}>
              <select
                value={adjustmentVariantId}
                onChange={(event) => setAdjustmentVariantId(event.target.value)}
                className="rounded-xl border border-[#d3d7dd] px-4 py-2.5"
                required
              >
                {product.variants.map((variant) => (
                  <option key={variant._id} value={variant._id}>{variant.sku}</option>
                ))}
              </select>
              <input
                value={adjustmentDelta}
                onChange={(event) => setAdjustmentDelta(Number(event.target.value))}
                type="number"
                placeholder="Delta (+/-)"
                className="rounded-xl border border-[#d3d7dd] px-4 py-2.5"
                required
              />
              <input
                value={adjustmentReason}
                onChange={(event) => setAdjustmentReason(event.target.value)}
                placeholder="Reason"
                className="rounded-xl border border-[#d3d7dd] px-4 py-2.5"
                required
              />
              <button className="rounded-full bg-[#111827] px-4 py-2 text-sm text-white sm:col-span-3">Apply Adjustment</button>
            </form>
          </section>

          <section className="panel mt-6 p-6">
            <h3 className="text-xl" style={{ fontFamily: "var(--font-display)" }}>Low Stock Threshold</h3>
            <form className="mt-4 grid gap-3 sm:grid-cols-3" onSubmit={updateThreshold}>
              <select
                value={thresholdVariantId}
                onChange={(event) => {
                  const variantId = event.target.value;
                  setThresholdVariantId(variantId);
                  const variant = product.variants.find((item) => item._id === variantId);
                  setLowStockThreshold(variant?.inventory?.lowStockThreshold ?? 5);
                }}
                className="rounded-xl border border-[#d3d7dd] px-4 py-2.5"
                required
              >
                {product.variants.map((variant) => (
                  <option key={variant._id} value={variant._id}>{variant.sku}</option>
                ))}
              </select>
              <input
                value={lowStockThreshold}
                onChange={(event) => setLowStockThreshold(Number(event.target.value))}
                type="number"
                min={0}
                className="rounded-xl border border-[#d3d7dd] px-4 py-2.5"
                required
              />
              <button className="rounded-full bg-[#111827] px-4 py-2 text-sm text-white">Update Threshold</button>
            </form>
          </section>
        </>
      ) : (
        <p className="mt-6 text-sm text-[#5b6470]">Loading product...</p>
      )}
    </main>
  );
}
