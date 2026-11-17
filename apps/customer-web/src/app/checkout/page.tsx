"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { buildMockCartView, readMockCartStorage } from "../../lib/mock-cart";
import { ensureActiveCustomerToken } from "../../lib/api";
import { readCustomerAddresses } from "../../lib/mock-account";

const formatMinor = (amountMinor: number, currency: string) => {
  const amount = amountMinor / 100;
  return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(amount);
};

export default function CheckoutPage() {
  const cart = useMemo(() => buildMockCartView(readMockCartStorage()), []);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const addresses = useMemo(() => readCustomerAddresses(), []);
  const [selectedAddressId, setSelectedAddressId] = useState(addresses[0]?.id ?? "");
  const [placed, setPlaced] = useState(false);

  useEffect(() => {
    const syncAuth = async () => {
      const token = await ensureActiveCustomerToken();
      setIsLoggedIn(Boolean(token));
    };

    void syncAuth();
  }, []);

  const placeOrder = () => {
    if (!isLoggedIn || !selectedAddressId || cart.items.length === 0) {
      return;
    }
    setPlaced(true);
  };

  return (
    <main className="mx-auto max-w-5xl px-4 pb-14 pt-6 sm:px-8">
      <h1 className="text-3xl sm:text-4xl" style={{ fontFamily: "var(--font-display)" }}>Checkout</h1>
      <div className="card-premium mt-6 p-6">
        <p className="text-sm text-[#5f5a52]">Review your cart, set delivery address, and place order.</p>

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

        <button
          type="button"
          onClick={placeOrder}
          disabled={!isLoggedIn || !selectedAddressId || cart.items.length === 0}
          className="mt-4 rounded-full bg-[#162e36] px-5 py-2.5 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Place Order
        </button>
        {placed ? <p className="mt-3 text-sm text-[#1e5a39]">Order placed successfully (demo).</p> : null}
      </div>
    </main>
  );
}
