import { mockProducts } from "./mock-catalog";

export type MockCartStorageItem = {
  slug: string;
  variantId: string;
  quantity: number;
};

export type MockCartViewItem = {
  key: string;
  slug: string;
  productName: string;
  variantLabel: string;
  image: string;
  currency: string;
  unitPriceMinor: number;
  lineSubtotalMinor: number;
  quantity: number;
  inStock: boolean;
};

export type MockCartTotals = {
  currency: string;
  subtotalMinor: number;
  shippingMinor: number;
  taxMinor: number;
  grandTotalMinor: number;
};

export const MOCK_CART_KEY = "zyvora_mock_cart";
export const MOCK_CART_UPDATED_EVENT = "zyvora:mock-cart-updated";

export const readMockCartStorage = (): MockCartStorageItem[] => {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(MOCK_CART_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as MockCartStorageItem[];
    return parsed.filter((item) => item.quantity > 0);
  } catch {
    return [];
  }
};

export const writeMockCartStorage = (items: MockCartStorageItem[]) => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(MOCK_CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(MOCK_CART_UPDATED_EVENT));
};

export const upsertMockCartItem = (slug: string, variantId: string, quantity = 1) => {
  const existing = readMockCartStorage();
  const matched = existing.find((item) => item.slug === slug && item.variantId === variantId);

  if (matched) {
    matched.quantity += quantity;
  } else {
    existing.push({ slug, variantId, quantity: Math.max(1, quantity) });
  }

  writeMockCartStorage(existing);
  return existing;
};

export const buildMockCartView = (items: MockCartStorageItem[]): { items: MockCartViewItem[]; totals: MockCartTotals } => {
  const enrichedItems: MockCartViewItem[] = items
    .map((item) => {
      const product = mockProducts.find((candidate) => candidate.slug === item.slug);
      if (!product) return null;

      const variant = product.variants.find((candidate) => candidate.id === item.variantId);
      if (!variant) return null;

      const unitPriceMinor = variant.priceMinor;
      const lineSubtotalMinor = unitPriceMinor * item.quantity;

      return {
        key: `${item.slug}:${item.variantId}`,
        slug: item.slug,
        productName: product.name,
        variantLabel: variant.label,
        image: product.images[0] ?? "",
        currency: variant.currency ?? "INR",
        unitPriceMinor,
        lineSubtotalMinor,
        quantity: item.quantity,
        inStock: variant.inStock
      };
    })
    .filter((item): item is MockCartViewItem => Boolean(item));

  const subtotalMinor = enrichedItems.reduce((sum, item) => sum + item.lineSubtotalMinor, 0);
  const shippingMinor = subtotalMinor > 0 ? 49900 : 0;
  const taxMinor = Math.round(subtotalMinor * 0.18);

  return {
    items: enrichedItems,
    totals: {
      currency: "INR",
      subtotalMinor,
      shippingMinor,
      taxMinor,
      grandTotalMinor: subtotalMinor + shippingMinor + taxMinor
    }
  };
};
