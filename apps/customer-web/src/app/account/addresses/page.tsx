"use client";

import { useEffect, useState } from "react";
import { CustomerAddress, readCustomerAddresses, removeCustomerAddress, upsertCustomerAddress } from "../../../lib/mock-account";

const emptyAddress: Omit<CustomerAddress, "id"> = {
  fullName: "",
  mobile: "",
  line1: "",
  city: "",
  state: "",
  postalCode: "",
  landmark: "",
  tag: "home"
};

export default function AccountAddressesPage() {
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [draft, setDraft] = useState(emptyAddress);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setAddresses(readCustomerAddresses());
  }, []);

  const saveAddress = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const updated = upsertCustomerAddress(draft);
    setAddresses(updated);
    setDraft(emptyAddress);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div className="space-y-4">
      <section className="card-premium p-5 sm:p-6">
        <h2 className="text-2xl" style={{ fontFamily: "var(--font-display)" }}>Manage Addresses</h2>
        <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={saveAddress}>
          <input value={draft.fullName} onChange={(event) => setDraft((current) => ({ ...current, fullName: event.target.value }))} placeholder="Full name" className="w-full rounded-xl border border-[#d8c8b0] bg-white px-4 py-2.5" required />
          <input value={draft.mobile} onChange={(event) => setDraft((current) => ({ ...current, mobile: event.target.value }))} placeholder="Mobile" className="w-full rounded-xl border border-[#d8c8b0] bg-white px-4 py-2.5" required />
          <input value={draft.line1} onChange={(event) => setDraft((current) => ({ ...current, line1: event.target.value }))} placeholder="Address line" className="w-full rounded-xl border border-[#d8c8b0] bg-white px-4 py-2.5 sm:col-span-2" required />
          <input value={draft.city} onChange={(event) => setDraft((current) => ({ ...current, city: event.target.value }))} placeholder="City" className="w-full rounded-xl border border-[#d8c8b0] bg-white px-4 py-2.5" required />
          <input value={draft.state} onChange={(event) => setDraft((current) => ({ ...current, state: event.target.value }))} placeholder="State" className="w-full rounded-xl border border-[#d8c8b0] bg-white px-4 py-2.5" required />
          <input value={draft.postalCode} onChange={(event) => setDraft((current) => ({ ...current, postalCode: event.target.value }))} placeholder="Postal code" className="w-full rounded-xl border border-[#d8c8b0] bg-white px-4 py-2.5" required />
          <input value={draft.landmark} onChange={(event) => setDraft((current) => ({ ...current, landmark: event.target.value }))} placeholder="Landmark (optional)" className="w-full rounded-xl border border-[#d8c8b0] bg-white px-4 py-2.5" />
          <select value={draft.tag} onChange={(event) => setDraft((current) => ({ ...current, tag: event.target.value as CustomerAddress["tag"] }))} className="w-full rounded-xl border border-[#d8c8b0] bg-white px-4 py-2.5">
            <option value="home">Home</option>
            <option value="work">Work</option>
          </select>
          <button className="rounded-full bg-[#162e36] px-5 py-2.5 text-sm text-white sm:col-span-2" type="submit">Add Address</button>
        </form>
        {saved ? <p className="mt-3 text-sm text-[#1e5a39]">Address saved.</p> : null}
      </section>

      <section className="card-premium p-5 sm:p-6">
        <h3 className="text-xl" style={{ fontFamily: "var(--font-display)" }}>Saved Addresses</h3>
        <div className="mt-3 space-y-3 text-sm">
          {addresses.map((address) => (
            <article key={address.id} className="rounded-xl border border-[#eadfce] bg-white p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">{address.fullName}</p>
                <span className="rounded-full bg-[#f2ebe0] px-2 py-0.5 text-xs uppercase text-[#7e5112]">{address.tag}</span>
              </div>
              <p className="mt-1 text-[#5f5a52]">{address.mobile}</p>
              <p className="mt-1 text-[#5f5a52]">{address.line1}</p>
              <p className="text-[#5f5a52]">{address.city}, {address.state} - {address.postalCode}</p>
              {address.landmark ? <p className="text-[#5f5a52]">Landmark: {address.landmark}</p> : null}
              <button
                type="button"
                onClick={() => setAddresses(removeCustomerAddress(address.id))}
                className="mt-2 text-red-700 underline"
              >
                Remove
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
