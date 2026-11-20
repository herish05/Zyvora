"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Film, Image as ImageIcon } from "lucide-react";
import { apiRequest, getStoredAdminToken } from "../../../lib/api";
import { uploadMediaFile } from "../../../lib/media";

type ProductDetail = {
  _id: string;
  name: string;
  slug: string;
  brand?: string;
  shortDescription?: string;
  description?: string;
  seoTitle?: string;
  seoDescription?: string;
  highlights?: string[];
  tags?: string[];
  categoryIds: string[];
  attributeValues?: Array<{ attributeCode: string; value: string | number | boolean | string[] }>;
  publicationStatus: "draft" | "published" | "scheduled" | "unpublished" | "archived";
  variants: Array<{
    _id: string;
    sku: string;
    title?: string;
    priceMinor: number;
    compareAtMinor?: number;
    currency: string;
    optionValues?: Array<{ attributeCode: string; label: string; value: string }>;
    mediaUrls?: string[];
    inventory?: {
      available: number;
      lowStockThreshold: number;
    } | null;
  }>;
};

type ProductAttribute = { _id: string; name: string; code: string; dataType: string; options: string[]; appliesToCategoryIds: string[] };

const encodeAttributeValue = (attribute: ProductAttribute, input: string) => {
  if (!input.trim()) return undefined;
  if (attribute.dataType === "number" || attribute.dataType === "measurement") {
    const numeric = Number(input);
    return Number.isFinite(numeric) ? numeric : input.trim();
  }
  if (attribute.dataType === "boolean") return input === "true";
  if (attribute.dataType === "multi_select") return input.split(",").map((value) => value.trim()).filter(Boolean);
  return input.trim();
};

const parseMediaUrls = (value: string) =>
  value
    .split(/[\n,]/g)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

export default function ProductDetailPage() {
  const params = useParams();
  const productId = String(params.id ?? "");

  const [token, setToken] = useState<string | null>(null);
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [productAttributes, setProductAttributes] = useState<ProductAttribute[]>([]);
  const [attributeValues, setAttributeValues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [brand, setBrand] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [highlights, setHighlights] = useState("");
  const [tags, setTags] = useState("");

  const [sku, setSku] = useState("");
  const [optionSize, setOptionSize] = useState("");
  const [optionColor, setOptionColor] = useState("");
  const [price, setPrice] = useState("");
  const [compareAtPrice, setCompareAtPrice] = useState("");
  const [initialStock, setInitialStock] = useState(0);
  const [mediaUrlsText, setMediaUrlsText] = useState("");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [mediaDrafts, setMediaDrafts] = useState<Record<string, string>>({});
  const [mediaFileDrafts, setMediaFileDrafts] = useState<Record<string, File[]>>({});
  const [savingMediaVariant, setSavingMediaVariant] = useState<string | null>(null);

  const [adjustmentVariantId, setAdjustmentVariantId] = useState("");
  const [adjustmentDelta, setAdjustmentDelta] = useState(0);
  const [adjustmentReason, setAdjustmentReason] = useState("manual_adjustment");
  const [publicationStatus, setPublicationStatus] = useState<ProductDetail["publicationStatus"]>("draft");
  const [scheduledAt, setScheduledAt] = useState("");
  const [thresholdVariantId, setThresholdVariantId] = useState("");
  const [lowStockThreshold, setLowStockThreshold] = useState(5);

  const loadProduct = async (authToken: string) => {
    const [result, attributeResult, categoryResult] = await Promise.all([
      apiRequest<ProductDetail>(`/admin/products/${productId}`, undefined, authToken),
      apiRequest<ProductAttribute[]>("/catalog/admin/attributes", undefined, authToken),
      apiRequest<Array<{ _id: string; attributeDefinitionIds: Array<string | { _id: string }> }>>("/catalog/admin/categories", undefined, authToken)
    ]);
    setProduct(result.data);
    setMediaDrafts(Object.fromEntries(result.data.variants.map((variant) => [variant._id, (variant.mediaUrls ?? []).join("\n")])));
    setName(result.data.name);
    setSlug(result.data.slug);
    setBrand(result.data.brand ?? "");
    setShortDescription(result.data.shortDescription ?? "");
    setDescription(result.data.description ?? "");
    setSeoTitle(result.data.seoTitle ?? "");
    setSeoDescription(result.data.seoDescription ?? "");
    setHighlights((result.data.highlights ?? []).join("\n"));
    setTags((result.data.tags ?? []).join(", "));
    setPublicationStatus(result.data.publicationStatus);
    const categoryIds = result.data.categoryIds.map(String);
    const linkedAttributeIds = categoryResult.data
      .filter((category) => categoryIds.includes(category._id))
      .flatMap((category) => category.attributeDefinitionIds.map((attribute) => typeof attribute === "string" ? attribute : attribute._id));
    const relevantAttributes = attributeResult.data.filter((attribute) =>
      linkedAttributeIds.includes(attribute._id) || attribute.appliesToCategoryIds.some((id) => categoryIds.includes(id))
    );
    setProductAttributes(relevantAttributes);
    setAttributeValues(Object.fromEntries((result.data.attributeValues ?? []).map((item) => [
      item.attributeCode,
      Array.isArray(item.value) ? item.value.join(", ") : String(item.value)
    ])));

    const firstVariant = result.data.variants.at(0);
    if (firstVariant && !adjustmentVariantId) {
      setAdjustmentVariantId(firstVariant._id);
    }
    if (firstVariant && !thresholdVariantId) {
      setThresholdVariantId(firstVariant._id);
      setLowStockThreshold(firstVariant.inventory?.lowStockThreshold ?? 5);
    }
  };

  useEffect(() => {
    if (!productId) {
      setError("Invalid product id");
      return;
    }

    const storedToken = getStoredAdminToken();
    if (!storedToken) {
      setError("Admin token not found. Please sign in first.");
      return;
    }

    setToken(storedToken);
    loadProduct(storedToken).catch((loadError) => {
      setError(loadError instanceof Error ? loadError.message : "Failed to load product");
    });
  }, [productId]);

  const updateDetails = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;
    try {
      await apiRequest(`/admin/products/${productId}`, {
        method: "PUT",
        body: JSON.stringify({
          name,
          slug,
          brand: brand.trim() || undefined,
          shortDescription,
          description,
          seoTitle: seoTitle.trim() || undefined,
          seoDescription: seoDescription.trim() || undefined,
          highlights: highlights.split("\n").map((value) => value.trim()).filter(Boolean),
          tags: tags.split(",").map((value) => value.trim()).filter(Boolean),
          attributeValues: productAttributes.flatMap((attribute) => {
            const value = encodeAttributeValue(attribute, attributeValues[attribute.code] ?? "");
            return value === undefined ? [] : [{ attributeCode: attribute.code, value }];
          })
        })
      }, token);
      setError(null);
      await loadProduct(token);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Product details could not be saved.");
    }
  };

  const createVariant = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;

    const publicUrls = parseMediaUrls(mediaUrlsText);
    if (publicUrls.length + mediaFiles.length > 20) {
      setError("Add up to 20 photos or videos for each product option.");
      return;
    }

    try {
      setIsUploadingMedia(true);
      const uploadedUrls: string[] = [];
      for (const file of mediaFiles) {
        uploadedUrls.push(await uploadMediaFile(file, token));
      }

      await apiRequest(
        `/admin/products/${productId}/variants`,
        {
          method: "POST",
          body: JSON.stringify({
            sku,
            title: [optionSize && `Size ${optionSize}`, optionColor && optionColor].filter(Boolean).join(" / ") || undefined,
            optionValues: [
              ...(optionSize.trim() ? [{ attributeCode: "size", label: "Size", value: optionSize.trim() }] : []),
              ...(optionColor.trim() ? [{ attributeCode: "color", label: "Color", value: optionColor.trim() }] : [])
            ],
            priceMinor: Math.round(Number(price) * 100),
            compareAtMinor: compareAtPrice ? Math.round(Number(compareAtPrice) * 100) : undefined,
            currency: "INR",
            mediaUrls: [...publicUrls, ...uploadedUrls],
            isActive: true,
            sortOrder: 0,
            initialStock,
            lowStockThreshold: 5
          })
        },
        token
      );

      setSku("");
      setOptionSize("");
      setOptionColor("");
      setPrice("");
      setCompareAtPrice("");
      setInitialStock(0);
      setMediaUrlsText("");
      setMediaFiles([]);
      const mediaInput = document.getElementById("variant-media-files") as HTMLInputElement | null;
      if (mediaInput) mediaInput.value = "";
      await loadProduct(token);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to create variant");
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const adjustInventory = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !adjustmentVariantId) return;

    try {
      await apiRequest(
        `/admin/variants/${adjustmentVariantId}/inventory-adjustments`,
        {
          method: "POST",
          body: JSON.stringify({
            delta: adjustmentDelta,
            reason: adjustmentReason
          })
        },
        token
      );

      setAdjustmentDelta(0);
      await loadProduct(token);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Inventory adjustment failed");
    }
  };

  const updatePublication = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;

    try {
      await apiRequest(
        `/admin/products/${productId}`,
        {
          method: "PUT",
          body: JSON.stringify({
            publicationStatus,
            scheduledAt: publicationStatus === "scheduled" && scheduledAt ? new Date(scheduledAt).toISOString() : undefined
          })
        },
        token
      );

      await loadProduct(token);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Publication update failed");
    }
  };

  const saveVariantMedia = async (variantId: string) => {
    if (!token) return;
    const currentUrls = parseMediaUrls(mediaDrafts[variantId] ?? "");
    const files = mediaFileDrafts[variantId] ?? [];
    if (currentUrls.length + files.length > 20) {
      setError("Each product option can have up to 20 photos and videos.");
      return;
    }
    setError(null);
    setSavingMediaVariant(variantId);
    try {
      const uploadedUrls: string[] = [];
      for (const file of files) uploadedUrls.push(await uploadMediaFile(file, token));
      await apiRequest(`/admin/variants/${variantId}`, {
        method: "PUT",
        body: JSON.stringify({ mediaUrls: [...currentUrls, ...uploadedUrls] })
      }, token);
      setMediaFileDrafts((current) => ({ ...current, [variantId]: [] }));
      await loadProduct(token);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Product photos or videos could not be saved.");
    } finally {
      setSavingMediaVariant(null);
    }
  };

  const updateThreshold = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !thresholdVariantId) return;

    try {
      await apiRequest(
        `/admin/variants/${thresholdVariantId}/low-stock-threshold`,
        {
          method: "PUT",
          body: JSON.stringify({ lowStockThreshold })
        },
        token
      );

      await loadProduct(token);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Low stock threshold update failed");
    }
  };

  return (
    <main className="mx-auto max-w-6xl">
      <Link href="/products" className="mb-5 inline-flex items-center gap-2 text-xs font-medium text-[#8e7168] hover:text-[#754241]"><ArrowLeft size={15} /> Back to products</Link>
      <p className="admin-eyebrow">Catalog / Product workspace</p>
      <h1 className="admin-page-title mt-2">Product details</h1>

      {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}

      {product ? (
        <>
          <section className="panel mt-5 flex flex-wrap items-center justify-between gap-3 p-5 sm:p-6">
            <div><h2 className="font-display text-2xl text-[#392623]">{product.name}</h2><p className="mt-1 text-xs text-[#907a72]">/{product.slug}</p>{product.publicationStatus === "published" && (process.env.NEXT_PUBLIC_STOREFRONT_URL || process.env.NODE_ENV !== "production") ? <a href={`${(process.env.NEXT_PUBLIC_STOREFRONT_URL || "http://localhost:3000").replace(/\/$/, "")}/products/${product.slug}`} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#8e5552] hover:text-[#603634]">View in customer store <ExternalLink size={13} /></a> : product.publicationStatus === "published" ? <p className="mt-3 text-[11px] text-[#907a72]">Published and available to the customer store.</p> : <p className="mt-3 text-[11px] text-[#907a72]">This product is a draft and is not visible in the customer store yet.</p>}</div>
            <span className={`rounded-full px-3 py-1.5 text-[10px] font-semibold capitalize ${product.publicationStatus === "published" ? "bg-[#eaf2eb] text-[#50795f]" : "bg-[#f5eee4] text-[#91724c]"}`}>{product.publicationStatus}</span>
          </section>

          <section className="panel mt-5 p-5 sm:p-6">
            <p className="admin-eyebrow">Customer-facing content</p><h3 className="mt-2 font-display text-xl text-[#392623]">Product story & details</h3>
            <form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={updateDetails}>
              <label className="admin-label sm:col-span-2">Product name<input value={name} onChange={(event) => setName(event.target.value)} className="admin-field mt-1.5" required /></label>
              <label className="admin-label">Product URL slug<input value={slug} onChange={(event) => setSlug(event.target.value)} className="admin-field mt-1.5" required /></label>
              <label className="admin-label">Brand<input value={brand} onChange={(event) => setBrand(event.target.value)} className="admin-field mt-1.5" /></label>
              <label className="admin-label sm:col-span-2">Short description<input value={shortDescription} onChange={(event) => setShortDescription(event.target.value)} className="admin-field mt-1.5" maxLength={500} /></label>
              <label className="admin-label sm:col-span-2">Product story<textarea value={description} onChange={(event) => setDescription(event.target.value)} className="admin-field mt-1.5 min-h-24 resize-y" maxLength={10000} /></label>
              <label className="admin-label">Highlights<textarea value={highlights} onChange={(event) => setHighlights(event.target.value)} className="admin-field mt-1.5 min-h-24 resize-y" placeholder="One per line" /></label>
              <label className="admin-label">Search tags<textarea value={tags} onChange={(event) => setTags(event.target.value)} className="admin-field mt-1.5 min-h-24 resize-y" placeholder="Comma separated" /></label>
              {productAttributes.map((attribute) => <label key={attribute._id} className="admin-label">{attribute.name}{attribute.dataType === "boolean" ? <select value={attributeValues[attribute.code] ?? ""} onChange={(event) => setAttributeValues((current) => ({ ...current, [attribute.code]: event.target.value }))} className="admin-field mt-1.5"><option value="">Choose…</option><option value="true">Yes</option><option value="false">No</option></select> : attribute.dataType === "single_select" && attribute.options.length ? <select value={attributeValues[attribute.code] ?? ""} onChange={(event) => setAttributeValues((current) => ({ ...current, [attribute.code]: event.target.value }))} className="admin-field mt-1.5"><option value="">Choose…</option>{attribute.options.map((option) => <option key={option} value={option}>{option}</option>)}</select> : <input value={attributeValues[attribute.code] ?? ""} onChange={(event) => setAttributeValues((current) => ({ ...current, [attribute.code]: event.target.value }))} type={attribute.dataType === "number" ? "number" : "text"} placeholder={attribute.dataType === "multi_select" ? "Comma-separated values" : attribute.name} className="admin-field mt-1.5" />}</label>)}
              <div className="sm:col-span-2 border-t border-[#f0e7e2] pt-4"><p className="admin-eyebrow">Search result preview details</p></div>
              <label className="admin-label sm:col-span-2">Search title<input value={seoTitle} onChange={(event) => setSeoTitle(event.target.value)} className="admin-field mt-1.5" maxLength={160} /></label>
              <label className="admin-label sm:col-span-2">Search description<textarea value={seoDescription} onChange={(event) => setSeoDescription(event.target.value)} className="admin-field mt-1.5 min-h-16 resize-y" maxLength={320} /></label>
              <button className="min-h-10 rounded-full bg-[#754241] px-4 text-xs font-medium text-white sm:col-span-2">Save customer-facing details</button>
            </form>
          </section>

          <section className="panel mt-5 p-5 sm:p-6">
            <p className="admin-eyebrow">Visibility</p><h3 className="mt-2 font-display text-xl text-[#392623]">Publication settings</h3>
            <form className="mt-4 grid gap-3 sm:grid-cols-3" onSubmit={updatePublication}>
              <select
                value={publicationStatus}
                onChange={(event) => setPublicationStatus(event.target.value as ProductDetail["publicationStatus"])}
                className="admin-field"
              >
                {["draft", "published", "scheduled", "unpublished", "archived"].map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(event) => setScheduledAt(event.target.value)}
                className="admin-field"
              />
              <button className="min-h-10 rounded-full bg-[#754241] px-4 text-xs font-medium text-white">Save publication</button>
            </form>
          </section>

          <section className="panel mt-5 p-5 sm:p-6">
            <p className="admin-eyebrow">Options & pricing</p><h3 className="mt-2 font-display text-xl text-[#392623]">Add a variant</h3>
            <form className="mt-4 grid gap-3 sm:grid-cols-3" onSubmit={createVariant}>
              <input
                value={sku}
                onChange={(event) => setSku(event.target.value.toUpperCase())}
                placeholder="Variant SKU"
                className="admin-field"
                required
              />
              <input
                value={optionSize}
                onChange={(event) => setOptionSize(event.target.value)}
                placeholder="Size (e.g. M / UK 6)"
                className="admin-field"
              />
              <input
                value={optionColor}
                onChange={(event) => setOptionColor(event.target.value)}
                placeholder="Color (optional)"
                className="admin-field"
              />
              <input
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                placeholder="Selling price (₹)"
                type="number"
                min={0}
                step="0.01"
                className="admin-field"
                required
              />
              <input
                value={compareAtPrice}
                onChange={(event) => setCompareAtPrice(event.target.value)}
                placeholder="Original price (optional)"
                type="number"
                min={0}
                step="0.01"
                className="admin-field"
              />
              <input
                value={initialStock}
                onChange={(event) => setInitialStock(Number(event.target.value))}
                placeholder="Initial stock"
                type="number"
                min={0}
                className="admin-field"
                required
              />
              <textarea
                value={mediaUrlsText}
                onChange={(event) => setMediaUrlsText(event.target.value)}
                placeholder="Public image or video URLs, one per line"
                className="admin-field sm:col-span-3"
                rows={4}
              />
              <label className="admin-label sm:col-span-3">Upload photos or videos
                <input
                  id="variant-media-files"
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={(event) => {
                    const files = Array.from(event.target.files ?? []);
                    const invalid = files.find((file) => {
                      if (file.type.startsWith("image/")) return file.size > 15 * 1024 * 1024;
                      if (file.type.startsWith("video/")) return file.size > 100 * 1024 * 1024;
                      return true;
                    });
                    if (invalid) {
                      setError(`${invalid.name}: choose an image up to 15 MB or a video up to 100 MB.`);
                      event.target.value = "";
                      setMediaFiles([]);
                      return;
                    }
                    setError(null);
                    setMediaFiles(files);
                  }}
                  className="admin-field mt-1.5 file:mr-3 file:rounded-full file:border-0 file:bg-[#f7ece7] file:px-3 file:py-2 file:text-xs file:font-medium file:text-[#754241]"
                />
              </label>
              {mediaFiles.length ? <p className="text-[10px] leading-5 text-[#927e76] sm:col-span-3">Selected: {mediaFiles.map((file) => file.name).join(", ")}</p> : null}
              <p className="text-[10px] leading-5 text-[#927e76] sm:col-span-3">Add size and color combinations as separate options with their own price and stock. Media uploads are stored in Cloudinary. You can also paste existing public URLs above.</p>
              <button disabled={isUploadingMedia} className="min-h-10 rounded-full bg-[#754241] px-4 text-xs font-medium text-white sm:col-span-3 disabled:opacity-60">{isUploadingMedia ? "Uploading and saving…" : "Create option & save stock"}</button>
            </form>
          </section>

          <section className="panel mt-5 p-5 sm:p-6">
            <div className="flex items-center gap-2"><ImageIcon size={17} className="text-[#9c5e5d]" /><h3 className="font-display text-xl text-[#392623]">Variants & media</h3></div>
            <div className="mt-3 space-y-3 text-sm">
              {product.variants.map((variant) => (
                <article key={variant._id} className="rounded-xl border border-[#f0e7e2] p-4">
                  <p className="text-sm font-semibold text-[#493530]">{variant.title || variant.optionValues?.map((option) => `${option.label}: ${option.value}`).join(" · ") || variant.sku}</p>
                  <p className="mt-1 text-[10px] text-[#907a72]">SKU: {variant.sku}</p>
                  <p className="mt-1 text-xs text-[#907a72]">Price: {(variant.priceMinor / 100).toLocaleString("en-IN", { style: "currency", currency: variant.currency || "INR" })}</p>
                  <p className="mt-1 text-xs text-[#907a72]">
                    Stock: {variant.inventory?.available ?? 0} • Low stock threshold: {variant.inventory?.lowStockThreshold ?? 0}
                  </p>
                  <p className="mt-1 text-xs text-[#907a72]">Media assets: {variant.mediaUrls?.length ?? 0}</p>
                  {variant.mediaUrls?.length ? <div className="mt-3 flex flex-wrap gap-2">{variant.mediaUrls.map((url) => /\.(mp4|webm|mov)(\?.*)?$/i.test(url) ? <a key={url} href={url} target="_blank" rel="noreferrer" className="flex h-16 w-24 items-center justify-center gap-1 rounded-lg bg-[#f4e9e4] text-[10px] font-medium text-[#754241]"><Film size={15} /> View video <ExternalLink size={11} /></a> : <a key={url} href={url} target="_blank" rel="noreferrer" className="h-16 w-24 overflow-hidden rounded-lg bg-[#f4e9e4]" title="Open media"><img src={url} alt="Product media" className="h-full w-full object-cover" /></a>)}</div> : null}
                  <div className="mt-4 grid gap-2 border-t border-[#f0e7e2] pt-4">
                    <label className="admin-label">Edit media URLs<textarea value={mediaDrafts[variant._id] ?? ""} onChange={(event) => setMediaDrafts((current) => ({ ...current, [variant._id]: event.target.value }))} className="admin-field mt-1.5 min-h-16 resize-y" placeholder="One public photo or video URL per line" /></label>
                    <label className="admin-label">Add photos or videos<input type="file" accept="image/*,video/*" multiple onChange={(event) => { const files = Array.from(event.target.files ?? []); const invalid = files.find((file) => file.type.startsWith("image/") ? file.size > 15 * 1024 * 1024 : !file.type.startsWith("video/") || file.size > 100 * 1024 * 1024); if (invalid) { setError(`${invalid.name}: choose an image up to 15 MB or a video up to 100 MB.`); event.target.value = ""; return; } setError(null); setMediaFileDrafts((current) => ({ ...current, [variant._id]: files })); }} className="admin-field mt-1.5 file:mr-2 file:rounded-full file:border-0 file:bg-[#f7ece7] file:px-3 file:py-2 file:text-xs file:font-medium file:text-[#754241]" /></label>
                    {(mediaFileDrafts[variant._id] ?? []).length ? <p className="text-[10px] text-[#907a72]">Selected: {(mediaFileDrafts[variant._id] ?? []).map((file) => file.name).join(", ")}</p> : null}
                    <button type="button" onClick={() => saveVariantMedia(variant._id)} disabled={savingMediaVariant === variant._id} className="min-h-9 rounded-full border border-[#e6d5cd] px-4 text-xs font-medium text-[#754241] disabled:opacity-60">{savingMediaVariant === variant._id ? "Uploading and saving…" : "Save media"}</button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="panel mt-5 p-5 sm:p-6">
            <p className="admin-eyebrow">Stock control</p><h3 className="mt-2 font-display text-xl text-[#392623]">Adjust inventory</h3>
            <form className="mt-4 grid gap-3 sm:grid-cols-3" onSubmit={adjustInventory}>
              <select
                value={adjustmentVariantId}
                onChange={(event) => setAdjustmentVariantId(event.target.value)}
                className="admin-field"
                required
              >
                {product.variants.map((variant) => (
                  <option key={variant._id} value={variant._id}>{variant.sku}</option>
                ))}
              </select>
              <input
                value={adjustmentDelta}
                onChange={(event) => setAdjustmentDelta(Number(event.target.value))}
                type="number"
                placeholder="Delta (+/-)"
                className="admin-field"
                required
              />
              <input
                value={adjustmentReason}
                onChange={(event) => setAdjustmentReason(event.target.value)}
                placeholder="Reason"
                className="admin-field"
                required
              />
              <button className="min-h-10 rounded-full bg-[#754241] px-4 text-xs font-medium text-white sm:col-span-3">Apply adjustment</button>
            </form>
          </section>

          <section className="panel mt-5 p-5 sm:p-6">
            <p className="admin-eyebrow">Inventory alert</p><h3 className="mt-2 font-display text-xl text-[#392623]">Low stock threshold</h3>
            <form className="mt-4 grid gap-3 sm:grid-cols-3" onSubmit={updateThreshold}>
              <select
                value={thresholdVariantId}
                onChange={(event) => {
                  const variantId = event.target.value;
                  setThresholdVariantId(variantId);
                  const variant = product.variants.find((item) => item._id === variantId);
                  setLowStockThreshold(variant?.inventory?.lowStockThreshold ?? 5);
                }}
                className="admin-field"
                required
              >
                {product.variants.map((variant) => (
                  <option key={variant._id} value={variant._id}>{variant.sku}</option>
                ))}
              </select>
              <input
                value={lowStockThreshold}
                onChange={(event) => setLowStockThreshold(Number(event.target.value))}
                type="number"
                min={0}
                className="admin-field"
                required
              />
              <button className="min-h-10 rounded-full bg-[#754241] px-4 text-xs font-medium text-white">Save threshold</button>
            </form>
          </section>
        </>
      ) : (
        <p className="mt-6 text-sm text-[#5b6470]">Loading product...</p>
      )}
    </main>
  );
}
