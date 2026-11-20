"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getMockProductBySlug, mockProducts, type MockProduct } from "../../lib/mock-catalog";
import { buildMockWishlistView, readMockWishlistStorage, removeMockWishlistItem, writeMockWishlistStorage } from "../../lib/mock-wishlist";
import { readMockCartStorage, writeMockCartStorage } from "../../lib/mock-cart";
import { AppToast, useAppToast } from "../../components/app-toast";
import { getStorefrontProducts } from "../../lib/storefront-catalog";

export default function WishlistPage() {
  const [wishlistStorage, setWishlistStorage] = useState(readMockWishlistStorage());
  const [catalogProducts, setCatalogProducts] = useState<MockProduct[]>(process.env.NODE_ENV === "production" ? [] : mockProducts);
  const { toast, showToast, hideToast } = useAppToast();
  const wishlistItems = useMemo(() => buildMockWishlistView(wishlistStorage, catalogProducts), [wishlistStorage, catalogProducts]);

  useEffect(() => {
    let isCurrent = true;
    getStorefrontProducts().then((products) => {
      if (isCurrent) setCatalogProducts(products ?? (process.env.NODE_ENV === "production" ? [] : mockProducts));
    });
    return () => { isCurrent = false; };
  }, []);

  const removeItem = (slug: string) => {
    const removedItem = wishlistStorage.find((item) => item.slug === slug) ?? null;
    const updated = removeMockWishlistItem(slug);
    setWishlistStorage(updated);
    showToast("Removed from wishlist.", {
      tone: "info",
      actionLabel: removedItem ? "Undo" : undefined,
      onAction: removedItem
        ? () => {
            setWishlistStorage((currentItems) => {
              const exists = currentItems.some((item) => item.slug === removedItem.slug);
              if (exists) {
                return currentItems;
              }

              const restored = [removedItem, ...currentItems];
              writeMockWishlistStorage(restored);
              return restored;
            });
          }
        : undefined
    });
  };

  const moveToCart = (slug: string) => {
    const product = catalogProducts.find((candidate) => candidate.slug === slug) ?? getMockProductBySlug(slug);
    const variantId = product?.variants.at(0)?.id;
    if (!variantId) return;

    const existing = readMockCartStorage();
    const matched = existing.find((item) => item.slug === slug);

    if (matched) {
      matched.quantity += 1;
    } else {
      existing.push({ slug, variantId, quantity: 1 });
    }

    writeMockCartStorage(existing);
    const updatedWishlist = removeMockWishlistItem(slug);
    setWishlistStorage(updatedWishlist);
    showToast("Moved to cart.", { tone: "success" });
  };

  return (
    <main className="mx-auto max-w-6xl px-4 pb-12 pt-6 sm:px-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl sm:text-4xl" style={{ fontFamily: "var(--font-display)" }}>Your Wishlist</h1>
        <Link href="/products" className="rounded-full border border-[#162e36] px-4 py-2 text-sm">Browse more</Link>
      </div>

      <div className="mt-6 space-y-3 text-sm">
        {wishlistItems.length === 0 ? (
          <div className="card-premium p-5">
            <p className="text-[#5f5a52]">No wishlist items yet. Explore products and save your favorites.</p>
          </div>
        ) : null}

        {wishlistItems.map((item) => (
          <article key={item.slug} className="card-premium p-4">
            <div className="flex flex-wrap gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.image} alt={item.name} className="h-24 w-24 rounded-lg object-cover" />
              <div className="flex-1">
                <p className="font-semibold">{item.name}</p>
                <p className="text-[#5f5a52]">{item.brand} • {item.category}</p>
                <p className="mt-1">₹{(item.priceMinor / 100).toLocaleString("en-IN")}</p>
                <p className="text-xs text-[#7e5112]">Rating {item.rating}</p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <Link href={`/products/${item.slug}`} className="underline">View product</Link>
                  <button type="button" onClick={() => moveToCart(item.slug)} className="text-[#162e36] underline">Move to cart</button>
                  <button type="button" onClick={() => removeItem(item.slug)} className="text-red-700 underline">Remove</button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {toast ? <AppToast message={toast.message} tone={toast.tone} visible={toast.visible} actionLabel={toast.actionLabel} onAction={toast.onAction} onClose={hideToast} /> : null}
    </main>
  );
}
