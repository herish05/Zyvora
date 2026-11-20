import Link from "next/link";
import { ArrowRight, HeartHandshake, Mail, Users } from "lucide-react";

export default function CustomersPage() {
  return (
    <main>
      <div><p className="admin-eyebrow">Relationships / Customers</p><h1 className="admin-page-title mt-2">Your customers</h1><p className="admin-page-subtitle">Customer profiles, purchase history, and the people who love your store.</p></div>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          { label: "Customer profiles", detail: "Not connected", icon: Users },
          { label: "Order history", detail: "Not connected", icon: HeartHandshake },
          { label: "Support contact", detail: "hello.zyvora1@gmail.com", icon: Mail }
        ].map(({ label, detail, icon: Icon }) => <article key={label} className="panel flex items-center gap-3 p-4"><span className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-[#f7ece7] text-[#9c5e5d]"><Icon size={18} /></span><span><span className="block text-[11px] text-[#907a72]">{label}</span><strong className="mt-1 block text-xs font-semibold text-[#644c45]">{detail}</strong></span></article>)}
      </div>
      <section className="panel mt-5 grid gap-5 p-5 sm:p-7 lg:grid-cols-[1fr_300px] lg:items-center">
        <div><p className="admin-eyebrow">Customer care</p><h2 className="mt-2 font-display text-2xl text-[#392623]">Make every visit feel personal.</h2><p className="mt-2 max-w-xl text-xs leading-6 text-[#826e67]">Profiles and sign-in are available in the customer app. The admin API does not yet provide a customer directory or purchase-history endpoint, so customer records aren’t shown here.</p><Link href="/settings" className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-[#8e5552] hover:text-[#603634]">Review store contact details <ArrowRight size={14} /></Link></div>
        <div className="rounded-2xl bg-[#f7eeea] p-5"><p className="text-[9px] font-bold uppercase tracking-[.18em] text-[#a45f61]">Connect next</p><ul className="mt-3 space-y-2 text-[11px] text-[#725b54]"><li>Customer directory and search</li><li>Purchase history and lifetime value</li><li>Support notes and review moderation</li></ul></div>
      </section>
      <section className="panel mt-5 overflow-hidden"><div className="grid grid-cols-[1.2fr_1fr_1fr] gap-3 border-b border-[#f0e7e2] px-5 py-3 text-[9px] font-semibold uppercase tracking-[.14em] text-[#9a857d]"><span>Customer</span><span>Orders</span><span>Last active</span></div><div className="px-5 py-12 text-center"><p className="text-sm font-medium text-[#493530]">Customer data isn’t available yet</p><p className="mt-1 text-xs text-[#927e76]">Connect the customer admin endpoint to populate this list.</p></div></section>
    </main>
  );
}
