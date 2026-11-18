export type CatalogCategory = "all" | "shoes" | "shirts" | "jeans" | "purse";

export const CATALOG_CATEGORY_CHANGED_EVENT = "zyvora:catalog-category-changed";

export const readCatalogCategory = (value: string | null): CatalogCategory =>
  value === "shoes" || value === "shirts" || value === "jeans" || value === "purse" ? value : "all";

export const announceCatalogCategory = (category: CatalogCategory) => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent<CatalogCategory>(CATALOG_CATEGORY_CHANGED_EVENT, { detail: category }));
  }
};
