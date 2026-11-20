"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { buildMockCartView, readMockCartStorage, writeMockCartStorage } from "../../lib/mock-cart";
import { customerApiRequest, ensureActiveCustomerToken } from "../../lib/api";
import { readCustomerAddresses } from "../../lib/mock-account";
import { mockProducts, type MockProduct } from "../../lib/mock-catalog";
import { getStorefrontProducts } from "../../lib/storefront-catalog";

const formatMinor = (amountMinor: number, currency: string) => {
  const amount = amountMinor / 100;
  return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(amount);
};

export default function CheckoutPage() {
  const [cartStorage, setCartStorage] = useState(readMockCartStorage());
  const [catalogProducts, setCatalogProducts] = useState<MockProduct[]>(process.env.NODE_ENV === "production" ? [] : mockProducts);
  const cart = useMemo(() => buildMockCartView(cartStorage, catalogProducts), [cartStorage, catalogProducts]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [placedOrderNumber, setPlacedOrderNumber] = useState<string | null>(null);
  const addresses = useMemo(() => readCustomerAddresses(), []);
  const [selectedAddressId, setSelectedAddressId] = useState(addresses[0]?.id ?? "");

  useEffect(() => {
    const syncAuth = async () => {
      const token = await ensureActiveCustomerToken();
      setIsLoggedIn(Boolean(token));
    };

    void syncAuth();
  }, []);

  useEffect(() => {
    setCartStorage(readMockCartStorage());
    let isCurrent = true;
    getStorefrontProducts().then((products) => {
      if (isCurrent) setCatalogProducts(products ?? (process.env.NODE_ENV === "production" ? [] : mockProducts));
    });
    return () => { isCurrent = false; };
  }, []);

  const placeOrder = async () => {
    if (!isLoggedIn || !selectedAddressId || cart.items.length === 0) {
      return;
    }
    const token = await ensureActiveCustomerToken();
    const address = addresses.find((item) => item.id === selectedAddressId);
    if (!token || !address) {
      setOrderError("Your sign-in or delivery address needs attention. Please try again.");
      return;
    }
    setIsPlacingOrder(true);
    setOrderError(null);
    try {
      const result = await customerApiRequest<{ orderNumber: string }>("/orders", {
        method: "POST",
        body: JSON.stringify({
          items: cartStorage.map((item) => ({ variantId: item.variantId, quantity: item.quantity })),
          shippingAddress: {
            fullName: address.fullName,
            mobile: address.mobile,
            line1: address.line1,
            city: address.city,
            state: address.state,
            postalCode: address.postalCode,
            landmark: address.landmark
          }
        })
      }, token);
      setPlacedOrderNumber(result.data.orderNumber);
      writeMockCartStorage([]);
      setCartStorage([]);
    } catch (submitError) {
      setOrderError(submitError instanceof Error ? submitError.message : "Your order could not be placed.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-4 pb-14 pt-6 sm:px-8">
      <h1 className="text-3xl sm:text-4xl" style={{ fontFamily: "var(--font-display)" }}>Checkout</h1>
      <div className="card-premium mt-6 p-6">
        <p className="text-sm text-[#5f5a52]">Review your products, choose a delivery address, and place your cash-on-delivery order.</p>

        {!isLoggedIn ? (
          <div className="mt-4 rounded-xl border border-[#e3c7a2] bg-[#fff6ea] p-4 text-sm">
            <p className="text-[#7e5112]">Please sign in to place your order.</p>
            <Link href="/signin?next=/checkout" className="mt-2 inline-flex rounded-full bg-[#162e36] px-4 py-2 text-xs text-white">Sign in with email</Link>
          </div>
        ) : null}

        {isLoggedIn ? (
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-sm font-medium">Delivery address</p>
              <Link href="/account/addresses" className="text-xs underline">Manage addresses</Link>
            </div>
            <select
              value={selectedAddressId}
              onChange={(event) => setSelectedAddressId(event.target.value)}
              className="w-full rounded-xl border border-[#d8c8b0] bg-white px-4 py-2.5 text-sm"
            >
              {addresses.map((address) => (
                <option key={address.id} value={address.id}>
                  {address.fullName} • {address.city} • {address.postalCode}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div className="mt-4 space-y-2 text-sm">
          <p>Items: {cart.items.length}</p>
          <p>Subtotal: {formatMinor(cart.totals.subtotalMinor, cart.totals.currency)}</p>
          <p>Shipping: {formatMinor(cart.totals.shippingMinor, cart.totals.currency)}</p>
          <p>Tax: {formatMinor(cart.totals.taxMinor, cart.totals.currency)}</p>
          <p className="font-semibold">Total: {formatMinor(cart.totals.grandTotalMinor, cart.totals.currency)}</p>
        </div>

        {orderError ? <p className="mt-4 rounded-xl bg-[#fff3ef] p-3 text-sm text-[#9a463d]">{orderError}</p> : null}
        <button
          type="button"
          onClick={placeOrder}
          disabled={!isLoggedIn || !selectedAddressId || cart.items.length === 0 || isPlacingOrder || Boolean(placedOrderNumber)}
          className="mt-4 rounded-full bg-[#162e36] px-5 py-2.5 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPlacingOrder ? "Placing order…" : "Place cash-on-delivery order"}
        </button>
        {placedOrderNumber ? <p className="mt-3 rounded-xl bg-[#f0f7ef] p-3 text-sm text-[#1e5a39]">Order {placedOrderNumber} placed. You can pay when it arrives.</p> : null}
      </div>
    </main>
  );
}
