"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ImagePlus, Plus, Trash2, UploadCloud } from "lucide-react";
import { apiRequest, getStoredAdminToken } from "../../../lib/api";
import { uploadMediaFile } from "../../../lib/media";

type CategoryItem = { _id: string; name: string; parentCategoryId?: string; isVisible: boolean };
type AttributeItem = { _id: string; name: string; code: string; dataType: string; options: string[]; appliesToCategoryIds: string[] };
type VariantRow = { key: number; label: string; size: string; color: string; sku: string; price: string; compareAtPrice: string; stock: string };

const newVariant = (key: number): VariantRow => ({ key, label: "", size: "", color: "", sku: "", price: "", compareAtPrice: "", stock: "0" });

const toAttributeValue = (attribute: AttributeItem, input: string) => {
  if (!input.trim()) return undefined;
  if (attribute.dataType === "number" || attribute.dataType === "measurement") {
    const numeric = Number(input);
    return Number.isFinite(numeric) ? numeric : input.trim();
  }
  if (attribute.dataType === "boolean") return input === "true";
  if (attribute.dataType === "multi_select") return input.split(",").map((item) => item.trim()).filter(Boolean);
  return input.trim();
};

const fileSize = (bytes: number) => bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`;
const makeSkuCode = (value: string) => value.toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24) || "PRODUCT";

export default function ProductCreatePage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [attributes, setAttributes] = useState<AttributeItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [partialProductId, setPartialProductId] = useState<string | null>(null);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [progress, setProgress] = useState("");
  const [name, setName] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [brand, setBrand] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [highlights, setHighlights] = useState("");
  const [tags, setTags] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [attributeValues, setAttributeValues] = useState<Record<string, string>>({});
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [variants, setVariants] = useState<VariantRow[]>([newVariant(1)]);
  const [publicationStatus, setPublicationStatus] = useState<"draft" | "published">("published");

  useEffect(() => {
    const storedToken = getStoredAdminToken();
    if (!storedToken) {
      setError("Your admin session is missing. Sign in again to create products.");
      setIsLoadingOptions(false);
      return;
    }
    setToken(storedToken);
    Promise.all([
      apiRequest<CategoryItem[]>("/catalog/admin/categories", undefined, storedToken),
      apiRequest<AttributeItem[]>("/catalog/admin/attributes", undefined, storedToken)
    ])
      .then(([categoryResult, attributeResult]) => {
        setCategories(categoryResult.data);
        setSelectedCategoryId(categoryResult.data.find((category) => category.isVisible)?._id ?? "");
        setAttributes(attributeResult.data);
      })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Product setup options could not be loaded."))
      .finally(() => setIsLoadingOptions(false));
  }, []);

  const productAttributes = useMemo(() => attributes.filter((attribute) =>
    attribute.appliesToCategoryIds.length === 0 || attribute.appliesToCategoryIds.includes(selectedCategoryId)
  ), [attributes, selectedCategoryId]);
  const visibleCategories = categories.filter((category) => category.isVisible);

  const updateVariant = (key: number, field: keyof Omit<VariantRow, "key">, value: string) => {
    setVariants((current) => current.map((variant) => variant.key === key ? { ...variant, [field]: value } : variant));
  };

  const chooseMedia = (files: File[]) => {
    const availableSlots = Math.max(0, 20 - mediaFiles.length);
    const selected = files.slice(0, availableSlots);
    const invalid = selected.find((file) => {
      if (file.type.startsWith("image/")) return file.size > 15 * 1024 * 1024;
      if (file.type.startsWith("video/")) return file.size > 100 * 1024 * 1024;
      return true;
    });
    if (invalid) {
      setError(`${invalid.name}: choose an image up to 15 MB or a video up to 100 MB.`);
      return;
    }
    setError(null);
    setMediaFiles((current) => [...current, ...selected]);
  };

  const createProduct = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;
    if (!variants.length) {
      setError("Add at least one sellable option with a price and stock quantity.");
      return;
    }
    if (!mediaFiles.some((file) => file.type.startsWith("image/"))) {
      setError("Add at least one product photo so customers can see the item. You can add a video too.");
      return;
    }
    const invalidVariant = variants.find((variant) => {
      const price = Number(variant.price);
      const compare = variant.compareAtPrice ? Number(variant.compareAtPrice) : undefined;
      return !Number.isFinite(price) || price < 0 || !Number.isInteger(Number(variant.stock)) || Number(variant.stock) < 0 || (compare !== undefined && compare < price);
    });
    if (invalidVariant) {
      setError("Check every option: enter a valid price and whole-number stock quantity. Original price must be at least the selling price.");
      return;
    }

    setError(null);
    setPartialProductId(null);
    setIsSaving(true);
    try {
      const mediaUrls: string[] = [];
      for (let index = 0; index < mediaFiles.length; index += 1) {
        const file = mediaFiles[index];
        if (!file) continue;
        setProgress(`Uploading media ${index + 1} of ${mediaFiles.length}…`);
        mediaUrls.push(await uploadMediaFile(file, token));
      }

      setProgress("Saving product details…");
      const result = await apiRequest<{ _id: string }>("/admin/products", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          skuRoot: `ZYV-${makeSkuCode(name)}`,
          brand: brand.trim() || undefined,
          shortDescription: shortDescription.trim() || undefined,
          description: description.trim() || undefined,
          categoryIds: [selectedCategoryId],
          highlights: highlights.split("\n").map((value) => value.trim()).filter(Boolean),
          tags: tags.split(",").map((value) => value.trim()).filter(Boolean),
          seoTitle: seoTitle.trim() || undefined,
          seoDescription: seoDescription.trim() || undefined,
          publicationStatus: "draft",
          attributeValues: productAttributes.flatMap((attribute) => {
            const value = toAttributeValue(attribute, attributeValues[attribute.code] ?? "");
            return value === undefined ? [] : [{ attributeCode: attribute.code, value }];
          })
        })
      }, token);

      setPartialProductId(result.data._id);
      for (let index = 0; index < variants.length; index += 1) {
        const variant = variants[index];
        if (!variant) continue;
        setProgress(`Saving price and stock option ${index + 1} of ${variants.length}…`);
        const optionValues = [
          ...(variant.size.trim() ? [{ attributeCode: "size", label: "Size", value: variant.size.trim() }] : []),
          ...(variant.color.trim() ? [{ attributeCode: "color", label: "Color", value: variant.color.trim() }] : [])
        ];
        const title = variant.label.trim() || [variant.size.trim(), variant.color.trim()].filter(Boolean).join(" / ") || undefined;
        await apiRequest(`/admin/products/${result.data._id}/variants`, {
          method: "POST",
          body: JSON.stringify({
            sku: variant.sku.trim().toUpperCase() || `ZYV-${makeSkuCode(name)}-${makeSkuCode([variant.size, variant.color].filter(Boolean).join("-") || `OPTION-${index + 1}`)}-${index + 1}`,
            title,
            optionValues,
            priceMinor: Math.round(Number(variant.price) * 100),
            compareAtMinor: variant.compareAtPrice ? Math.round(Number(variant.compareAtPrice) * 100) : undefined,
            currency: "INR",
            mediaUrls,
            isActive: true,
            sortOrder: index,
            initialStock: Number(variant.stock),
            lowStockThreshold: 5
          })
        }, token);
      }
      if (publicationStatus === "published") {
        setProgress("Publishing product…");
        await apiRequest(`/admin/products/${result.data._id}`, {
          method: "PUT",
          body: JSON.stringify({ publicationStatus: "published" })
        }, token);
      }
      router.push(`/products/${result.data._id}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "The product could not be saved.");
    } finally {
      setIsSaving(false);
      setProgress("");
    }
  };

  return (
    <main className="mx-auto max-w-6xl">
      <Link href="/products" className="mb-5 inline-flex items-center gap-2 text-xs font-medium text-[#8e7168] hover:text-[#754241]"><ArrowLeft size={15} /> Back to products</Link>
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="admin-eyebrow">Catalog / Product setup</p><h1 className="admin-page-title mt-2">Add a product</h1><p className="admin-page-subtitle">Add a photo, choose a collection, set your price and stock, then publish to your store.</p></div><p className="rounded-full bg-white px-4 py-2 text-xs text-[#806c64]">SKU codes are created for you</p></div>
      {error ? <div className="mt-5 rounded-xl border border-[#edc8be] bg-[#fff3ef] px-4 py-3 text-sm text-[#9a463d]">{error}{partialProductId ? <span> Product details were saved. <Link className="font-semibold underline" href={`/products/${partialProductId}`}>Open the product and finish its options.</Link></span> : null}</div> : null}
      {visibleCategories.length === 0 && !isLoadingOptions ? <div className="mt-5 rounded-xl border border-[#eedfce] bg-[#fffaf3] p-4 text-sm text-[#806c64]">{categories.length ? "Your categories are hidden from customers. Make one visible to add a product to the storefront." : "Create a category first, for example Clothing, then add Shirts or Jeans beneath it."} <Link href="/categories" className="font-semibold text-[#754241] underline">Manage categories</Link></div> : null}

      <form className="mt-6 grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_300px]" onSubmit={createProduct}>
        <div className="grid min-w-0 gap-5">
          <section className="panel p-5 sm:p-6">
            <div className="mb-5"><p className="admin-eyebrow">1 / Listing information</p><h2 className="mt-2 font-display text-2xl text-[#392623]">What are you selling?</h2><p className="mt-1 text-xs leading-5 text-[#927e76]">This information becomes the product title, description, and specifications on the store.</p></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="admin-label sm:col-span-2">Product title<input value={name} onChange={(event) => setName(event.target.value)} className="admin-field mt-1.5" placeholder="e.g. Relaxed Cotton Shirt" minLength={2} maxLength={160} required /></label>
              <label className="admin-label">Brand<input value={brand} onChange={(event) => setBrand(event.target.value)} className="admin-field mt-1.5" placeholder="Your brand name" maxLength={120} /></label>
              <label className="admin-label">Store collection<select value={selectedCategoryId} onChange={(event) => { setSelectedCategoryId(event.target.value); setAttributeValues({}); }} className="admin-field mt-1.5" required disabled={!visibleCategories.length}><option value="">Choose where it appears</option>{visibleCategories.map((category) => <option key={category._id} value={category._id}>{category.parentCategoryId ? "↳ " : ""}{category.name}</option>)}</select><span className="mt-1 block text-[10px] font-normal text-[#a18d84]">Only collections visible to customers are shown here.</span></label>
              <label className="admin-label sm:col-span-2">Short description<input value={shortDescription} onChange={(event) => setShortDescription(event.target.value)} className="admin-field mt-1.5" placeholder="A one-line introduction shown on product cards" maxLength={500} /></label>
              <label className="admin-label sm:col-span-2">Full product description<textarea value={description} onChange={(event) => setDescription(event.target.value)} className="admin-field mt-1.5 min-h-32 resize-y" placeholder="Describe the fit, material, feel, use, and care details customers need." maxLength={10000} /></label>
              <label className="admin-label">Store visibility<select value={publicationStatus} onChange={(event) => setPublicationStatus(event.target.value as "draft" | "published")} className="admin-field mt-1.5"><option value="published">Show in customer store</option><option value="draft">Keep as draft</option></select><span className="mt-1 block text-[10px] font-normal text-[#a18d84]">Choose whether customers can see this product after saving.</span></label>
              <label className="admin-label sm:col-span-2">Selling points<textarea value={highlights} onChange={(event) => setHighlights(event.target.value)} className="admin-field mt-1.5 min-h-24 resize-y" placeholder={"One per line, for example:\n100% cotton\nRelaxed fit\nMachine washable"} /></label>
              {productAttributes.length ? <div className="grid gap-4 border-t border-[#f0e7e2] pt-4 sm:col-span-2 sm:grid-cols-2"><div className="sm:col-span-2"><p className="admin-eyebrow">Product specifications</p><p className="mt-1 text-xs text-[#927e76]">These fields were set up for this collection in Categories.</p></div>{productAttributes.map((attribute) => <label key={attribute._id} className="admin-label">{attribute.name}{attribute.dataType === "boolean" ? <select value={attributeValues[attribute.code] ?? ""} onChange={(event) => setAttributeValues((current) => ({ ...current, [attribute.code]: event.target.value }))} className="admin-field mt-1.5"><option value="">Choose…</option><option value="true">Yes</option><option value="false">No</option></select> : attribute.dataType === "single_select" && attribute.options.length ? <select value={attributeValues[attribute.code] ?? ""} onChange={(event) => setAttributeValues((current) => ({ ...current, [attribute.code]: event.target.value }))} className="admin-field mt-1.5"><option value="">Choose…</option>{attribute.options.map((option) => <option key={option} value={option}>{option}</option>)}</select> : <input value={attributeValues[attribute.code] ?? ""} onChange={(event) => setAttributeValues((current) => ({ ...current, [attribute.code]: event.target.value }))} className="admin-field mt-1.5" type={attribute.dataType === "number" ? "number" : "text"} placeholder={attribute.dataType === "multi_select" ? "Comma-separated values" : attribute.name} />}</label>)}</div> : null}
              <label className="admin-label sm:col-span-2">Search tags<input value={tags} onChange={(event) => setTags(event.target.value)} className="admin-field mt-1.5" placeholder="cotton, casual, summer (comma separated)" /></label>
              <details className="sm:col-span-2"><summary className="cursor-pointer text-xs font-medium text-[#754241]">Search engine listing (optional)</summary><div className="mt-3 grid gap-3"><input value={seoTitle} onChange={(event) => setSeoTitle(event.target.value)} className="admin-field" maxLength={160} placeholder="Search result title" /><textarea value={seoDescription} onChange={(event) => setSeoDescription(event.target.value)} className="admin-field min-h-20 resize-y" maxLength={320} placeholder="Search result description" /></div></details>
            </div>
          </section>

          <section className="panel p-5 sm:p-6">
            <div className="mb-4"><p className="admin-eyebrow">2 / Product photos and videos</p><h2 className="mt-2 font-display text-2xl text-[#392623]">Add the media customers will see</h2><p className="mt-1 text-xs leading-5 text-[#927e76]">Select photos and videos from your device. They upload to Cloudinary and appear in the customer product gallery.</p></div>
            <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#e6d5cd] bg-[#fffaf7] p-5 text-center transition hover:border-[#b7857b]">
              <UploadCloud size={25} className="text-[#9c5e5d]" /><span className="mt-2 text-sm font-semibold text-[#493530]">Choose photos or videos</span><span className="mt-1 text-xs text-[#927e76]">Images up to 15 MB · Videos up to 100 MB · Up to 20 files</span>
              <input type="file" accept="image/*,video/*" multiple className="sr-only" onChange={(event) => { chooseMedia(Array.from(event.target.files ?? [])); event.target.value = ""; }} />
            </label>
            {mediaFiles.length ? <div className="mt-4 grid gap-2 sm:grid-cols-2">{mediaFiles.map((file, index) => <div key={`${file.name}-${index}`} className="flex min-w-0 items-center gap-3 rounded-xl border border-[#f0e7e2] bg-white p-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f7ece7] text-[#9c5e5d]">{file.type.startsWith("image/") ? <ImagePlus size={17} /> : <UploadCloud size={17} />}</span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-medium text-[#493530]">{file.name}</span><span className="mt-0.5 block text-[10px] text-[#a18d84]">{file.type.startsWith("image/") ? "Photo" : "Video"} · {fileSize(file.size)}</span></span><button type="button" onClick={() => setMediaFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="rounded-full p-2 text-[#9b716a] hover:bg-[#fff2ee]" aria-label={`Remove ${file.name}`}><Trash2 size={14} /></button></div>)}</div> : <div className="mt-3 rounded-xl bg-[#fdf8f5] p-3 text-xs text-[#927e76]">No product media selected yet.</div>}
          </section>

          <section className="panel p-5 sm:p-6">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><p className="admin-eyebrow">3 / Price and inventory</p><h2 className="mt-2 font-display text-2xl text-[#392623]">What can customers buy?</h2><p className="mt-1 text-xs leading-5 text-[#927e76]">Add one row per sellable combination. Each row has its own price and stock count.</p></div><button type="button" onClick={() => setVariants((current) => [...current, newVariant(Math.max(0, ...current.map((item) => item.key)) + 1)])} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#e6d5cd] bg-white px-4 text-xs font-medium text-[#754241]"><Plus size={15} /> Add option</button></div>
            <div className="space-y-4">{variants.map((variant, index) => <article key={variant.key} className="rounded-2xl border border-[#f0e7e2] bg-[#fffdfa] p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8e5552]">Option {index + 1}</p>{variants.length > 1 ? <button type="button" onClick={() => setVariants((current) => current.filter((item) => item.key !== variant.key))} className="rounded-full p-2 text-[#9b716a] hover:bg-[#fff2ee]" aria-label={`Remove option ${index + 1}`}><Trash2 size={15} /></button> : null}</div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <label className="admin-label">Option label<input value={variant.label} onChange={(event) => updateVariant(variant.key, "label", event.target.value)} className="admin-field mt-1.5" placeholder="e.g. Regular fit" /></label>
                <label className="admin-label">Size<input value={variant.size} onChange={(event) => updateVariant(variant.key, "size", event.target.value)} className="admin-field mt-1.5" placeholder="e.g. M, UK 6, 30" /></label>
                <label className="admin-label">Color<input value={variant.color} onChange={(event) => updateVariant(variant.key, "color", event.target.value)} className="admin-field mt-1.5" placeholder="e.g. Navy" /></label>
                <label className="admin-label">SKU <span className="font-normal text-[#a18d84]">(optional)</span><input value={variant.sku} onChange={(event) => updateVariant(variant.key, "sku", event.target.value.toUpperCase())} className="admin-field mt-1.5 uppercase" placeholder={`Auto: ZYV-${makeSkuCode(name || "PRODUCT")}-OPTION-${index + 1}`} /></label>
                <label className="admin-label">Selling price (₹)<input value={variant.price} onChange={(event) => updateVariant(variant.key, "price", event.target.value)} className="admin-field mt-1.5" type="number" min="0" step="0.01" placeholder="1299.00" required /></label>
                <label className="admin-label">Original price (₹)<input value={variant.compareAtPrice} onChange={(event) => updateVariant(variant.key, "compareAtPrice", event.target.value)} className="admin-field mt-1.5" type="number" min="0" step="0.01" placeholder="Optional sale comparison" /></label>
                <label className="admin-label sm:col-span-2 xl:col-span-1">Quantity in stock<input value={variant.stock} onChange={(event) => updateVariant(variant.key, "stock", event.target.value)} className="admin-field mt-1.5" type="number" min="0" step="1" required /><span className="mt-1 block text-[10px] font-normal text-[#a18d84]">How many of this exact option you have.</span></label>
              </div>
            </article>)}</div>
          </section>
        </div>

        <aside className="panel p-5 xl:sticky xl:top-28">
          <p className="admin-eyebrow">Review before saving</p><h2 className="mt-2 font-display text-2xl text-[#392623]">Your listing</h2>
          <div className="mt-4 space-y-3 border-y border-[#f0e7e2] py-4 text-xs text-[#806c64]">
            <div className="flex justify-between gap-2"><span>Collection</span><span className="text-right font-medium text-[#493530]">{categories.find((item) => item._id === selectedCategoryId)?.name ?? "Choose one"}</span></div>
            <div className="flex justify-between gap-2"><span>Options</span><span className="font-medium text-[#493530]">{variants.length}</span></div>
            <div className="flex justify-between gap-2"><span>Media files</span><span className="font-medium text-[#493530]">{mediaFiles.length}</span></div>
            <div className="flex justify-between gap-2"><span>Visibility</span><span className="font-medium capitalize text-[#493530]">{publicationStatus}</span></div>
          </div>
          <div className="mt-4 rounded-xl bg-[#f8f0eb] p-3 text-[11px] leading-5 text-[#806c64]">To appear in the customer store, the product must be published and its collection visible. Customers can purchase it when at least one option has stock.</div>
          <button disabled={isSaving || isLoadingOptions || !visibleCategories.length} className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#754241] px-5 text-sm font-medium text-white transition hover:bg-[#603634] disabled:cursor-not-allowed disabled:opacity-50">{isSaving ? progress || "Saving product…" : publicationStatus === "published" ? "Save and show in customer store" : "Save as draft"}</button>
          {isSaving ? <p className="mt-3 text-center text-[10px] text-[#927e76]">Keep this page open until saving completes.</p> : null}
          <Link href="/categories" className="mt-4 block text-center text-xs text-[#8e5552] underline">Need another category or product field?</Link>
        </aside>
      </form>
    </main>
  );
}
