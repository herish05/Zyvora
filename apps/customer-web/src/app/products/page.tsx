"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, ChevronUp, Star } from "lucide-react";
import { mockProducts } from "../../lib/mock-catalog";
import { upsertMockCartItem } from "../../lib/mock-cart";
import { MOCK_WISHLIST_UPDATED_EVENT, readMockWishlistStorage, upsertMockWishlistItem } from "../../lib/mock-wishlist";
import { AppToast, useAppToast } from "../../components/app-toast";
import { announceCatalogCategory, readCatalogCategory } from "../../lib/catalog-navigation";

const categoryTabs = ["all", "shoes", "shirts", "jeans", "purse"] as const;

export default function ProductListingPage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-8"><p className="text-sm text-[#806c64]">Loading the collection...</p></main>}>
      <ProductListingContent />
    </Suspense>
  );
}

function ProductListingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedCategory = searchParams.get("category");
  const [activeCategory, setActiveCategory] = useState<(typeof categoryTabs)[number]>("all");
  const [searchText, setSearchText] = useState("");
  const [sortBy, setSortBy] = useState<"popular" | "price_low" | "price_high" | "rating">("popular");
  const [page, setPage] = useState(1);
  const [wishlistSlugs, setWishlistSlugs] = useState<string[]>([]);
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(0);
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);
  const [sectionOpen, setSectionOpen] = useState({
    category: true,
    brand: true,
    price: true,
    rating: true,
    stock: true
  });
  const { toast, showToast, hideToast } = useAppToast();
  const pageSize = 6;
  const [isGridLoading, setIsGridLoading] = useState(true);
  const hasHydratedRef = useRef(false);

  const priceCeiling = useMemo(() => {
    const highest = mockProducts.reduce((max, product) => {
      const productMax = product.variants.reduce((variantMax, variant) => Math.max(variantMax, variant.priceMinor), 0);
      return Math.max(max, productMax);
    }, 0);
    return highest > 0 ? highest : 100000;
  }, []);
  const [maxPriceMinor, setMaxPriceMinor] = useState(priceCeiling);

  const brands = useMemo(() => Array.from(new Set(mockProducts.map((product) => product.brand))).sort(), []);

  const minPriceBySlug = useMemo(() => {
    const map = new Map<string, number>();
    for (const product of mockProducts) {
      const min = product.variants.reduce((acc, variant) => Math.min(acc, variant.priceMinor), Number.MAX_SAFE_INTEGER);
      map.set(product.slug, min);
    }
    return map;
  }, []);

  useEffect(() => {
    const category = readCatalogCategory(requestedCategory);
    setActiveCategory(category);
    setPage(1);
    announceCatalogCategory(category);
  }, [requestedCategory]);

  const selectCategory = (category: (typeof categoryTabs)[number]) => {
    setActiveCategory(category);
    setPage(1);
    announceCatalogCategory(category);
    router.replace(category === "all" ? "/products" : `/products?category=${category}`, { scroll: false });
  };

  useEffect(() => {
    setMaxPriceMinor(priceCeiling);
  }, [priceCeiling]);

  useEffect(() => {
    const syncWishlist = () => {
      const slugs = readMockWishlistStorage().map((item) => item.slug);
      setWishlistSlugs(slugs);
    };

    syncWishlist();
    window.addEventListener(MOCK_WISHLIST_UPDATED_EVENT, syncWishlist);

    return () => {
      window.removeEventListener(MOCK_WISHLIST_UPDATED_EVENT, syncWishlist);
    };
  }, []);

  useEffect(() => {
    const initialTimer = window.setTimeout(() => {
      hasHydratedRef.current = true;
      setIsGridLoading(false);
    }, 220);

    return () => {
      window.clearTimeout(initialTimer);
    };
  }, []);

  useEffect(() => {
    if (!hasHydratedRef.current) {
      return;
    }

    setIsGridLoading(true);
    const timer = window.setTimeout(() => {
      setIsGridLoading(false);
    }, 240);

    return () => {
      window.clearTimeout(timer);
    };
  }, [activeCategory, searchText, sortBy, page, selectedBrands, minRating, onlyInStock, maxPriceMinor]);

  const filteredProducts = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    const filtered = mockProducts.filter((product) => {
      const categoryMatch = activeCategory === "all" ? true : product.category === activeCategory;
      const queryMatch = query
        ? [product.name, product.brand, product.shortDescription].join(" ").toLowerCase().includes(query)
        : true;
      const brandMatch = selectedBrands.length === 0 ? true : selectedBrands.includes(product.brand);
      const ratingMatch = product.rating >= minRating;
      const stockMatch = onlyInStock ? product.variants.some((variant) => variant.inStock) : true;
      const priceMatch = (minPriceBySlug.get(product.slug) ?? 0) <= maxPriceMinor;

      return categoryMatch && queryMatch && brandMatch && ratingMatch && stockMatch && priceMatch;
    });

    const sorted = [...filtered].sort((left, right) => {
      const leftPrice = left.variants.at(0)?.priceMinor ?? 0;
      const rightPrice = right.variants.at(0)?.priceMinor ?? 0;

      if (sortBy === "price_low") return leftPrice - rightPrice;
      if (sortBy === "price_high") return rightPrice - leftPrice;
      if (sortBy === "rating") return right.rating - left.rating;
      return right.reviewCount - left.reviewCount;
    });

    return sorted;
  }, [activeCategory, searchText, sortBy, selectedBrands, minRating, onlyInStock, maxPriceMinor, minPriceBySlug]);

  const categoryCounts = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    const counts: Record<(typeof categoryTabs)[number], number> = {
      all: 0,
      shoes: 0,
      shirts: 0,
      jeans: 0,
      purse: 0
    };

    for (const product of mockProducts) {
      const queryMatch = query
        ? [product.name, product.brand, product.shortDescription].join(" ").toLowerCase().includes(query)
        : true;
      const brandMatch = selectedBrands.length === 0 ? true : selectedBrands.includes(product.brand);
      const ratingMatch = product.rating >= minRating;
      const stockMatch = onlyInStock ? product.variants.some((variant) => variant.inStock) : true;
      const priceMatch = (minPriceBySlug.get(product.slug) ?? 0) <= maxPriceMinor;

      if (!(queryMatch && brandMatch && ratingMatch && stockMatch && priceMatch)) {
        continue;
      }

      counts.all += 1;
      counts[product.category] += 1;
    }

    return counts;
  }, [searchText, selectedBrands, minRating, onlyInStock, maxPriceMinor, minPriceBySlug]);

  const brandCounts = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    const counts = new Map<string, number>();

    for (const product of mockProducts) {
      const queryMatch = query
        ? [product.name, product.brand, product.shortDescription].join(" ").toLowerCase().includes(query)
        : true;
      const categoryMatch = activeCategory === "all" ? true : product.category === activeCategory;
      const ratingMatch = product.rating >= minRating;
      const stockMatch = onlyInStock ? product.variants.some((variant) => variant.inStock) : true;
      const priceMatch = (minPriceBySlug.get(product.slug) ?? 0) <= maxPriceMinor;

      if (!(queryMatch && categoryMatch && ratingMatch && stockMatch && priceMatch)) {
        continue;
      }

      counts.set(product.brand, (counts.get(product.brand) ?? 0) + 1);
    }

    return counts;
  }, [searchText, activeCategory, minRating, onlyInStock, maxPriceMinor, minPriceBySlug]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedProducts = filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <main className="mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-8">
      <h1 className="text-3xl sm:text-4xl" style={{ fontFamily: "var(--font-display)" }}>Discover Products</h1>

      <form className="mt-4 flex flex-col gap-2 sm:flex-row" onSubmit={(event) => event.preventDefault()}>
        <input
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          placeholder="Search shoes, shirts, jeans, purse"
          className="w-full rounded-xl border border-[#d8c8b0] bg-white px-4 py-2.5"
        />
        <button className="rounded-full bg-[#162e36] px-5 py-2.5 text-white sm:self-auto">Search</button>
      </form>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="rounded-lg border border-[#d8c8b0] bg-white px-3 py-2 text-sm lg:hidden"
          onClick={() => setShowFiltersMobile((prev) => !prev)}
        >
          {showFiltersMobile ? "Hide filters" : "Show filters"}
        </button>
        <label className="text-sm text-[#5f5a52]">Sort by</label>
        <select
          value={sortBy}
          onChange={(event) => {
            setSortBy(event.target.value as "popular" | "price_low" | "price_high" | "rating");
            setPage(1);
          }}
          className="rounded-lg border border-[#d8c8b0] bg-white px-3 py-2 text-sm"
        >
          <option value="popular">Most popular</option>
          <option value="price_low">Price: low to high</option>
          <option value="price_high">Price: high to low</option>
          <option value="rating">Top rated</option>
        </select>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {categoryTabs.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => {
              selectCategory(category);
            }}
            className={`rounded-full px-4 py-2 text-sm ${
              activeCategory === category
                ? "bg-[#162e36] text-white"
                : "border border-[#d8c8b0] bg-white text-[#5f5a52]"
            }`}
          >
            {category === "all" ? "All" : category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-[260px_1fr]">
        <aside className={`card-premium p-5 ${showFiltersMobile ? "block" : "hidden"} lg:sticky lg:top-24 lg:block lg:self-start`}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg">Filters</h2>
            <button
              type="button"
              className="text-xs underline"
              onClick={() => {
                setOnlyInStock(false);
                setSelectedBrands([]);
                setMinRating(0);
                setMaxPriceMinor(priceCeiling);
                selectCategory("all");
                setPage(1);
              }}
            >
              Clear all
            </button>
          </div>

          <div className="mt-4 space-y-4 text-sm text-[#2f2a24]">
            <div>
              <button
                type="button"
                className="mb-2 flex w-full items-center justify-between text-xs uppercase tracking-[0.08em] text-[#7e5112]"
                onClick={() => setSectionOpen((prev) => ({ ...prev, category: !prev.category }))}
              >
                <span>Category</span>
                {sectionOpen.category ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              <div className={`grid gap-1 ${sectionOpen.category ? "" : "hidden"}`}>
                {categoryTabs.map((category) => (
                  <button
                    key={`filter-${category}`}
                    type="button"
                    onClick={() => {
                      selectCategory(category);
                    }}
                    className={`rounded-lg px-2 py-1 text-left ${
                      activeCategory === category ? "bg-[#162e36] text-white" : "bg-[#fff] text-[#2f2a24]"
                    }`}
                  >
                    <span>{category === "all" ? "All categories" : category.charAt(0).toUpperCase() + category.slice(1)}</span>
                    <span className={`text-xs ${activeCategory === category ? "text-white/80" : "text-[#7e5112]"}`}>({categoryCounts[category]})</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <button
                type="button"
                className="mb-2 flex w-full items-center justify-between text-xs uppercase tracking-[0.08em] text-[#7e5112]"
                onClick={() => setSectionOpen((prev) => ({ ...prev, brand: !prev.brand }))}
              >
                <span>Brand</span>
                {sectionOpen.brand ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              <div className={`space-y-2 ${sectionOpen.brand ? "" : "hidden"}`}>
                {brands.map((brand) => {
                  const checked = selectedBrands.includes(brand);
                  const count = brandCounts.get(brand) ?? 0;
                  return (
                    <label key={brand} className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            setSelectedBrands((current) =>
                              checked ? current.filter((item) => item !== brand) : [...current, brand]
                            );
                            setPage(1);
                          }}
                        />
                        <span>{brand}</span>
                      </span>
                      <span className="text-xs text-[#7e5112]">({count})</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <button
                type="button"
                className="mb-2 flex w-full items-center justify-between text-xs uppercase tracking-[0.08em] text-[#7e5112]"
                onClick={() => setSectionOpen((prev) => ({ ...prev, price: !prev.price }))}
              >
                <span>Price</span>
                {sectionOpen.price ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              <div className={sectionOpen.price ? "" : "hidden"}>
                <input
                  type="range"
                  min={100000}
                  max={priceCeiling}
                  step={10000}
                  value={maxPriceMinor}
                  onChange={(event) => {
                    setMaxPriceMinor(Number(event.target.value));
                    setPage(1);
                  }}
                  className="w-full"
                />
                <p className="mt-1 text-xs text-[#5f5a52]">Up to ₹{(maxPriceMinor / 100).toLocaleString("en-IN")}</p>
              </div>
            </div>

            <div>
              <button
                type="button"
                className="mb-2 flex w-full items-center justify-between text-xs uppercase tracking-[0.08em] text-[#7e5112]"
                onClick={() => setSectionOpen((prev) => ({ ...prev, rating: !prev.rating }))}
              >
                <span>Rating</span>
                {sectionOpen.rating ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              <div className={sectionOpen.rating ? "" : "hidden"}>
                <select
                  value={minRating}
                  onChange={(event) => {
                    setMinRating(Number(event.target.value));
                    setPage(1);
                  }}
                  className="w-full rounded-lg border border-[#d8c8b0] bg-white px-2 py-2"
                >
                  <option value={0}>All ratings</option>
                  <option value={4}>4★ and above</option>
                  <option value={4.5}>4.5★ and above</option>
                </select>
              </div>
            </div>

            <div>
              <button
                type="button"
                className="mb-2 flex w-full items-center justify-between text-xs uppercase tracking-[0.08em] text-[#7e5112]"
                onClick={() => setSectionOpen((prev) => ({ ...prev, stock: !prev.stock }))}
              >
                <span>Availability</span>
                {sectionOpen.stock ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              <label className={`flex items-center gap-2 ${sectionOpen.stock ? "" : "hidden"}`}>
                <input
                  type="checkbox"
                  checked={onlyInStock}
                  onChange={(event) => {
                    setOnlyInStock(event.target.checked);
                    setPage(1);
                  }}
                />
                <span>In stock only</span>
              </label>
            </div>

            <p className="text-xs text-[#5f5a52]">{filteredProducts.length} products found</p>
          </div>
        </aside>
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isGridLoading
            ? Array.from({ length: pageSize }).map((_, index) => (
              <article key={`skeleton-${index}`} className="card-premium overflow-hidden">
                <div className="h-44 w-full animate-pulse bg-[#eadfce]" />
                <div className="space-y-3 p-4">
                  <div className="h-3 w-24 animate-pulse rounded bg-[#eadfce]" />
                  <div className="h-6 w-3/4 animate-pulse rounded bg-[#e4d6c0]" />
                  <div className="h-4 w-full animate-pulse rounded bg-[#eadfce]" />
                  <div className="h-4 w-5/6 animate-pulse rounded bg-[#eadfce]" />
                  <div className="mt-2 flex items-center justify-between">
                    <div className="h-5 w-20 animate-pulse rounded bg-[#e4d6c0]" />
                    <div className="h-4 w-14 animate-pulse rounded bg-[#eadfce]" />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <div className="h-7 w-24 animate-pulse rounded-full bg-[#eadfce]" />
                    <div className="h-7 w-28 animate-pulse rounded-full bg-[#eadfce]" />
                    <div className="h-7 w-28 animate-pulse rounded-full bg-[#eadfce]" />
                  </div>
                </div>
              </article>
            ))
            : pagedProducts.map((product) => {
            const baseVariant = product.variants.at(0);
            const isSaved = wishlistSlugs.includes(product.slug);
            return (
              <article key={product.id} className="card-premium glow-hover overflow-hidden">
                <Link href={`/products/${product.slug}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={product.images[0]} alt={product.name} className="h-44 w-full object-cover" />
                </Link>
                <div className="p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-[#7e5112]">{product.brand}</p>
                  <h3 className="mt-1 text-xl" style={{ fontFamily: "var(--font-display)" }}>{product.name}</h3>
                  <p className="mt-1 text-sm text-[#5f5a52] line-clamp-2">{product.shortDescription}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="font-semibold">₹{(((baseVariant?.priceMinor ?? 0) / 100)).toLocaleString("en-IN")}</p>
                    <p className="inline-flex items-center gap-1 text-sm text-[#5f5a52]"><Star size={14} /> {product.rating}</p>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Link href={`/products/${product.slug}`} className="inline-flex rounded-full border border-[#1b1b1b] px-3 py-1 text-xs">View details</Link>
                    <button
                      type="button"
                      onClick={() => {
                        if (!baseVariant?.id) return;
                        upsertMockCartItem(product.slug, baseVariant.id);
                        showToast(`${product.name} added to cart`, { tone: "success" });
                      }}
                      className="rounded-full border border-[#162e36] px-3 py-1 text-xs text-[#162e36]"
                    >
                      Quick add cart
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        upsertMockWishlistItem(product.slug);
                        showToast(isSaved ? `${product.name} already in wishlist` : `${product.name} saved to wishlist`, {
                          tone: isSaved ? "info" : "success"
                        });
                      }}
                      className={`rounded-full px-3 py-1 text-xs ${
                        isSaved ? "border border-[#c86f1b] bg-[#fff3e4] text-[#9a4f06]" : "border border-[#7e5112] text-[#7e5112]"
                      }`}
                    >
                      {isSaved ? "Saved" : "Save wishlist"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      </div>

      {!isGridLoading && pagedProducts.length === 0 ? (
        <div className="mt-5 rounded-xl border border-[#e8dfd2] bg-[#fffaf2] p-5 text-sm text-[#5f5a52]">
          No products match your filters. Try clearing filters or changing search terms.
        </div>
      ) : null}

      <div className="mt-6 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          className="rounded-full border border-[#d8c8b0] px-4 py-2 text-sm"
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <p className="text-sm text-[#5f5a52]">{currentPage} / {totalPages}</p>
        <button
          type="button"
          onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          className="rounded-full border border-[#d8c8b0] px-4 py-2 text-sm"
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>

      {toast ? <AppToast message={toast.message} tone={toast.tone} visible={toast.visible} actionLabel={toast.actionLabel} onAction={toast.onAction} onClose={hideToast} /> : null}
    </main>
  );
}
