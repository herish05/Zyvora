import { mockProducts } from "./mock-catalog";

export type MockWishlistStorageItem = {
  slug: string;
  addedAt: string;
};

export type MockWishlistViewItem = {
  slug: string;
  name: string;
  brand: string;
  category: "shoes" | "shirts" | "jeans" | "purse";
  image: string;
  priceMinor: number;
  rating: number;
  addedAt: string;
};

export const MOCK_WISHLIST_KEY = "zyvora_mock_wishlist";
export const MOCK_WISHLIST_UPDATED_EVENT = "zyvora:mock-wishlist-updated";

export const readMockWishlistStorage = (): MockWishlistStorageItem[] => {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(MOCK_WISHLIST_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as MockWishlistStorageItem[];
    return parsed.filter((item) => Boolean(item.slug));
  } catch {
    return [];
  }
};

export const writeMockWishlistStorage = (items: MockWishlistStorageItem[]) => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(MOCK_WISHLIST_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(MOCK_WISHLIST_UPDATED_EVENT));
};

export const upsertMockWishlistItem = (slug: string) => {
  const existing = readMockWishlistStorage();
  if (existing.some((item) => item.slug === slug)) {
    return existing;
  }

  const updated = [{ slug, addedAt: new Date().toISOString() }, ...existing];
  writeMockWishlistStorage(updated);
  return updated;
};

export const hasMockWishlistItem = (slug: string) => {
  const existing = readMockWishlistStorage();
  return existing.some((item) => item.slug === slug);
};

export const removeMockWishlistItem = (slug: string) => {
  const existing = readMockWishlistStorage();
  const updated = existing.filter((item) => item.slug !== slug);
  writeMockWishlistStorage(updated);
  return updated;
};

export const toggleMockWishlistItem = (slug: string) => {
  if (hasMockWishlistItem(slug)) {
    removeMockWishlistItem(slug);
    return false;
  }

  upsertMockWishlistItem(slug);
  return true;
};

export const buildMockWishlistView = (items: MockWishlistStorageItem[]): MockWishlistViewItem[] => {
  const view: MockWishlistViewItem[] = [];

  for (const item of items) {
    const product = mockProducts.find((candidate) => candidate.slug === item.slug);
    if (!product) {
      continue;
    }

    const firstVariant = product.variants.at(0);
    view.push({
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      category: product.category,
      image: product.images[0] ?? "",
      priceMinor: firstVariant?.priceMinor ?? 0,
      rating: product.rating,
      addedAt: item.addedAt
    });
  }

  return view;
};
