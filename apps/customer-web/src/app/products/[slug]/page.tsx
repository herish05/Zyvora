"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { getMockProductBySlug, getMockSimilarProducts, type MockProduct } from "../../../lib/mock-catalog";
import { getStorefrontProduct } from "../../../lib/storefront-catalog";
import { hasMockWishlistItem, MOCK_WISHLIST_UPDATED_EVENT, toggleMockWishlistItem } from "../../../lib/mock-wishlist";
import { upsertMockCartItem } from "../../../lib/mock-cart";
import { AppToast, useAppToast } from "../../../components/app-toast";

const formatMinor = (amountMinor: number, currency: string) => {
  const amount = amountMinor / 100;
  return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(amount);
};

const isVideoUrl = (url: string) => /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);

export default function ProductDetailDynamicPage() {
  const params = useParams();
  const router = useRouter();
  const slug = String(params.slug ?? "");

  const [product, setProduct] = useState<MockProduct | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const { toast, showToast, hideToast } = useAppToast();

  useEffect(() => {
    setIsPageLoading(true);
    let isCurrent = true;
    getStorefrontProduct(slug).then((storeProduct) => {
      if (!isCurrent) return;
      const resolvedProduct = storeProduct ?? (process.env.NODE_ENV === "production" ? null : getMockProductBySlug(slug));
      setProduct(resolvedProduct);
      setSelectedVariantId(resolvedProduct?.variants[0]?.id ?? "");
      setSelectedMediaIndex(0);
      setIsPageLoading(false);
    });
    return () => {
      isCurrent = false;
    };
  }, [slug]);

  useEffect(() => {
    const syncWishlistState = () => {
      setIsInWishlist(hasMockWishlistItem(slug));
    };

    syncWishlistState();
    window.addEventListener(MOCK_WISHLIST_UPDATED_EVENT, syncWishlistState);

    return () => {
      window.removeEventListener(MOCK_WISHLIST_UPDATED_EVENT, syncWishlistState);
    };
  }, [slug]);

  if (isPageLoading) {
    return <ProductDetailSkeleton />;
  }

  if (!product) {
    return (
      <main className="mx-auto max-w-7xl px-4 pb-14 pt-6 sm:px-8">
        <p className="text-sm text-[#5f5a52]">No products available.</p>
      </main>
    );
  }

  const activeVariantId = selectedVariantId || product.variants.at(0)?.id || "";

  const addToCart = async () => {
    if (!activeVariantId) {
      setError("Please select a variant");
      return;
    }

    const selectedVariant = product.variants.find((variant) => variant.id === activeVariantId);
    if (!selectedVariant) {
      setError("Selected variant unavailable");
      return;
    }
    if (!selectedVariant.inStock) {
      setError("This option is currently out of stock.");
      return;
    }

    upsertMockCartItem(product.slug, selectedVariant.id);
    showToast("Added to cart. Open Cart to continue checkout.", { tone: "success" });
  };

  const toggleWishlist = async () => {
    const nowSaved = toggleMockWishlistItem(product.slug);
    showToast(nowSaved ? "Saved to wishlist." : "Removed from wishlist.", { tone: nowSaved ? "success" : "info" });
  };

  const selectedVariant = product.variants.find((variant) => variant.id === activeVariantId) ?? product.variants.at(0) ?? null;
  const selectedMediaUrls = product.images.filter((url) => url.length > 0);
  const selectedMediaUrl = selectedMediaUrls[selectedMediaIndex] ?? selectedMediaUrls[0] ?? null;
  const similarProducts = getMockSimilarProducts(product);

  return (
    <main className="mx-auto max-w-7xl px-4 pb-14 pt-6 sm:px-8">
      <div className="grid gap-6 lg:grid-cols-2">
      <section className="card-premium p-5">
        {selectedMediaUrl ? (
          <div className="h-64 overflow-hidden rounded-2xl bg-[#efe5d6] sm:h-80">
            {isVideoUrl(selectedMediaUrl) ? (
              <video src={selectedMediaUrl} controls className="h-full w-full object-cover" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selectedMediaUrl} alt={product.name} className="h-full w-full object-cover" />
            )}
          </div>
        ) : (
          <div className="h-64 rounded-2xl bg-[#efe5d6] sm:h-80" />
        )}

        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {selectedMediaUrls.length > 0
            ? selectedMediaUrls.slice(0, 8).map((mediaUrl, idx) => (
                <button
                  key={`${mediaUrl}-${idx}`}
                  type="button"
                  onClick={() => setSelectedMediaIndex(idx)}
                  className={`h-20 overflow-hidden rounded-lg border ${selectedMediaIndex === idx ? "border-[#1b1b1b]" : "border-[#eadcc8]"}`}
                >
                  {isVideoUrl(mediaUrl) ? (
                    <div className="flex h-full items-center justify-center bg-[#eadcc8] text-xs text-[#5f5a52]">Video</div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={mediaUrl} alt={`Media ${idx + 1}`} className="h-full w-full object-cover" />
                  )}
                </button>
              ))
            : Array.from({ length: 4 }).map((_, idx) => <div key={idx} className="h-20 rounded-lg bg-[#eadcc8]" />)}
        </div>
      </section>
      <section className="card-premium p-6">
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <p className="text-xs uppercase tracking-[0.14em] text-[#7e5112]">{product.brand}</p>
        <h1 className="mt-2 text-3xl leading-tight sm:text-4xl" style={{ fontFamily: "var(--font-display)" }}>{product.name}</h1>
        {product.categoryName ? <p className="mt-2 text-xs text-[#8b756d]">{product.categoryName}</p> : null}
        {selectedVariant ? <p className="mt-2 text-sm text-[#5f5a52]">Variant: {selectedVariant.label}</p> : null}
        {product.reviewCount > 0 ? <p className="mt-2 inline-flex items-center gap-1 text-sm text-[#5f5a52]"><Star size={14} /> {product.rating} ({product.reviewCount} reviews)</p> : null}
        {selectedVariant ? <p className="mt-4 text-2xl font-semibold">{formatMinor(selectedVariant.priceMinor, selectedVariant.currency ?? "INR")}</p> : null}
        {selectedVariant?.compareAtMinor ? (
          <p className="text-sm text-[#5f5a52] line-through">{formatMinor(selectedVariant.compareAtMinor, selectedVariant.currency ?? "INR")}</p>
        ) : null}
        <p className="mt-4 text-sm text-[#5f5a52]">{product.shortDescription || product.description || "Premium product details available."}</p>

        {product.variants.length ? (
          <div className="mt-5">
            <label className="mb-1 block text-xs uppercase tracking-[0.12em] text-[#7e5112]">Choose variant</label>
            <select
              value={activeVariantId}
              onChange={(event) => {
                setSelectedVariantId(event.target.value);
                setSelectedMediaIndex(0);
              }}
              className="w-full rounded-xl border border-[#d8c8b0] bg-white px-4 py-2.5"
            >
              {product.variants.map((variant) => (
                <option key={variant.id} value={variant.id}>
                  {variant.label} • {formatMinor(variant.priceMinor, "INR")} • {variant.inStock ? "In stock" : "Out of stock"}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <button className="rounded-full bg-[#1b1b1b] px-5 py-2.5 text-white disabled:cursor-not-allowed disabled:opacity-50" onClick={addToCart} type="button" disabled={!selectedVariant?.inStock}>Add to Cart</button>
          <button
            className={`rounded-full px-5 py-2.5 ${
              isInWishlist ? "border border-[#c86f1b] bg-[#fff3e4] text-[#9a4f06]" : "border border-[#1b1b1b]"
            }`}
            onClick={toggleWishlist}
            type="button"
          >
            {isInWishlist ? "Saved in Wishlist" : "Add to Wishlist"}
          </button>
          <button className="rounded-full border border-[#7e5112] px-5 py-2.5 text-[#7e5112]" onClick={() => router.push("/products")} type="button">See more products</button>
        </div>
      </section>
      </div>

      {product.description ? <section className="card-premium mt-6 p-5 sm:p-6"><h2 className="text-2xl" style={{ fontFamily: "var(--font-display)" }}>About this product</h2><p className="mt-3 whitespace-pre-line text-sm leading-7 text-[#5f5a52]">{product.description}</p></section> : null}
      {product.highlights.length ? <section className="card-premium mt-6 p-5 sm:p-6"><h2 className="text-2xl" style={{ fontFamily: "var(--font-display)" }}>Product highlights</h2><ul className="mt-3 grid gap-2 sm:grid-cols-2">{product.highlights.map((highlight) => <li key={highlight} className="rounded-xl border border-[#eadfce] bg-white px-4 py-3 text-sm text-[#5f5a52]">{highlight}</li>)}</ul></section> : null}

      {product.specifications.length ? <section className="card-premium mt-6 p-5 sm:p-6">
        <h2 className="text-2xl" style={{ fontFamily: "var(--font-display)" }}>Specifications</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {product.specifications.map((spec) => (
            <div key={spec.label} className="rounded-xl border border-[#eadfce] bg-white p-4">
              <p className="text-xs uppercase tracking-[0.11em] text-[#7e5112]">{spec.label}</p>
              <p className="mt-1 text-sm text-[#5f5a52]">{spec.value}</p>
            </div>
          ))}
        </div>
      </section> : null}

      {product.reviews.length ? <section className="card-premium mt-6 p-5 sm:p-6">
        <h2 className="text-2xl" style={{ fontFamily: "var(--font-display)" }}>Customer Reviews</h2>
        <div className="mt-4 space-y-4">
          {product.reviews.map((review) => (
            <article key={review.id} className="rounded-xl border border-[#eadfce] bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">{review.name}</p>
                <p className="inline-flex items-center gap-1 text-sm text-[#5f5a52]"><Star size={14} /> {review.rating}</p>
              </div>
              <p className="mt-2 text-sm font-medium text-[#1b1b1b]">{review.title}</p>
              <p className="mt-1 text-sm text-[#5f5a52]">{review.comment}</p>
              <p className="mt-2 text-xs text-[#7e5112]">{review.verified ? "Verified purchase" : "Customer review"} • Received on {review.receivedAt}</p>
              {review.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={review.imageUrl} alt={`${review.name} feedback`} className="mt-3 h-36 w-full max-w-36 rounded-lg object-cover" />
              ) : null}
            </article>
          ))}
        </div>
      </section> : null}

      <section className="mt-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl" style={{ fontFamily: "var(--font-display)" }}>Similar Products</h2>
          <Link href="/products" className="text-sm text-[#7e5112]">View all</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {similarProducts.map((similarProduct) => (
            <Link key={similarProduct.id} href={`/products/${similarProduct.slug}`} className="card-premium glow-hover overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={similarProduct.images[0]} alt={similarProduct.name} className="h-44 w-full object-cover" />
              <div className="p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-[#7e5112]">{similarProduct.brand}</p>
                <h3 className="mt-1 text-xl" style={{ fontFamily: "var(--font-display)" }}>{similarProduct.name}</h3>
                <p className="mt-2 text-sm text-[#5f5a52]">₹{(((similarProduct.variants.at(0)?.priceMinor ?? 0) / 100)).toLocaleString("en-IN")}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {toast ? <AppToast message={toast.message} tone={toast.tone} visible={toast.visible} actionLabel={toast.actionLabel} onAction={toast.onAction} onClose={hideToast} /> : null}
    </main>
  );
}

function ProductDetailSkeleton() {
  return (
    <main className="mx-auto max-w-7xl px-4 pb-14 pt-6 sm:px-8">
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card-premium p-5">
          <div className="h-64 animate-pulse rounded-2xl bg-[#efe5d6] sm:h-80" />
          <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={`thumb-skeleton-${idx}`} className="h-20 animate-pulse rounded-lg bg-[#eadcc8]" />
            ))}
          </div>
        </section>

        <section className="card-premium p-6">
          <div className="h-3 w-24 animate-pulse rounded bg-[#eadcc8]" />
          <div className="mt-3 h-10 w-3/4 animate-pulse rounded bg-[#e4d6c0]" />
          <div className="mt-2 h-4 w-40 animate-pulse rounded bg-[#eadcc8]" />
          <div className="mt-4 h-8 w-32 animate-pulse rounded bg-[#e4d6c0]" />
          <div className="mt-4 h-4 w-full animate-pulse rounded bg-[#eadcc8]" />
          <div className="mt-2 h-4 w-5/6 animate-pulse rounded bg-[#eadcc8]" />
          <div className="mt-5 h-10 w-full animate-pulse rounded-xl bg-[#eadcc8]" />
          <div className="mt-6 flex gap-3">
            <div className="h-10 w-28 animate-pulse rounded-full bg-[#eadcc8]" />
            <div className="h-10 w-32 animate-pulse rounded-full bg-[#eadcc8]" />
            <div className="h-10 w-32 animate-pulse rounded-full bg-[#eadcc8]" />
          </div>
        </section>
      </div>

      <section className="card-premium mt-6 p-5 sm:p-6">
        <div className="h-8 w-44 animate-pulse rounded bg-[#e4d6c0]" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={`spec-skeleton-${idx}`} className="h-20 animate-pulse rounded-xl bg-[#eadcc8]" />
          ))}
        </div>
      </section>
    </main>
  );
}
