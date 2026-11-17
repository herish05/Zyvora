"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { MOCK_CART_UPDATED_EVENT, readMockCartStorage } from "../lib/mock-cart";
import { MOCK_WISHLIST_UPDATED_EVENT, readMockWishlistStorage } from "../lib/mock-wishlist";
import { CUSTOMER_AUTH_UPDATED_EVENT, ensureActiveCustomerToken, getCustomerDisplayName } from "../lib/api";

export function CustomerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    const syncAuth = async () => {
      const token = await ensureActiveCustomerToken();
      setIsLoggedIn(Boolean(token));
      setDisplayName(getCustomerDisplayName());
    };

    const syncCounts = () => {
      const nextCartCount = readMockCartStorage().reduce((sum, item) => sum + item.quantity, 0);
      const nextWishlistCount = readMockWishlistStorage().length;
      setCartCount(nextCartCount);
      setWishlistCount(nextWishlistCount);
      void syncAuth();
    };

    const onAuthUpdated = () => {
      void syncAuth();
    };

    syncCounts();
    void syncAuth();
    window.addEventListener(MOCK_CART_UPDATED_EVENT, syncCounts);
    window.addEventListener(MOCK_WISHLIST_UPDATED_EVENT, syncCounts);
    window.addEventListener(CUSTOMER_AUTH_UPDATED_EVENT, onAuthUpdated);

    return () => {
      window.removeEventListener(MOCK_CART_UPDATED_EVENT, syncCounts);
      window.removeEventListener(MOCK_WISHLIST_UPDATED_EVENT, syncCounts);
      window.removeEventListener(CUSTOMER_AUTH_UPDATED_EVENT, onAuthUpdated);
    };
  }, []);

  const navTabClass = (active: boolean) =>
    `relative rounded-full px-6 py-2.5 text-base transition-all duration-200 ${
      active
        ? "bg-gradient-to-b from-[#fff9ee] via-[#f8ead2] to-[#efd9b7] text-[#142a31] shadow-[0_12px_26px_rgba(22,46,54,0.24),0_0_0_1px_rgba(255,255,255,0.62)_inset]"
        : "text-[#2f2a24] hover:bg-[#f3e9da]"
    }`;

  const productsActive = pathname?.startsWith("/products");
  const wishlistActive = pathname?.startsWith("/wishlist");
  const accountActive = pathname?.startsWith("/account");
  const signinActive = pathname?.startsWith("/signin");
  const cartActive = pathname?.startsWith("/cart") || pathname?.startsWith("/checkout");

  useEffect(() => {
    const syncAuthForPathChange = async () => {
      const token = await ensureActiveCustomerToken();
      setIsLoggedIn(Boolean(token));
      setDisplayName(getCustomerDisplayName());
    };

    void syncAuthForPathChange();
  }, [pathname]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 640) {
        setMobileMenuOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-[#dfd4c4] bg-[rgba(255,251,244,0.88)] backdrop-blur-lg">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-8">
          <div className="flex w-full items-center justify-between sm:hidden">
            <Link href="/" className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#162e36] text-xs font-semibold text-white">ZY</span>
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#5f5a52]">Zyvora</p>
                <p className="text-sm font-semibold">Marketplace</p>
              </div>
            </Link>

            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#d8c8b0] bg-white text-[#162e36] sm:hidden"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>

          <div className="hidden items-center sm:grid sm:grid-cols-[1fr_auto_1fr] sm:gap-4">
            <Link href="/" className="flex items-center gap-2 justify-self-start">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#162e36] text-xs font-semibold text-white">ZY</span>
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#5f5a52]">Zyvora</p>
                <p className="text-sm font-semibold">Marketplace</p>
              </div>
            </Link>

            <nav className="relative flex items-center rounded-full border border-[#d8c8b0] bg-[linear-gradient(180deg,#fffdf8_0%,#f8efdf_100%)] p-2 shadow-[0_12px_28px_rgba(46,52,56,0.14)]">
              <span className="pointer-events-none absolute inset-x-6 top-0.5 h-4 rounded-full bg-white/90 blur-[1px]" />
              <span className="pointer-events-none absolute inset-x-8 top-1 h-6 rounded-full bg-[#ffefcf]/85 blur-[7px]" />
              <span className="pointer-events-none absolute inset-x-10 -bottom-1 h-6 rounded-full bg-[#bed2d8]/35 blur-[10px]" />

              <Link href="/products" className={navTabClass(Boolean(productsActive))}>
                {productsActive ? (
                  <>
                    <span className="pointer-events-none absolute inset-x-2 top-0.5 h-2.5 rounded-full bg-white/95 blur-[0.5px]" />
                    <span className="pointer-events-none absolute inset-x-4 top-1 h-4 rounded-full bg-[#ffe3b8] blur-[4px]" />
                    <span className="pointer-events-none absolute -inset-x-1 -bottom-1.5 h-3 rounded-full bg-[#b5cfd8]/70 blur-[7px]" />
                  </>
                ) : null}
                <span className="relative">Products</span>
              </Link>
              <Link href="/wishlist" className={navTabClass(Boolean(wishlistActive))}>
                {wishlistActive ? (
                  <>
                    <span className="pointer-events-none absolute inset-x-2 top-0.5 h-2.5 rounded-full bg-white/95 blur-[0.5px]" />
                    <span className="pointer-events-none absolute inset-x-4 top-1 h-4 rounded-full bg-[#ffe3b8] blur-[4px]" />
                    <span className="pointer-events-none absolute -inset-x-1 -bottom-1.5 h-3 rounded-full bg-[#b5cfd8]/70 blur-[7px]" />
                  </>
                ) : null}
                <span className="relative inline-flex items-center gap-1.5">
                  Wishlist
                  {wishlistCount > 0 ? (
                    <span className="inline-flex h-5 min-w-[1.65rem] items-center justify-center rounded-md border border-[#d7c5ab] bg-[#f4e5cf] px-1.5 text-[11px] font-semibold leading-none text-[#6f4210]">
                      {wishlistCount}
                    </span>
                  ) : null}
                </span>
              </Link>
              {isLoggedIn ? (
                <Link href="/account/profile" className={navTabClass(Boolean(accountActive))}>
                  {accountActive ? (
                    <>
                      <span className="pointer-events-none absolute inset-x-2 top-0.5 h-2.5 rounded-full bg-white/95 blur-[0.5px]" />
                      <span className="pointer-events-none absolute inset-x-4 top-1 h-4 rounded-full bg-[#ffe3b8] blur-[4px]" />
                      <span className="pointer-events-none absolute -inset-x-1 -bottom-1.5 h-3 rounded-full bg-[#b5cfd8]/70 blur-[7px]" />
                    </>
                  ) : null}
                  <span className="relative">{displayName ? `Hi, ${displayName}` : "Account"}</span>
                </Link>
              ) : (
                <Link href="/signin" className={navTabClass(Boolean(signinActive))}>
                  {signinActive ? (
                    <>
                      <span className="pointer-events-none absolute inset-x-2 top-0.5 h-2.5 rounded-full bg-white/95 blur-[0.5px]" />
                      <span className="pointer-events-none absolute inset-x-4 top-1 h-4 rounded-full bg-[#ffe3b8] blur-[4px]" />
                      <span className="pointer-events-none absolute -inset-x-1 -bottom-1.5 h-3 rounded-full bg-[#b5cfd8]/70 blur-[7px]" />
                    </>
                  ) : null}
                  <span className="relative">Sign in</span>
                </Link>
              )}
              <Link href="/cart" className={navTabClass(Boolean(cartActive))}>
                {cartActive ? (
                  <>
                    <span className="pointer-events-none absolute inset-x-2 top-0.5 h-2.5 rounded-full bg-white/95 blur-[0.5px]" />
                    <span className="pointer-events-none absolute inset-x-4 top-1 h-4 rounded-full bg-[#ffe3b8] blur-[4px]" />
                    <span className="pointer-events-none absolute -inset-x-1 -bottom-1.5 h-3 rounded-full bg-[#b5cfd8]/70 blur-[7px]" />
                  </>
                ) : null}
                <span className="relative inline-flex items-center gap-1.5">
                  Cart
                  {cartCount > 0 ? (
                    <span className="inline-flex h-5 min-w-[1.65rem] items-center justify-center rounded-md border border-[#1e3d46] bg-[#162e36] px-1.5 text-[11px] font-semibold leading-none text-white">
                      {cartCount}
                    </span>
                  ) : null}
                </span>
              </Link>
            </nav>

            <div aria-hidden className="justify-self-end" />
          </div>

        </div>
      </header>

      <div
        className={`fixed inset-0 z-50 transition-opacity duration-200 sm:hidden ${
          mobileMenuOpen ? "pointer-events-auto bg-black/40 opacity-100" : "pointer-events-none bg-black/0 opacity-0"
        }`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden={!mobileMenuOpen}
      >
        <aside
          className={`absolute right-0 top-0 h-full w-[84%] max-w-[340px] border-l border-[#e6dccd] bg-[#fffaf2] p-4 shadow-2xl transition-transform duration-300 ${
            mobileMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold text-[#2f2a24]">Menu</p>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#d8c8b0] bg-white text-[#162e36]"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close menu"
            >
              <X size={16} />
            </button>
          </div>

          <nav className="grid gap-2">
            <Link href="/products" onClick={() => setMobileMenuOpen(false)} className="rounded-xl border border-[#e6dccd] bg-white px-4 py-3 text-sm text-[#2f2a24]">Products</Link>
            <Link href="/wishlist" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-between rounded-xl border border-[#e6dccd] bg-white px-4 py-3 text-sm text-[#2f2a24]">
              <span>Wishlist</span>
              {wishlistCount > 0 ? (
                <span className="inline-flex h-5 min-w-[1.65rem] items-center justify-center rounded-md border border-[#d7c5ab] bg-[#f4e5cf] px-1.5 text-[11px] font-semibold leading-none text-[#6f4210]">
                  {wishlistCount}
                </span>
              ) : null}
            </Link>
            {isLoggedIn ? (
              <Link href="/account/profile" onClick={() => setMobileMenuOpen(false)} className="rounded-xl border border-[#e6dccd] bg-white px-4 py-3 text-sm text-[#2f2a24]">
                {displayName ? `Hi, ${displayName}` : "Account"}
              </Link>
            ) : (
              <Link href="/signin" onClick={() => setMobileMenuOpen(false)} className="rounded-xl border border-[#e6dccd] bg-white px-4 py-3 text-sm text-[#2f2a24]">Sign in</Link>
            )}
            <Link href="/cart" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-between rounded-xl bg-[#162e36] px-4 py-3 text-sm text-white">
              <span>Cart</span>
              {cartCount > 0 ? (
                <span className="inline-flex h-5 min-w-[1.65rem] items-center justify-center rounded-md border border-[#dfe8eb] bg-white px-1.5 text-[11px] font-semibold leading-none text-[#162e36]">
                  {cartCount}
                </span>
              ) : null}
            </Link>
          </nav>
        </aside>
      </div>

      <div>{children}</div>

      <footer className="mt-16 border-t border-[#dfd4c4] bg-[#fffaf2]">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4 sm:px-8">
          <div>
            <p className="text-sm font-semibold">Zyvora</p>
            <p className="mt-2 text-sm text-[#5f5a52]">Shop fashion and lifestyle essentials with trusted reviews and premium delivery experience.</p>
          </div>
          <div>
            <p className="text-sm font-semibold">Shop</p>
            <ul className="mt-2 space-y-1 text-sm text-[#5f5a52]">
              <li><Link href="/products">All Products</Link></li>
              <li>Shoes</li>
              <li>Shirts</li>
              <li>Jeans</li>
              <li>Purse</li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold">Support</p>
            <ul className="mt-2 space-y-1 text-sm text-[#5f5a52]">
              <li>Help Center</li>
              <li>Return Policy</li>
              <li>Shipping Info</li>
              <li>Track Order</li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold">Contact</p>
            <ul className="mt-2 space-y-1 text-sm text-[#5f5a52]">
              <li>hello.zyvora1@gmail.com</li>
              <li>+91 90000 00000</li>
              <li>KushalPreet Singh</li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
