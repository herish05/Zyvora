"use client";

import { useEffect, useState } from "react";
import { customerApiRequest, ensureActiveCustomerToken } from "../../../lib/api";
import { getMockOrders } from "../../../lib/mock-account";

type CustomerOrder = {
  _id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalMinor: number;
  createdAt: string;
  trackingNumber?: string;
  items: Array<{ productName: string; optionLabel: string; quantity: number }>;
};

const statusLabel = (status: string) => status.replaceAll("_", " ");
const formatMinor = (amountMinor: number) => `₹${(amountMinor / 100).toLocaleString("en-IN")}`;

export default function AccountOrdersPage() {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;
    const loadOrders = async () => {
      const token = await ensureActiveCustomerToken();
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const result = await customerApiRequest<CustomerOrder[]>("/orders", undefined, token);
        if (isCurrent) setOrders(result.data);
      } catch (loadError) {
        if (isCurrent) {
          setError(loadError instanceof Error ? loadError.message : "Your orders could not be loaded.");
          if (process.env.NODE_ENV !== "production") {
            setOrders(getMockOrders().map((order) => ({
              _id: order.id,
              orderNumber: order.id,
              status: order.status,
              paymentStatus: "paid",
              totalMinor: order.totalMinor,
              createdAt: order.createdAt,
              items: []
            })));
          }
        }
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    };
    void loadOrders();
    return () => { isCurrent = false; };
  }, []);

  return (
    <div className="card-premium p-5 sm:p-6">
      <h2 className="text-2xl" style={{ fontFamily: "var(--font-display)" }}>My Orders</h2>
      <p className="mt-1 text-sm text-[#806c64]">Follow your delivery from confirmation to arrival.</p>
      {error ? <p className="mt-4 rounded-xl bg-[#fff3ef] p-3 text-sm text-[#9a463d]">{error}</p> : null}
      {isLoading ? <p className="mt-5 text-sm text-[#806c64]">Loading your orders…</p> : null}
      {!isLoading && !orders.length ? <p className="mt-5 rounded-xl border border-[#eadfce] bg-white p-5 text-sm text-[#806c64]">You haven’t placed any orders yet.</p> : null}
      <div className="mt-4 space-y-3">
        {orders.map((order) => (
          <article key={order._id} className="rounded-xl border border-[#eadfce] bg-white p-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold">{order.orderNumber}</p><p className="rounded-full bg-[#f2ebe0] px-3 py-1 text-xs capitalize tracking-[0.04em] text-[#7e5112]">{statusLabel(order.status)}</p></div>
            <p className="mt-1 text-xs text-[#5f5a52]">Placed {new Date(order.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })} · Payment {order.paymentStatus}</p>
            <div className="mt-3 space-y-1">{order.items.map((item, index) => <p key={`${item.productName}-${index}`} className="text-xs text-[#5f5a52]">{item.productName} · {item.optionLabel} · Qty {item.quantity}</p>)}</div>
            {order.trackingNumber ? <p className="mt-2 text-xs text-[#5f5a52]">Tracking number: <span className="font-medium">{order.trackingNumber}</span></p> : null}
            <p className="mt-2 font-medium">Total {formatMinor(order.totalMinor)}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
