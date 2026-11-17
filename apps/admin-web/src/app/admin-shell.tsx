"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

const navItems: Array<{ label: string; href: string; short: string }> = [
  { label: "Dashboard", href: "/dashboard", short: "DB" },
  { label: "Categories", href: "/categories", short: "CT" },
  { label: "Products", href: "/products", short: "PR" },
  { label: "Orders", href: "/orders", short: "OR" },
  { label: "Customers", href: "/customers", short: "CU" },
  { label: "Settings", href: "/settings", short: "ST" }
];

const isAuthPage = (pathname: string) =>
  pathname === "/signin" || pathname.startsWith("/auth/");

const workflowPathToStep = (pathname: string) => {
  if (pathname.startsWith("/categories")) return 1;
  if (pathname.startsWith("/products/new")) return 2;
  if (pathname.startsWith("/products")) return 3;
  if (pathname.startsWith("/orders")) return 4;
  return 1;
};

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  if (isAuthPage(pathname)) {
    return <>{children}</>;
  }

  const currentStep = useMemo(() => workflowPathToStep(pathname), [pathname]);
  const progressPercent = Math.round((currentStep / 4) * 100);

  const onSignOut = () => {
    window.localStorage.removeItem("zyvora_admin_access_token");
    window.localStorage.removeItem("zyvora_access_token");
    router.push("/signin");
  };

  return (
    <div className="admin-shell min-h-screen">
      <aside className={`admin-sidebar hidden md:flex ${collapsed ? "admin-sidebar-collapsed" : ""}`}>
        <div className="flex items-start justify-between gap-2">
          <p className="admin-sidebar-kicker">Zyvora</p>
          <button
            type="button"
            className="admin-collapse-btn"
            onClick={() => setCollapsed((prev) => !prev)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? ">" : "<"}
          </button>
        </div>
        <h1 className={`admin-sidebar-title ${collapsed ? "hidden" : ""}`} style={{ fontFamily: "var(--font-display)" }}>
          Control Center
        </h1>

        <nav className="mt-8 flex flex-col gap-2">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`admin-nav-item ${active ? "admin-nav-item-active" : ""}`}
                title={item.label}
              >
                <span className="admin-nav-icon">{item.short}</span>
                {!collapsed ? <span>{item.label}</span> : null}
              </Link>
            );
          })}
        </nav>

        <div className={`mt-6 rounded-xl border border-[#dce2e8] bg-white/70 p-3 ${collapsed ? "hidden" : ""}`}>
          <p className="text-[11px] uppercase tracking-[0.15em] text-[#5b6470]">Workflow Progress</p>
          <p className="mt-1 text-sm font-medium text-[#0f172a]">Step {currentStep} of 4</p>
          <div className="mt-2 h-2 rounded-full bg-[#ebeff2]">
            <div className="h-2 rounded-full bg-[#1f3a33]" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        <div className="mt-auto">
          <button className="admin-signout-btn" onClick={onSignOut} type="button">
            {collapsed ? "SO" : "Sign out"}
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="admin-topbar md:hidden">
          <div className="flex items-center justify-between gap-2">
            <div>
            <p className="text-[10px] uppercase tracking-[0.16em] text-[#5b6470]">Zyvora</p>
            <p className="text-base font-semibold">Control Center</p>
            </div>
            <button className="admin-signout-btn w-auto px-3 py-1.5" onClick={onSignOut} type="button">Sign out</button>
          </div>
        </header>

        <nav className="admin-mobile-nav w-full md:hidden">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`admin-mobile-nav-item ${active ? "admin-mobile-nav-item-active" : ""}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div>{children}</div>
      </div>
    </div>
  );
}