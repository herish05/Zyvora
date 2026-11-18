"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Heart, Menu, Search, ShoppingBag, UserRound, X } from "lucide-react";
import { MOCK_CART_UPDATED_EVENT, readMockCartStorage } from "../lib/mock-cart";
import { MOCK_WISHLIST_UPDATED_EVENT, readMockWishlistStorage } from "../lib/mock-wishlist";
import { CUSTOMER_AUTH_UPDATED_EVENT, ensureActiveCustomerToken, getCustomerDisplayName } from "../lib/api";
import { CATALOG_CATEGORY_CHANGED_EVENT, CatalogCategory, readCatalogCategory } from "../lib/catalog-navigation";

export function CustomerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<CatalogCategory>("all");

  useEffect(() => {
    const syncAuth = async () => {
      const token = await ensureActiveCustomerToken();
      setIsLoggedIn(Boolean(token));
      setDisplayName(getCustomerDisplayName());
    };
    const syncCounts = () => {
      setCartCount(readMockCartStorage().reduce((sum, item) => sum + item.quantity, 0));
      setWishlistCount(readMockWishlistStorage().length);
    };
    syncCounts();
    void syncAuth();
    window.addEventListener(MOCK_CART_UPDATED_EVENT, syncCounts);
    window.addEventListener(MOCK_WISHLIST_UPDATED_EVENT, syncCounts);
    window.addEventListener(CUSTOMER_AUTH_UPDATED_EVENT, syncAuth);
    return () => {
      window.removeEventListener(MOCK_CART_UPDATED_EVENT, syncCounts);
      window.removeEventListener(MOCK_WISHLIST_UPDATED_EVENT, syncCounts);
      window.removeEventListener(CUSTOMER_AUTH_UPDATED_EVENT, syncAuth);
    };
  }, []);

  useEffect(() => {
    void ensureActiveCustomerToken().then((token) => {
      setIsLoggedIn(Boolean(token));
      setDisplayName(getCustomerDisplayName());
    });
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    const closeOnDesktop = () => {
      if (window.innerWidth >= 1024) setMobileMenuOpen(false);
    };
    closeOnDesktop();
    window.addEventListener("resize", closeOnDesktop);
    return () => window.removeEventListener("resize", closeOnDesktop);
  }, [pathname]);

  useEffect(() => {
    const syncCategory = () => setActiveCategory(readCatalogCategory(new URLSearchParams(window.location.search).get("category")));
    const onCategoryChanged = (event: Event) => {
      setActiveCategory((event as CustomEvent<CatalogCategory>).detail);
      setMobileMenuOpen(false);
    };
    syncCategory();
    window.addEventListener("popstate", syncCategory);
    window.addEventListener(CATALOG_CATEGORY_CHANGED_EVENT, onCategoryChanged);
    return () => {
      window.removeEventListener("popstate", syncCategory);
      window.removeEventListener(CATALOG_CATEGORY_CHANGED_EVENT, onCategoryChanged);
    };
  }, [pathname]);

  const active = (prefix: string) => pathname?.startsWith(prefix);
  const activeCatalogLink = (category: CatalogCategory) => Boolean(active("/products") && activeCategory === category);
  const selectCatalogCategory = (category: CatalogCategory) => {
    setActiveCategory(category);
    setMobileMenuOpen(false);
  };
  const accountHref = isLoggedIn ? "/account/profile" : "/signin";
  const accountLabel = isLoggedIn ? (displayName ? `Hi, ${displayName}` : "Account") : "Sign in";

  return (
    <div className="min-h-screen">
      <div className="announcement-bar flex min-h-8 items-center justify-center px-4 text-center text-[9px] font-medium uppercase tracking-[0.19em] sm:text-[10px]">
        A little treat from us — complimentary shipping on orders over ₹1,999
      </div>
      <header className="sticky top-0 z-40 border-b border-[#eaded7] bg-[#fcf8f4]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[68px] max-w-[1440px] items-center justify-between px-4 sm:h-[82px] sm:px-8 lg:px-12">
          <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full text-[#493530] transition hover:bg-[#f1e5de] lg:hidden" onClick={() => setMobileMenuOpen(true)} aria-label="Open menu"><Menu size={21} /></button>

          <Link href="/" className="flex items-center gap-2.5 sm:gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#9c5e5d] font-display text-[17px] italic text-white sm:h-10 sm:w-10 sm:text-lg">Z</span>
            <span><span className="block font-display text-[23px] leading-none tracking-[0.08em] text-[#392623] sm:text-[26px]">ZYVORA</span><span className="mt-1 hidden text-[8px] uppercase tracking-[0.25em] text-[#9c7770] sm:block">Find your kind of beautiful</span></span>
          </Link>

          <nav className="hidden h-full items-center gap-8 lg:flex lg:gap-7 xl:gap-10" aria-label="Main navigation">
            <Link href="/products" onClick={() => selectCatalogCategory("all")} className={`nav-link flex ${activeCatalogLink("all") ? "nav-link-active" : ""}`}>Shop all</Link>
            <Link href="/products?category=purse" onClick={() => selectCatalogCategory("purse")} className={`nav-link flex ${activeCatalogLink("purse") ? "nav-link-active" : ""}`}>Bags</Link>
            <Link href="/products?category=shoes" onClick={() => selectCatalogCategory("shoes")} className={`nav-link flex ${activeCatalogLink("shoes") ? "nav-link-active" : ""}`}>Shoes</Link>
            <Link href="/products?category=shirts" onClick={() => selectCatalogCategory("shirts")} className={`nav-link flex ${activeCatalogLink("shirts") ? "nav-link-active" : ""}`}>Clothing</Link>
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <Link href="/products" aria-label="Search products" className="header-action hidden lg:flex"><Search size={19} strokeWidth={1.6} /></Link>
            <Link href={accountHref} aria-label={accountLabel} className={`header-action hidden lg:flex ${active("/account") || active("/signin") ? "header-action-active" : ""}`}><UserRound size={19} strokeWidth={1.6} /></Link>
            <Link href="/wishlist" aria-label={`Wishlist${wishlistCount ? `, ${wishlistCount} items` : ""}`} className={`header-action relative flex ${active("/wishlist") ? "header-action-active" : ""}`}><Heart size={20} strokeWidth={1.6} />{wishlistCount > 0 && <span className="count-dot">{wishlistCount}</span>}</Link>
            <Link href="/cart" aria-label={`Shopping bag${cartCount ? `, ${cartCount} items` : ""}`} className={`header-action relative flex ${active("/cart") || active("/checkout") ? "header-action-active" : ""}`}><ShoppingBag size={20} strokeWidth={1.6} />{cartCount > 0 && <span className="count-dot">{cartCount}</span>}</Link>
          </div>
        </div>
      </header>

      <div className={`mobile-menu-backdrop ${mobileMenuOpen ? "mobile-menu-visible" : ""}`} onClick={() => setMobileMenuOpen(false)} aria-hidden={!mobileMenuOpen}>
        <aside className={`mobile-menu-panel ${mobileMenuOpen ? "mobile-menu-open" : ""}`} onClick={(event) => event.stopPropagation()}>
          <div className="mb-7 flex items-center justify-between"><Link href="/" className="font-display text-2xl tracking-[0.08em] text-[#392623]">ZYVORA</Link><button type="button" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f3e8e1] text-[#493530]"><X size={19} /></button></div>
          <p className="mb-3 text-[9px] font-semibold uppercase tracking-[0.23em] text-[#a45f61]">Find your next favourite</p>
          <nav className="grid" aria-label="Mobile navigation">
            {[["Shop all", "/products"], ["Bags", "/products?category=purse"], ["Shoes", "/products?category=shoes"], ["Clothing", "/products?category=shirts"], ["Wishlist", "/wishlist"], [accountLabel, accountHref], ["Shopping bag", "/cart"]].map(([label, href]) => <Link key={label} href={href} className="mobile-menu-link">{label}{label === "Wishlist" && wishlistCount > 0 ? <span className="menu-count">{wishlistCount}</span> : null}{label === "Shopping bag" && cartCount > 0 ? <span className="menu-count">{cartCount}</span> : null}</Link>)}
          </nav>
          <div className="mt-8 rounded-2xl bg-[#f3e5dd] p-5"><p className="font-display text-2xl text-[#513a35]">A little more you.</p><p className="mt-2 text-xs leading-5 text-[#806a62]">Pieces to make getting dressed feel lovely.</p></div>
        </aside>
      </div>

      <div>{children}</div>

      <footer className="site-footer mt-16">
        <div className="mx-auto max-w-[1280px] px-5 py-12 sm:px-8 sm:py-16 lg:px-10">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.2fr]">
            <div><Link href="/" className="font-display text-3xl tracking-[0.1em] text-[#f9eee7]">ZYVORA</Link><p className="mt-3 max-w-xs text-sm leading-6 text-[#c6aaa1]">A thoughtful edit of bags, shoes and clothes to make everyday dressing feel a little more like you.</p><p className="mt-6 text-[9px] uppercase tracking-[0.2em] text-[#bd988e]">Made for your kind of beautiful</p></div>
            <div><p className="footer-heading">Explore</p><ul className="footer-links"><li><Link href="/products">Shop all</Link></li><li><Link href="/products?category=purse">Bags & purses</Link></li><li><Link href="/products?category=shoes">Shoes</Link></li><li><Link href="/products?category=shirts">Clothing</Link></li></ul></div>
            <div><p className="footer-heading">Your Zyvora</p><ul className="footer-links"><li><Link href="/account/orders">Order history</Link></li><li><Link href="/account/profile">My account</Link></li><li><Link href="/wishlist">Wishlist</Link></li><li><Link href="/cart">Shopping bag</Link></li></ul></div>
            <div><p className="footer-heading">Here to help</p><ul className="footer-links"><li><a href="mailto:hello.zyvora1@gmail.com">hello.zyvora1@gmail.com</a></li><li><span>Easy returns, no fuss</span></li><li><span>Thoughtful delivery</span></li></ul></div>
          </div>
          <div className="mt-10 flex flex-col gap-2 border-t border-white/10 pt-5 text-[10px] text-[#b89c93] sm:flex-row sm:items-center sm:justify-between"><span>© {new Date().getFullYear()} Zyvora. Made with a little love.</span><span>Designed for the way you live.</span></div>
        </div>
      </footer>
    </div>
  );
}
