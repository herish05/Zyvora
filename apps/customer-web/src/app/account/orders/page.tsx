"use client";

import { getMockOrders } from "../../../lib/mock-account";

const formatMinor = (amountMinor: number) => `₹${(amountMinor / 100).toLocaleString("en-IN")}`;

export default function AccountOrdersPage() {
  const orders = getMockOrders();

  return (
    <div className="card-premium p-5 sm:p-6">
      <h2 className="text-2xl" style={{ fontFamily: "var(--font-display)" }}>My Orders</h2>
      <div className="mt-4 space-y-3">
        {orders.map((order) => (
          <article key={order.id} className="rounded-xl border border-[#eadfce] bg-white p-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">{order.id}</p>
              <p className="rounded-full bg-[#f2ebe0] px-3 py-1 text-xs uppercase tracking-[0.08em] text-[#7e5112]">{order.status}</p>
            </div>
            <p className="mt-1 text-[#5f5a52]">Placed on {order.createdAt}</p>
            <p className="mt-1 text-[#5f5a52]">{order.itemCount} item(s)</p>
            <p className="mt-2 font-medium">Total {formatMinor(order.totalMinor)}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
