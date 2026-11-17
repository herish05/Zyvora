"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearStoredCustomerToken, customerApiRequest } from "../../../lib/api";

const navItems = [
  { href: "/account/orders", label: "My Orders" },
  { href: "/account/profile", label: "Profile Information" },
  { href: "/account/addresses", label: "Manage Addresses" },
  { href: "/wishlist", label: "My Wishlist" }
];

export function AccountNav() {
  const pathname = usePathname();
  const router = useRouter();

  const onSignOut = async () => {
    try {
      await customerApiRequest("/auth/signout", {
        method: "POST"
      });
    } catch {
      // Proceed with local signout even if API signout fails.
    }

    clearStoredCustomerToken();
    router.push("/signin");
  };

  return (
    <aside className="card-premium h-fit p-5 sm:p-6">
      <p className="text-xs uppercase tracking-[0.12em] text-[#7e5112]">Account</p>
      <nav className="mt-4 grid gap-2">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-4 py-2.5 text-sm ${
                active ? "bg-[#162e36] text-white" : "text-[#2f2a24] hover:bg-[#f3e9da]"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <button
        type="button"
        onClick={onSignOut}
        className="mt-7 w-full rounded-lg border border-[#e0d1bb] px-4 py-2.5 text-left text-sm text-[#5f1f1f] hover:bg-[#f7ece8]"
      >
        Sign out
      </button>
    </aside>
  );
}
