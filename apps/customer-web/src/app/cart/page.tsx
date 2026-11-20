"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { buildMockCartView, MockCartStorageItem, readMockCartStorage, writeMockCartStorage } from "../../lib/mock-cart";
import { AppToast, useAppToast } from "../../components/app-toast";
import { mockProducts, type MockProduct } from "../../lib/mock-catalog";
import { getStorefrontProducts } from "../../lib/storefront-catalog";

const formatMinor = (amountMinor: number, currency: string) => {
  const amount = amountMinor / 100;
  return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(amount);
};

export default function CartPage() {
  const [storageItems, setStorageItems] = useState(readMockCartStorage());
  const [catalogProducts, setCatalogProducts] = useState<MockProduct[]>(process.env.NODE_ENV === "production" ? [] : mockProducts);
  const [isCartLoading, setIsCartLoading] = useState(true);
  const { toast, showToast, hideToast } = useAppToast();

  useEffect(() => {
    setIsCartLoading(true);
    const timer = window.setTimeout(() => {
      setStorageItems(readMockCartStorage());
      setIsCartLoading(false);
    }, 220);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    let isCurrent = true;
    getStorefrontProducts().then((products) => {
      if (isCurrent) setCatalogProducts(products ?? (process.env.NODE_ENV === "production" ? [] : mockProducts));
    });
    return () => { isCurrent = false; };
  }, []);

  const cart = useMemo(() => buildMockCartView(storageItems, catalogProducts), [storageItems, catalogProducts]);

  const changeQuantity = (key: string, quantity: number) => {
    const safeQuantity = Math.max(1, quantity);
    const [slug, variantId] = key.split(":");

    const updated = storageItems.map((item) =>
      item.slug === slug && item.variantId === variantId ? { ...item, quantity: safeQuantity } : item
    );

    setStorageItems(updated);
    writeMockCartStorage(updated);
    showToast("Cart quantity updated.", { tone: "info" });
  };

  const removeItem = (key: string) => {
    const [slug, variantId] = key.split(":");
    const removedItem = storageItems.find((item) => item.slug === slug && item.variantId === variantId) ?? null;
    const updated = storageItems.filter((item) => !(item.slug === slug && item.variantId === variantId));
    setStorageItems(updated);
    writeMockCartStorage(updated);
    showToast("Item removed from cart.", {
      tone: "warning",
      actionLabel: removedItem ? "Undo" : undefined,
      onAction: removedItem
        ? () => {
            setStorageItems((currentItems) => {
              const exists = currentItems.some(
                (item) => item.slug === removedItem.slug && item.variantId === removedItem.variantId
              );
              if (exists) {
                return currentItems;
              }
              const restored: MockCartStorageItem[] = [removedItem, ...currentItems];
              writeMockCartStorage(restored);
              return restored;
            });
          }
        : undefined
    });
  };

  if (isCartLoading) {
    return <CartSkeleton />;
  }

  return (
    <main className="mx-auto max-w-6xl px-4 pb-12 pt-6 sm:px-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl sm:text-4xl" style={{ fontFamily: "var(--font-display)" }}>Your Cart</h1>
        <Link href="/products" className="rounded-full border border-[#162e36] px-4 py-2 text-sm">Continue shopping</Link>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_320px]">
        <section className="card-premium p-5">
          <div className="space-y-4 text-sm">
            {cart.items.length === 0 ? (
              <div className="rounded-xl border border-[#eadcc8] bg-white p-5">
                <p className="text-[#5f5a52]">Your cart is empty. Add a product from the storefront to start checkout.</p>
                <Link href="/products" className="mt-3 inline-flex rounded-full bg-[#162e36] px-4 py-2 text-xs text-white">Browse products</Link>
              </div>
            ) : null}

            {cart.items.map((item) => (
              <article key={item.key} className="rounded-xl border border-[#eadcc8] bg-white p-4">
                <div className="flex gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.image} alt={item.productName} className="h-20 w-20 rounded-lg object-cover" />
                  <div className="flex-1">
                    <p className="font-semibold">{item.productName}</p>
                    <p className="text-[#5f5a52]">{item.variantLabel}</p>
                    <p className="mt-1">{formatMinor(item.unitPriceMinor, item.currency)} each</p>
                    <p className="mt-1 text-xs text-[#5f5a52]">{item.inStock ? "In stock" : "Currently unavailable"}</p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    className="rounded-md border border-[#d8c8b0] px-2 py-1"
                    onClick={() => changeQuantity(item.key, item.quantity - 1)}
                    type="button"
                  >
                    -
                  </button>
                  <span className="min-w-10 text-center">{item.quantity}</span>
                  <button
                    className="rounded-md border border-[#d8c8b0] px-2 py-1"
                    onClick={() => changeQuantity(item.key, item.quantity + 1)}
                    type="button"
                  >
                    +
                  </button>
                  <button onClick={() => removeItem(item.key)} className="ml-2 text-red-700 underline" type="button">Remove</button>
                  <p className="font-medium lg:ml-auto">{formatMinor(item.lineSubtotalMinor, item.currency)}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="card-premium p-5">
          <h2 className="text-xl" style={{ fontFamily: "var(--font-display)" }}>Order Summary</h2>
          <p className="mt-4 text-sm">Subtotal: {formatMinor(cart.totals.subtotalMinor, cart.totals.currency)}</p>
          <p className="text-sm">Shipping: {formatMinor(cart.totals.shippingMinor, cart.totals.currency)}</p>
          <p className="text-sm">Tax: {formatMinor(cart.totals.taxMinor, cart.totals.currency)}</p>
          <p className="mt-2 font-semibold">Total: {formatMinor(cart.totals.grandTotalMinor, cart.totals.currency)}</p>

          <Link href="/checkout" className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-[#162e36] px-4 py-2 text-sm text-white">
            Proceed to Checkout
          </Link>
        </aside>
      </div>

      {toast ? <AppToast message={toast.message} tone={toast.tone} visible={toast.visible} actionLabel={toast.actionLabel} onAction={toast.onAction} onClose={hideToast} /> : null}
    </main>
  );
}

function CartSkeleton() {
  return (
    <main className="mx-auto max-w-6xl px-4 pb-12 pt-6 sm:px-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="h-10 w-48 animate-pulse rounded bg-[#e4d6c0]" />
        <div className="h-10 w-36 animate-pulse rounded-full bg-[#eadcc8]" />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_320px]">
        <section className="card-premium p-5">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, idx) => (
              <article key={`cart-skeleton-${idx}`} className="rounded-xl border border-[#eadcc8] bg-white p-4">
                <div className="flex gap-3">
                  <div className="h-20 w-20 animate-pulse rounded-lg bg-[#eadcc8]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-2/3 animate-pulse rounded bg-[#eadcc8]" />
                    <div className="h-4 w-1/2 animate-pulse rounded bg-[#efe5d6]" />
                    <div className="h-4 w-1/3 animate-pulse rounded bg-[#efe5d6]" />
                  </div>
                </div>
                <div className="mt-3 h-8 w-full animate-pulse rounded bg-[#efe5d6]" />
              </article>
            ))}
          </div>
        </section>

        <aside className="card-premium p-5">
          <div className="h-7 w-40 animate-pulse rounded bg-[#e4d6c0]" />
          <div className="mt-4 space-y-2">
            <div className="h-4 w-full animate-pulse rounded bg-[#eadcc8]" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-[#eadcc8]" />
            <div className="h-4 w-4/6 animate-pulse rounded bg-[#eadcc8]" />
          </div>
          <div className="mt-4 h-10 w-full animate-pulse rounded-full bg-[#eadcc8]" />
        </aside>
      </div>
    </main>
  );
}
