"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ensureActiveCustomerToken } from "../../lib/api";
import { hasCustomerProfileSetup } from "../../lib/mock-account";
import { AccountNav } from "./_components/account-nav";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsReady(false);

    const guardAccountRoute = async () => {
      const token = await ensureActiveCustomerToken();

      if (cancelled) {
        return;
      }

      if (!token) {
        const nextPath = encodeURIComponent(pathname || "/account/profile");
        router.replace(`/signin?next=${nextPath}`);
        return;
      }

      const profileComplete = hasCustomerProfileSetup();
      const onProfilePage = pathname?.startsWith("/account/profile");
      if (!profileComplete && !onProfilePage) {
        router.replace("/account/profile?setup=1");
        return;
      }

      setIsReady(true);
    };

    void guardAccountRoute();

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  if (!isReady) {
    return (
      <main className="mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-8">
        <p className="text-sm text-[#5f5a52]">Checking your account access...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 pb-14 pt-6 sm:px-8 lg:pt-8">
      <h1 className="text-3xl sm:text-4xl" style={{ fontFamily: "var(--font-display)" }}>My Account</h1>
      <div className="mt-7 grid gap-6 lg:grid-cols-[300px_1fr] xl:gap-8">
        <AccountNav />
        <section>{children}</section>
      </div>
    </main>
  );
}
