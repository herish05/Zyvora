"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Clock3, PackageCheck, RefreshCw, ShoppingBag, Truck } from "lucide-react";
import { apiRequest, getStoredAdminToken } from "../../lib/api";

type OrderStatus = "new" | "confirmed" | "processing" | "shipped" | "out_for_delivery" | "delivered" | "cancelled";
type OrderItem = { productName: string; productSlug: string; sku: string; optionLabel: string; imageUrl?: string; quantity: number; unitPriceMinor: number; lineTotalMinor: number };
type AdminOrder = {
  _id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: "pending" | "paid" | "refunded";
  items: OrderItem[];
  subtotalMinor: number;
  shippingMinor: number;
  totalMinor: number;
  shippingAddress: { fullName: string; mobile: string; line1: string; city: string; state: string; postalCode: string; landmark?: string };
  trackingNumber?: string;
  createdAt: string;
};

const statusLabels: Record<OrderStatus, string> = {
  new: "New order",
  confirmed: "Confirmed",
  processing: "Packing",
  shipped: "Shipped",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled"
};

const allowedNext: Record<OrderStatus, OrderStatus[]> = {
  new: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["out_for_delivery"],
  out_for_delivery: ["delivered"],
  delivered: [],
  cancelled: []
};

const formatMoney = (amountMinor: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amountMinor / 100);

export default function OrdersPage() {
  const [token, setToken] = useState<string | null>(null);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savingOrderId, setSavingOrderId] = useState<string | null>(null);
  const [statusDrafts, setStatusDrafts] = useState<Record<string, OrderStatus>>({});
  const [paymentDrafts, setPaymentDrafts] = useState<Record<string, AdminOrder["paymentStatus"]>>({});
  const [trackingDrafts, setTrackingDrafts] = useState<Record<string, string>>({});

  const loadOrders = useCallback(async (authToken: string) => {
    const result = await apiRequest<AdminOrder[]>("/admin/orders", undefined, authToken);
    setOrders(result.data);
    setStatusDrafts(Object.fromEntries(result.data.map((order) => [order._id, order.status])));
    setPaymentDrafts(Object.fromEntries(result.data.map((order) => [order._id, order.paymentStatus])));
    setTrackingDrafts(Object.fromEntries(result.data.map((order) => [order._id, order.trackingNumber ?? ""])));
  }, []);

  useEffect(() => {
    const storedToken = getStoredAdminToken();
    if (!storedToken) {
      setError("Admin sign-in is required to view customer orders.");
      setIsLoading(false);
      return;
    }
    setToken(storedToken);
    loadOrders(storedToken).catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Orders could not be loaded."))
      .finally(() => setIsLoading(false));
  }, [loadOrders]);

  const metrics = useMemo(() => ({
    new: orders.filter((order) => order.status === "new").length,
    inProgress: orders.filter((order) => ["confirmed", "processing", "shipped", "out_for_delivery"].includes(order.status)).length,
    delivered: orders.filter((order) => order.status === "delivered").length
  }), [orders]);

  const saveOrder = async (orderId: string) => {
    if (!token) return;
    setError(null);
    setNotice(null);
    setSavingOrderId(orderId);
    try {
      await apiRequest(`/admin/orders/${orderId}`, {
        method: "PUT",
        body: JSON.stringify({
          status: statusDrafts[orderId],
          paymentStatus: paymentDrafts[orderId],
          trackingNumber: trackingDrafts[orderId]?.trim() || ""
        })
      }, token);
      await loadOrders(token);
      setNotice("Order update saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Order update could not be saved.");
    } finally {
      setSavingOrderId(null);
    }
  };

  return (
    <main className="mx-auto max-w-7xl">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="admin-eyebrow">Fulfillment / Orders</p><h1 className="admin-page-title mt-2">Orders</h1><p className="admin-page-subtitle">Confirm purchases, prepare parcels, add tracking, and update delivery progress.</p></div><button type="button" onClick={() => token && loadOrders(token)} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#e6d5cd] bg-white px-4 text-xs font-medium text-[#754241]"><RefreshCw size={14} /> Refresh orders</button></div>
      {error ? <div className="mt-5 rounded-xl border border-[#edc8be] bg-[#fff3ef] px-4 py-3 text-sm text-[#9a463d]">{error}</div> : null}
      {notice ? <div className="mt-5 rounded-xl border border-[#d8e8d8] bg-[#f0f7ef] px-4 py-3 text-sm text-[#4e7759]">{notice}</div> : null}

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          { label: "New orders", value: metrics.new, icon: ShoppingBag, detail: "Need your confirmation" },
          { label: "In fulfillment", value: metrics.inProgress, icon: Truck, detail: "Being prepared or delivered" },
          { label: "Delivered", value: metrics.delivered, icon: PackageCheck, detail: "Completed purchases" }
        ].map(({ label, value, icon: Icon, detail }) => <article key={label} className="panel flex items-center gap-3 p-4"><span className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-[#f7ece7] text-[#9c5e5d]"><Icon size={18} /></span><span><span className="block text-[11px] text-[#907a72]">{label}</span><strong className="mt-0.5 block text-xl font-semibold text-[#493530]">{value}</strong><span className="text-[10px] text-[#a18d84]">{detail}</span></span></article>)}
      </div>

      <section className="mt-5 space-y-4">
        {isLoading ? <div className="panel p-8 text-center text-sm text-[#907a72]">Loading orders…</div> : null}
        {!isLoading && orders.length === 0 ? <div className="panel p-8 text-center sm:p-12"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f7ece7] text-[#9c5e5d]"><Clock3 size={21} /></span><h2 className="mt-4 font-display text-2xl text-[#392623]">No customer orders yet</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#907a72]">When a customer checks out with a published product, their order, delivery address, selected option, and payment-on-delivery status will appear here.</p></div> : null}
        {orders.map((order) => {
          const nextStatuses = allowedNext[order.status];
          const statusValue = statusDrafts[order._id] ?? order.status;
          const statusOptions = [...new Set([order.status, ...nextStatuses])];
          return <article key={order._id} className="panel overflow-hidden">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#f0e7e2] p-5 sm:p-6">
              <div><div className="flex flex-wrap items-center gap-2"><h2 className="font-display text-xl text-[#392623]">{order.orderNumber}</h2><span className="rounded-full bg-[#f7ece7] px-2.5 py-1 text-[10px] font-semibold text-[#8e5552]">{statusLabels[order.status]}</span></div><p className="mt-1 text-xs text-[#907a72]">Placed {new Date(order.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</p></div>
              <div className="text-right"><p className="text-[10px] uppercase tracking-[.12em] text-[#9a857d]">Order total</p><p className="mt-1 text-lg font-semibold text-[#493530]">{formatMoney(order.totalMinor)}</p><p className="text-[10px] text-[#907a72]">Cash on delivery · {order.paymentStatus}</p></div>
            </div>
            <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[1fr_290px]">
              <div className="grid gap-5 sm:grid-cols-2">
                <div><p className="admin-eyebrow">Customer</p><p className="mt-2 text-sm font-semibold text-[#493530]">{order.customerName}</p><p className="mt-1 text-xs text-[#806c64]">{order.customerEmail}</p><p className="mt-1 text-xs text-[#806c64]">{order.shippingAddress.mobile}</p></div>
                <div><p className="admin-eyebrow">Deliver to</p><p className="mt-2 text-xs leading-5 text-[#806c64]">{order.shippingAddress.fullName}<br />{order.shippingAddress.line1}{order.shippingAddress.landmark ? `, ${order.shippingAddress.landmark}` : ""}<br />{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p></div>
                <div className="sm:col-span-2"><p className="admin-eyebrow">Items ({order.items.reduce((sum, item) => sum + item.quantity, 0)})</p><div className="mt-2 divide-y divide-[#f0e7e2] rounded-xl border border-[#f0e7e2]">{order.items.map((item) => <div key={`${item.sku}-${item.optionLabel}`} className="flex items-center gap-3 p-3">{item.imageUrl ? <img src={item.imageUrl} alt="" className="h-12 w-12 rounded-lg object-cover" /> : <div className="h-12 w-12 rounded-lg bg-[#f7ece7]" />}<div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-[#493530]">{item.productName}</p><p className="mt-1 text-[10px] text-[#907a72]">{item.optionLabel} · SKU {item.sku} · Qty {item.quantity}</p></div><p className="shrink-0 text-xs font-medium text-[#493530]">{formatMoney(item.lineTotalMinor)}</p></div>)}</div></div>
              </div>
              <div className="rounded-2xl bg-[#fffaf7] p-4"><p className="admin-eyebrow">Update fulfillment</p><label className="admin-label mt-3 block">Delivery status<select value={statusValue} onChange={(event) => setStatusDrafts((current) => ({ ...current, [order._id]: event.target.value as OrderStatus }))} className="admin-field mt-1.5">{statusOptions.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}</select></label><label className="admin-label mt-3 block">Payment status<select value={paymentDrafts[order._id] ?? order.paymentStatus} onChange={(event) => setPaymentDrafts((current) => ({ ...current, [order._id]: event.target.value as AdminOrder["paymentStatus"] }))} className="admin-field mt-1.5"><option value="pending">Pending collection</option><option value="paid">Paid</option><option value="refunded">Refunded</option></select></label><label className="admin-label mt-3 block">Tracking number<input value={trackingDrafts[order._id] ?? ""} onChange={(event) => setTrackingDrafts((current) => ({ ...current, [order._id]: event.target.value }))} className="admin-field mt-1.5" placeholder="Add courier tracking ID" maxLength={120} /></label><button type="button" disabled={savingOrderId === order._id} onClick={() => saveOrder(order._id)} className="mt-4 min-h-10 w-full rounded-full bg-[#754241] px-4 text-xs font-medium text-white disabled:opacity-60">{savingOrderId === order._id ? "Saving…" : "Save order update"}</button></div>
            </div>
          </article>;
        })}
      </section>
    </main>
  );
}
