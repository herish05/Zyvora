"use client";

import { useEffect, useState } from "react";
import { Check, Palette, Store } from "lucide-react";
import { apiRequest, getStoredAdminToken } from "../../lib/api";

type BusinessProfile = {
  brandName: string;
  legalBusinessName?: string;
  websiteDisplayName?: string;
  tagline?: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor: string;
  accentColor: string;
  supportEmail?: string;
  supportPhone?: string;
  currency: string;
  language: string;
  timezone: string;
  socialLinks: { instagram?: string; facebook?: string; youtube?: string; linkedin?: string; x?: string };
};

const emptyProfile: BusinessProfile = {
  brandName: "Zyvora", primaryColor: "#9C5E5D", accentColor: "#382421", currency: "INR", language: "en-IN", timezone: "Asia/Kolkata", socialLinks: {}
};

export default function SettingsPage() {
  const [profile, setProfile] = useState<BusinessProfile>(emptyProfile);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const adminToken = getStoredAdminToken();
    if (!adminToken) {
      setError("Sign in to manage business settings.");
      setLoading(false);
      return;
    }
    setToken(adminToken);
    apiRequest<BusinessProfile>("/business/profile", undefined, adminToken).then((result) => {
      setProfile({ ...emptyProfile, ...result.data, socialLinks: { ...emptyProfile.socialLinks, ...result.data.socialLinks } });
    }).catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Could not load business settings.")).finally(() => setLoading(false));
  }, []);

  const update = (key: Exclude<keyof BusinessProfile, "socialLinks">, value: string) => setProfile((current) => ({ ...current, [key]: value }));
  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const result = await apiRequest<BusinessProfile>("/business/profile", { method: "PUT", body: JSON.stringify(profile) }, token);
      setProfile({ ...emptyProfile, ...result.data, socialLinks: { ...emptyProfile.socialLinks, ...result.data.socialLinks } });
      setNotice("Your business profile has been saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save business settings.");
    } finally {
      setSaving(false);
    }
  };

  const field = (label: string, key: Exclude<keyof BusinessProfile, "socialLinks">, placeholder = "") => (
    <label className="admin-label">{label}<input value={String(profile[key] ?? "")} onChange={(event) => update(key, event.target.value)} className="admin-field mt-1.5" placeholder={placeholder} /></label>
  );

  return (
    <main>
      <div><p className="admin-eyebrow">Workspace / Settings</p><h1 className="admin-page-title mt-2">Business settings</h1><p className="admin-page-subtitle">Keep your public brand details, support contacts, and storefront identity in one place.</p></div>
      {error ? <div className="mt-5 rounded-xl border border-[#edc8be] bg-[#fff3ef] px-4 py-3 text-sm text-[#9a463d]">{error}</div> : null}
      {notice ? <div className="mt-5 flex items-center gap-2 rounded-xl border border-[#d1e4d4] bg-[#eff7ef] px-4 py-3 text-sm text-[#50795f]"><Check size={16} />{notice}</div> : null}
      <form onSubmit={save} className="mt-6 grid items-start gap-5 xl:grid-cols-[1fr_310px]">
        <div className="grid gap-5">
          <section className="panel p-5 sm:p-6"><div className="mb-5 flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#f7ece7] text-[#9c5e5d]"><Store size={18} /></span><div><h2 className="font-display text-xl text-[#392623]">Business profile</h2><p className="mt-1 text-xs text-[#927e76]">The identity and contact details displayed to shoppers.</p></div></div>
            <div className="grid gap-4 sm:grid-cols-2">
              {field("Brand name", "brandName")}{field("Storefront display name", "websiteDisplayName")}{field("Legal business name", "legalBusinessName")}{field("Tagline", "tagline")}{field("Support email", "supportEmail")}{field("Support phone", "supportPhone")}
              {field("Logo URL", "logoUrl", "https://…")}{field("Favicon URL", "faviconUrl", "https://…")}
            </div>
          </section>
          <section className="panel p-5 sm:p-6"><div className="mb-5 flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#f5eee4] text-[#9a7655]"><Palette size={18} /></span><div><h2 className="font-display text-xl text-[#392623]">Store preferences</h2><p className="mt-1 text-xs text-[#927e76]">Regional defaults used by the storefront.</p></div></div>
            <div className="grid gap-4 sm:grid-cols-2">{field("Currency", "currency", "INR")} {field("Language", "language", "en-IN")} {field("Timezone", "timezone", "Asia/Kolkata")}
              <label className="admin-label">Primary brand color<div className="mt-1.5 flex items-center gap-2"><input type="color" value={profile.primaryColor} onChange={(event) => update("primaryColor", event.target.value.toUpperCase())} className="h-10 w-12 cursor-pointer rounded-lg border border-[#e6d9d2] bg-white p-1" /><input value={profile.primaryColor} onChange={(event) => update("primaryColor", event.target.value.toUpperCase())} pattern="^#([A-Fa-f0-9]{6})$" className="admin-field" required /></div></label>
              <label className="admin-label">Accent color<div className="mt-1.5 flex items-center gap-2"><input type="color" value={profile.accentColor} onChange={(event) => update("accentColor", event.target.value.toUpperCase())} className="h-10 w-12 cursor-pointer rounded-lg border border-[#e6d9d2] bg-white p-1" /><input value={profile.accentColor} onChange={(event) => update("accentColor", event.target.value.toUpperCase())} pattern="^#([A-Fa-f0-9]{6})$" className="admin-field" required /></div></label>
            </div>
          </section>
          <section className="panel p-5 sm:p-6"><h2 className="font-display text-xl text-[#392623]">Social links</h2><p className="mt-1 text-xs text-[#927e76]">Add public profiles for the channels you use.</p><div className="mt-4 grid gap-4 sm:grid-cols-2">{(["instagram", "facebook", "youtube", "linkedin", "x"] as const).map((key) => <label key={key} className="admin-label capitalize">{key}<input value={profile.socialLinks[key] ?? ""} onChange={(event) => setProfile((current) => ({ ...current, socialLinks: { ...current.socialLinks, [key]: event.target.value } }))} className="admin-field mt-1.5" placeholder="https://…" /></label>)}</div></section>
        </div>
        <aside className="panel p-5 xl:sticky xl:top-28"><p className="admin-eyebrow">Storefront preview</p><div className="mt-3 overflow-hidden rounded-2xl border border-[#eee3dd] bg-[#fcf8f4]"><div className="flex items-center gap-2 border-b border-[#eee3dd] bg-white px-3 py-3"><span className="flex h-7 w-7 items-center justify-center rounded-full text-sm italic text-white" style={{ background: profile.primaryColor }}>Z</span><span className="font-display text-sm tracking-widest text-[#392623]">{profile.websiteDisplayName || profile.brandName || "Your store"}</span></div><div className="p-4"><p className="font-display text-lg text-[#392623]">{profile.tagline || "Your storefront tagline"}</p><button type="button" className="mt-3 rounded-full px-3 py-1.5 text-[10px] font-medium text-white" style={{ background: profile.accentColor }}>Shop the collection</button></div></div><p className="mt-3 text-[10px] leading-5 text-[#927e76]">Brand details save to the business profile. Image fields currently accept public URLs.</p><button disabled={saving || loading} className="mt-5 min-h-11 w-full rounded-full bg-[#754241] px-5 text-sm font-medium text-white transition hover:bg-[#603634] disabled:cursor-not-allowed disabled:opacity-50">{loading ? "Loading settings…" : saving ? "Saving…" : "Save changes"}</button></aside>
      </form>
    </main>
  );
}
