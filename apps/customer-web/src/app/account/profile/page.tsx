"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CustomerProfile, readCustomerProfile, writeCustomerProfile } from "../../../lib/mock-account";

function AccountProfileContent() {
  const searchParams = useSearchParams();
  const showSetupHint = searchParams.get("setup") === "1";
  const [profile, setProfile] = useState<CustomerProfile>(readCustomerProfile());
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setProfile(readCustomerProfile());
  }, []);

  const saveProfile = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    writeCustomerProfile(profile);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div className="card-premium p-6 sm:p-7">
      <h2 className="text-2xl" style={{ fontFamily: "var(--font-display)" }}>Profile Information</h2>
      {showSetupHint ? (
        <p className="mt-3 rounded-lg border border-[#e6c89f] bg-[#fff4e4] px-3 py-2 text-sm text-[#7e5112]">
          Please complete your profile before continuing to other account sections.
        </p>
      ) : null}
      <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={saveProfile}>
        <input
          value={profile.firstName}
          onChange={(event) => setProfile((current) => ({ ...current, firstName: event.target.value }))}
          placeholder="First name"
          className="w-full rounded-xl border border-[#d8c8b0] bg-white px-4 py-2.5"
          required
        />
        <input
          value={profile.lastName}
          onChange={(event) => setProfile((current) => ({ ...current, lastName: event.target.value }))}
          placeholder="Last name"
          className="w-full rounded-xl border border-[#d8c8b0] bg-white px-4 py-2.5"
          required
        />
        <input
          value={profile.email}
          onChange={(event) => setProfile((current) => ({ ...current, email: event.target.value }))}
          placeholder="Email"
          type="email"
          className="w-full rounded-xl border border-[#d8c8b0] bg-white px-4 py-2.5 sm:col-span-2"
          required
          disabled
        />
        <input
          value={profile.mobile}
          onChange={(event) => setProfile((current) => ({ ...current, mobile: event.target.value }))}
          placeholder="Mobile"
          className="w-full rounded-xl border border-[#d8c8b0] bg-white px-4 py-2.5"
          required
        />
        <select
          value={profile.gender}
          onChange={(event) => setProfile((current) => ({ ...current, gender: event.target.value as CustomerProfile["gender"] }))}
          className="w-full rounded-xl border border-[#d8c8b0] bg-white px-4 py-2.5"
        >
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
        <button className="rounded-full bg-[#162e36] px-5 py-2.5 text-sm text-white sm:col-span-2" type="submit">Save Profile</button>
      </form>
      {saved ? <p className="mt-3 text-sm text-[#1e5a39]">Profile updated.</p> : null}
    </div>
  );
}

export default function AccountProfilePage() {
  return (
    <Suspense fallback={<div className="card-premium p-6 sm:p-7">Loading profile...</div>}>
      <AccountProfileContent />
    </Suspense>
  );
}
