"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ADMIN_SESSION_EXPIRED_EVENT, apiRequest, clearStoredAdminToken, ensureActiveAdminToken } from "../lib/api";
import {
  ChevronRight,
  CircleHelp,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Settings2,
  ShoppingBag,
  Tags,
  Users,
  X
} from "lucide-react";

const navItems = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Products", href: "/products", icon: Package },
  { label: "Categories", href: "/categories", icon: Tags },
  { label: "Orders", href: "/orders", icon: ShoppingBag },
  { label: "Customers", href: "/customers", icon: Users },
  { label: "Settings", href: "/settings", icon: Settings2 }
];

const isAuthPage = (pathname: string) => pathname === "/signin" || pathname === "/setup" || pathname.startsWith("/auth/");

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const closeMenu = () => {
      if (window.innerWidth >= 1024) setMobileMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("resize", closeMenu);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("resize", closeMenu);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  useEffect(() => setMobileMenuOpen(false), [pathname]);

  useEffect(() => {
    if (isAuthPage(pathname)) return;
    let isCurrent = true;
    ensureActiveAdminToken().then((token) => {
      if (isCurrent && !token) {
        router.replace(`/signin?next=${encodeURIComponent(pathname || "/dashboard")}`);
      }
    });
    return () => { isCurrent = false; };
  }, [pathname, router]);

  useEffect(() => {
    const onSessionExpired = () => {
      router.replace(`/signin?expired=1&next=${encodeURIComponent(pathname || "/dashboard")}`);
    };
    window.addEventListener(ADMIN_SESSION_EXPIRED_EVENT, onSessionExpired);
    return () => window.removeEventListener(ADMIN_SESSION_EXPIRED_EVENT, onSessionExpired);
  }, [pathname, router]);

  if (isAuthPage(pathname)) return <>{children}</>;

  const onSignOut = async () => {
    try {
      await apiRequest("/auth/signout", { method: "POST" });
    } catch {
      // Local sign-out still works when the API cannot revoke the refresh cookie.
    }
    clearStoredAdminToken();
    router.replace("/signin");
  };

  const nav = (mobile = false) => (
    <nav className="admin-nav" aria-label="Admin navigation">
      {navItems.map(({ label, href, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link key={href} href={href} className={`admin-nav-link ${active ? "admin-nav-link-active" : ""}`}>
            <Icon size={18} strokeWidth={1.8} />
            <span>{label}</span>
            {active && !mobile ? <ChevronRight size={15} className="ml-auto opacity-60" /> : null}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="admin-shell min-h-screen">
      <aside className="admin-sidebar hidden lg:flex">
        <Link href="/dashboard" className="admin-brand">
          <span className="admin-brand-mark">Z</span>
          <span><strong>Zyvora</strong><small>STUDIO / ADMIN</small></span>
        </Link>
        <p className="admin-nav-caption">WORKSPACE</p>
        {nav()}
        <div className="admin-sidebar-bottom">
          <div className="admin-help-card">
            <span className="admin-help-icon"><CircleHelp size={17} /></span>
            <p>Need a hand?</p>
            <span>Keep your catalog looking lovely and up to date.</span>
          </div>
          <button type="button" onClick={onSignOut} className="admin-signout"><LogOut size={17} /> Sign out</button>
          <p className="admin-sidebar-foot">ZYVORA · CONTROL CENTER</p>
        </div>
      </aside>

      <div className="admin-main min-w-0 flex-1">
        <header className="admin-topbar">
          <div className="admin-topbar-inner">
            <button type="button" onClick={() => setMobileMenuOpen(true)} className="admin-menu-button flex lg:hidden" aria-label="Open navigation"><Menu size={20} /></button>
            <div className="min-w-0">
              <p className="admin-breadcrumb">Zyvora <span>/</span> {navItems.find((item) => pathname.startsWith(item.href))?.label ?? "Workspace"}</p>
              <p className="admin-topbar-title">Good things happen when you’re organized.</p>
            </div>
            <div className="admin-topbar-right">
              <span className="admin-store-status"><span /> Admin workspace</span>
              <span className="admin-avatar" aria-label="Admin account">A</span>
            </div>
          </div>
        </header>
        <div className="admin-page-content">{children}</div>
      </div>

      <div className={`admin-mobile-backdrop ${mobileMenuOpen ? "admin-mobile-backdrop-open" : ""}`} onClick={() => setMobileMenuOpen(false)} aria-hidden={!mobileMenuOpen}>
        <aside className={`admin-mobile-drawer ${mobileMenuOpen ? "admin-mobile-drawer-open" : ""}`} onClick={(event) => event.stopPropagation()}>
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="admin-brand"><span className="admin-brand-mark">Z</span><span><strong>Zyvora</strong><small>STUDIO / ADMIN</small></span></Link>
            <button type="button" className="admin-menu-button flex" onClick={() => setMobileMenuOpen(false)} aria-label="Close navigation"><X size={19} /></button>
          </div>
          <p className="admin-nav-caption">WORKSPACE</p>
          {nav(true)}
          <button type="button" onClick={onSignOut} className="admin-signout mt-auto"><LogOut size={17} /> Sign out</button>
        </aside>
      </div>
    </div>
  );
}
