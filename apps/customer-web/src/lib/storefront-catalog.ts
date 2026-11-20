import { CUSTOMER_API_BASE } from "./api";
import type { MockProduct } from "./mock-catalog";

type PublicVariant = {
  _id: string;
  sku: string;
  title?: string;
  optionValues?: Array<{ label: string; value: string }>;
  priceMinor: number;
  compareAtMinor?: number;
  currency?: string;
  mediaUrls?: string[];
  inventory?: { available: number } | null;
};

type PublicProduct = {
  _id: string;
  slug: string;
  name: string;
  isBestSeller?: boolean;
  brand?: string;
  shortDescription?: string;
  description?: string;
  highlights?: string[];
  tags?: string[];
  categories?: Array<{ id: string; name: string; slug: string }>;
  attributeValues?: Array<{ attributeCode: string; value: string | number | boolean | string[] }>;
  variants?: PublicVariant[];
};

type ApiEnvelope<T> = { success: boolean; data: T };
type ProductListResponse = { items: PublicProduct[]; total: number; page: number; limit: number };

const readableAttributeName = (code: string) => code.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

const mapPublicProduct = (product: PublicProduct): MockProduct => {
  const category = product.categories?.[0];
  const variants = (product.variants ?? []).map((variant) => ({
    id: variant._id,
    label: variant.title || variant.optionValues?.map((option) => option.value).join(" / ") || variant.sku,
    priceMinor: variant.priceMinor,
    compareAtMinor: variant.compareAtMinor,
    currency: variant.currency || "INR",
    inStock: (variant.inventory?.available ?? 0) > 0
  }));

  return {
    id: product._id,
    slug: product.slug,
    category: category?.slug || "all",
    categoryName: category?.name,
    categorySlug: category?.slug,
    name: product.name,
    isBestSeller: product.isBestSeller,
    brand: product.brand || "Zyvora",
    shortDescription: product.shortDescription || "",
    description: product.description || "",
    images: [...new Set((product.variants ?? []).flatMap((variant) => variant.mediaUrls ?? []))],
    rating: 0,
    reviewCount: 0,
    variants,
    highlights: product.highlights ?? [],
    specifications: (product.attributeValues ?? []).map((attribute) => ({
      label: readableAttributeName(attribute.attributeCode),
      value: Array.isArray(attribute.value) ? attribute.value.join(", ") : String(attribute.value)
    })),
    reviews: [],
    similarSlugs: []
  };
};

export const getStorefrontProducts = async (): Promise<MockProduct[] | null> => {
  try {
    const response = await fetch(`${CUSTOMER_API_BASE}/public/products?limit=100`, { cache: "no-store" });
    if (!response.ok) return null;
    const envelope = await response.json() as ApiEnvelope<ProductListResponse>;
    if (!envelope.success || !envelope.data || !Array.isArray(envelope.data.items)) return null;
    return envelope.data.items.map(mapPublicProduct);
  } catch {
    return null;
  }
};

export const getStorefrontProduct = async (slug: string): Promise<MockProduct | null> => {
  try {
    const response = await fetch(`${CUSTOMER_API_BASE}/public/products/${encodeURIComponent(slug)}`, { cache: "no-store" });
    if (!response.ok) return null;
    const envelope = await response.json() as ApiEnvelope<PublicProduct>;
    return envelope.success && envelope.data ? mapPublicProduct(envelope.data) : null;
  } catch {
    return null;
  }
};
