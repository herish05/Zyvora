"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Layers3, Pencil, Plus, Tag, Trash2, X } from "lucide-react";
import { apiRequest, getStoredAdminToken } from "../../lib/api";
import { uploadMediaFile } from "../../lib/media";

type AttributeItem = {
  _id: string;
  name: string;
  code: string;
  dataType: string;
  options: string[];
  isFilterable: boolean;
  isVariantAxis: boolean;
  appliesToCategoryIds: string[];
};

type CategoryItem = {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  parentCategoryId?: string | null;
  isVisible: boolean;
  sortOrder: number;
  attributeDefinitionIds: Array<string | { _id: string }>;
};

const categoryAttributeIds = (category: CategoryItem) =>
  category.attributeDefinitionIds.map((attribute) => typeof attribute === "string" ? attribute : attribute._id);

const emptyCategoryForm = {
  name: "",
  slug: "",
  description: "",
  imageUrl: "",
  parentCategoryId: "",
  sortOrder: "0",
  isVisible: true,
  attributeDefinitionIds: [] as string[]
};

export default function CategoriesPage() {
  const [token, setToken] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [attributes, setAttributes] = useState<AttributeItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [isSavingAttribute, setIsSavingAttribute] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [categoryForm, setCategoryForm] = useState(emptyCategoryForm);
  const [categoryImage, setCategoryImage] = useState<File | null>(null);
  const categoryImageInputRef = useRef<HTMLInputElement>(null);
  const [attributeName, setAttributeName] = useState("");
  const [attributeCode, setAttributeCode] = useState("");
  const [attributeType, setAttributeType] = useState("text");
  const [attributeOptions, setAttributeOptions] = useState("");
  const [attributeCategories, setAttributeCategories] = useState<string[]>([]);
  const [isFilterable, setIsFilterable] = useState(true);
  const [isVariantAxis, setIsVariantAxis] = useState(false);

  const loadData = async (authToken: string) => {
    const [categoryRes, attributeRes] = await Promise.all([
      apiRequest<CategoryItem[]>("/catalog/admin/categories", undefined, authToken),
      apiRequest<AttributeItem[]>("/catalog/admin/attributes", undefined, authToken)
    ]);
    setCategories(categoryRes.data);
    setAttributes(attributeRes.data);
  };

  useEffect(() => {
    const storedToken = getStoredAdminToken();
    if (!storedToken) {
      setError("Your admin session is missing. Sign in again to manage the catalog.");
      return;
    }
    setToken(storedToken);
    loadData(storedToken).catch((loadError) => {
      setError(loadError instanceof Error ? loadError.message : "Catalog data could not be loaded.");
    });
  }, []);

  const updateCategoryField = <K extends keyof typeof emptyCategoryForm>(key: K, value: (typeof emptyCategoryForm)[K]) => {
    setCategoryForm((current) => ({ ...current, [key]: value }));
  };

  const startEditCategory = (category: CategoryItem) => {
    setEditingId(category._id);
    setCategoryImage(null);
    setCategoryForm({
      name: category.name,
      slug: category.slug,
      description: category.description ?? "",
      imageUrl: category.imageUrl ?? "",
      parentCategoryId: category.parentCategoryId ?? "",
      sortOrder: String(category.sortOrder),
      isVisible: category.isVisible,
      attributeDefinitionIds: categoryAttributeIds(category)
    });
    setError(null);
    setNotice(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setCategoryImage(null);
    if (categoryImageInputRef.current) categoryImageInputRef.current.value = "";
    setCategoryForm(emptyCategoryForm);
  };

  const deleteCategory = async (category: CategoryItem) => {
    if (!token || !window.confirm(`Delete category “${category.name}”? It must have no products or child categories.`)) return;
    setError(null);
    setNotice(null);
    try {
      await apiRequest(`/catalog/admin/categories/${category._id}`, { method: "DELETE" }, token);
      await loadData(token);
      setNotice("Category deleted.");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Category could not be deleted.");
    }
  };

  const saveCategory = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;
    setError(null);
    setNotice(null);
    setIsSavingCategory(true);
    try {
      const imageUrl = categoryImage ? await uploadMediaFile(categoryImage, token, "categories") : categoryForm.imageUrl.trim();
      const body = {
        name: categoryForm.name.trim(),
        slug: categoryForm.slug.trim() || undefined,
        description: categoryForm.description.trim() || undefined,
        imageUrl: imageUrl || undefined,
        parentCategoryId: editingId ? categoryForm.parentCategoryId || null : categoryForm.parentCategoryId || undefined,
        sortOrder: Number(categoryForm.sortOrder) || 0,
        isVisible: categoryForm.isVisible,
        attributeDefinitionIds: categoryForm.attributeDefinitionIds
      };
      await apiRequest(
        editingId ? `/catalog/admin/categories/${editingId}` : "/catalog/admin/categories",
        { method: editingId ? "PUT" : "POST", body: JSON.stringify(body) },
        token
      );
      cancelEdit();
      await loadData(token);
      setNotice(editingId ? "Category changes saved." : "Category created.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Category could not be saved.");
    } finally {
      setIsSavingCategory(false);
    }
  };

  const createAttribute = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;
    setError(null);
    setNotice(null);
    setIsSavingAttribute(true);
    try {
      const result = await apiRequest<AttributeItem>("/catalog/admin/attributes", {
        method: "POST",
        body: JSON.stringify({
          name: attributeName.trim(),
          code: attributeCode.trim() || undefined,
          dataType: attributeType,
          options: attributeOptions.split(/[\n,]/).map((option) => option.trim()).filter(Boolean),
          isFilterable,
          isVariantAxis,
          appliesToCategoryIds: attributeCategories,
          isActive: true
        })
      }, token);

      if (attributeCategories.length > 0) {
        await Promise.all(attributeCategories.map((categoryId) => {
          const category = categories.find((item) => item._id === categoryId);
          const existingIds = category ? categoryAttributeIds(category) : [];
          return apiRequest(`/catalog/admin/categories/${categoryId}`, {
            method: "PUT",
            body: JSON.stringify({ attributeDefinitionIds: [...new Set([...existingIds, result.data._id])] })
          }, token);
        }));
      }

      setAttributeName("");
      setAttributeCode("");
      setAttributeOptions("");
      setAttributeCategories([]);
      setIsFilterable(true);
      setIsVariantAxis(false);
      await loadData(token);
      setNotice("Product detail field created and linked to the selected categories.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Product detail field could not be created.");
    } finally {
      setIsSavingAttribute(false);
    }
  };

  const toggleId = (ids: string[], id: string, setIds: (next: string[]) => void) => {
    setIds(ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id]);
  };

  return (
    <main className="mx-auto max-w-7xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="admin-eyebrow">Catalog / Store structure</p><h1 className="admin-page-title mt-2">Categories & product details</h1><p className="admin-page-subtitle">Build the collections customers browse, then choose the details your products need.</p></div>
        <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs text-[#806c64] shadow-sm"><Layers3 size={15} className="text-[#9c5e5d]" /> {categories.length} collections <span className="mx-1 text-[#dbcfc8]">·</span><Tag size={14} className="text-[#9c5e5d]" /> {attributes.length} product fields</div>
      </div>

      {error ? <div className="mt-5 rounded-xl border border-[#edc8be] bg-[#fff3ef] px-4 py-3 text-sm text-[#9a463d]">{error}</div> : null}
      {notice ? <div className="mt-5 rounded-xl border border-[#d8e8d8] bg-[#f0f7ef] px-4 py-3 text-sm text-[#4e7759]">{notice}</div> : null}

      <div className="mt-6 grid items-start gap-5 xl:grid-cols-[1.05fr_.95fr]">
        <section className="panel p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3"><div><p className="admin-eyebrow">{editingId ? "Edit collection" : "01 / Store collections"}</p><h2 className="mt-2 font-display text-2xl text-[#392623]">{editingId ? "Update category" : "Create a category"}</h2><p className="mt-1 text-xs leading-5 text-[#927e76]">Use parent categories like Clothing, then add collections such as Shirts and Jeans.</p></div>{editingId ? <button type="button" onClick={cancelEdit} className="rounded-full p-2 text-[#8e7168] hover:bg-[#f7ece7]" aria-label="Cancel edit"><X size={17} /></button> : null}</div>
          <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={saveCategory}>
            <label className="admin-label sm:col-span-2">Category name<input value={categoryForm.name} onChange={(event) => updateCategoryField("name", event.target.value)} placeholder="e.g. Clothing or Shirts" className="admin-field mt-1.5" minLength={2} maxLength={120} required /></label>
            <label className="admin-label">URL slug<input value={categoryForm.slug} onChange={(event) => updateCategoryField("slug", event.target.value)} placeholder="Auto-generated from the name" className="admin-field mt-1.5" /></label>
            <label className="admin-label">Parent collection<select value={categoryForm.parentCategoryId} onChange={(event) => updateCategoryField("parentCategoryId", event.target.value)} className="admin-field mt-1.5"><option value="">Top-level collection</option>{categories.filter((category) => category._id !== editingId).map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}</select></label>
            <label className="admin-label sm:col-span-2">Description<textarea value={categoryForm.description} onChange={(event) => updateCategoryField("description", event.target.value)} placeholder="A short introduction to this collection" className="admin-field mt-1.5 min-h-20 resize-y" maxLength={1000} /></label>
            <label className="admin-label">Position<input value={categoryForm.sortOrder} onChange={(event) => updateCategoryField("sortOrder", event.target.value)} type="number" className="admin-field mt-1.5" /></label>
            <label className="admin-label">Collection cover<input ref={categoryImageInputRef} type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; if (file.size > 15 * 1024 * 1024) { setError("Category cover images must be 15 MB or smaller."); event.target.value = ""; return; } setError(null); setCategoryImage(file); }} className="admin-field mt-1.5 file:mr-2 file:rounded-full file:border-0 file:bg-[#f7ece7] file:px-3 file:py-2 file:text-xs file:font-medium file:text-[#754241]" /></label>
            {categoryForm.imageUrl && !categoryImage ? <div className="sm:col-span-2"><a href={categoryForm.imageUrl} target="_blank" rel="noreferrer" className="text-xs text-[#754241] underline">Current cover image</a></div> : null}
            {categoryImage ? <p className="text-xs text-[#806c64] sm:col-span-2"><ImagePlus className="mr-1 inline" size={14} /> Selected: {categoryImage.name}</p> : null}
            {attributes.length ? <fieldset className="rounded-xl border border-[#f0e7e2] p-4 sm:col-span-2"><legend className="px-1 text-xs font-semibold text-[#493530]">Product details available in this collection</legend><div className="mt-1 grid gap-2 sm:grid-cols-2">{attributes.map((attribute) => <label key={attribute._id} className="flex items-center gap-2 text-xs text-[#806c64]"><input type="checkbox" checked={categoryForm.attributeDefinitionIds.includes(attribute._id)} onChange={() => toggleId(categoryForm.attributeDefinitionIds, attribute._id, (ids) => updateCategoryField("attributeDefinitionIds", ids))} />{attribute.name}<span className="text-[10px] text-[#a38f86]">{attribute.dataType}</span></label>)}</div></fieldset> : null}
            <label className="flex items-center gap-2 text-xs text-[#806c64] sm:col-span-2"><input type="checkbox" checked={categoryForm.isVisible} onChange={(event) => updateCategoryField("isVisible", event.target.checked)} /> Show this collection on the storefront</label>
            <button disabled={isSavingCategory} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#754241] px-5 text-sm font-medium text-white transition hover:bg-[#603634] disabled:opacity-60 sm:col-span-2">{editingId ? <Pencil size={15} /> : <Plus size={15} />}{isSavingCategory ? "Saving…" : editingId ? "Save category" : "Create category"}</button>
          </form>
        </section>

        <section className="panel p-5 sm:p-6">
          <p className="admin-eyebrow">02 / Product details</p><h2 className="mt-2 font-display text-2xl text-[#392623]">Create a product field</h2><p className="mt-1 text-xs leading-5 text-[#927e76]">Examples: fabric, fit, material, occasion, or care instructions. The selected fields will be available when you add products.</p>
          <form className="mt-5 grid gap-3 sm:grid-cols-2" onSubmit={createAttribute}>
            <label className="admin-label">Field name<input value={attributeName} onChange={(event) => setAttributeName(event.target.value)} placeholder="e.g. Fabric" className="admin-field mt-1.5" minLength={2} maxLength={120} required /></label>
            <label className="admin-label">Code<input value={attributeCode} onChange={(event) => setAttributeCode(event.target.value)} placeholder="Auto-generated" className="admin-field mt-1.5" /></label>
            <label className="admin-label sm:col-span-2">Answer type<select value={attributeType} onChange={(event) => setAttributeType(event.target.value)} className="admin-field mt-1.5">{["text", "number", "boolean", "date", "single_select", "multi_select", "measurement", "url"].map((type) => <option key={type} value={type}>{type.replaceAll("_", " ")}</option>)}</select></label>
            {["single_select", "multi_select"].includes(attributeType) ? <label className="admin-label sm:col-span-2">Choices<textarea value={attributeOptions} onChange={(event) => setAttributeOptions(event.target.value)} placeholder="Cotton, Linen, Denim" className="admin-field mt-1.5 min-h-16 resize-y" /></label> : null}
            <fieldset className="rounded-xl border border-[#f0e7e2] p-4 sm:col-span-2"><legend className="px-1 text-xs font-semibold text-[#493530]">Apply to collections</legend><div className="grid gap-2 sm:grid-cols-2">{categories.map((category) => <label key={category._id} className="flex items-center gap-2 text-xs text-[#806c64]"><input type="checkbox" checked={attributeCategories.includes(category._id)} onChange={() => toggleId(attributeCategories, category._id, setAttributeCategories)} />{category.name}</label>)}</div></fieldset>
            <label className="flex items-center gap-2 text-xs text-[#806c64]"><input type="checkbox" checked={isFilterable} onChange={(event) => setIsFilterable(event.target.checked)} /> Allow customers to filter by this</label>
            <label className="flex items-center gap-2 text-xs text-[#806c64]"><input type="checkbox" checked={isVariantAxis} onChange={(event) => setIsVariantAxis(event.target.checked)} /> Use as an option axis</label>
            <button disabled={isSavingAttribute} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#e6d5cd] bg-white px-5 text-sm font-medium text-[#754241] transition hover:bg-[#fff8f4] disabled:opacity-60 sm:col-span-2"><Plus size={15} />{isSavingAttribute ? "Creating…" : "Create product field"}</button>
          </form>
        </section>
      </div>

      <section className="panel mt-5 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3"><div><p className="admin-eyebrow">Your store structure</p><h2 className="mt-2 font-display text-2xl text-[#392623]">Collections</h2></div><span className="rounded-full bg-[#f7ece7] px-3 py-1.5 text-xs font-semibold text-[#8e5552]">{categories.length}</span></div>
        {categories.length ? <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{categories.map((category) => {
          const parent = categories.find((item) => item._id === category.parentCategoryId);
          const applied = categoryAttributeIds(category).map((id) => attributes.find((attribute) => attribute._id === id)?.name).filter(Boolean);
          return <article key={category._id} className="rounded-2xl border border-[#f0e7e2] bg-white p-4">
            <div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-3">{category.imageUrl ? <img src={category.imageUrl} alt="" className="h-12 w-12 rounded-xl object-cover" /> : <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f7ece7] text-[#9c5e5d]"><Layers3 size={18} /></div>}<div className="min-w-0"><p className="truncate text-sm font-semibold text-[#493530]">{category.name}</p><p className="mt-1 truncate text-[10px] text-[#907a72]">{parent ? `${parent.name} / ` : "/"}{category.slug}</p></div></div><div className="flex shrink-0"><button onClick={() => startEditCategory(category)} className="rounded-full p-2 text-[#8e7168] hover:bg-[#f7ece7]" aria-label={`Edit ${category.name}`}><Pencil size={15} /></button><button onClick={() => deleteCategory(category)} className="rounded-full p-2 text-[#9a625b] hover:bg-[#fff0ec]" aria-label={`Delete ${category.name}`}><Trash2 size={15} /></button></div></div>
            {category.description ? <p className="mt-3 line-clamp-2 text-xs leading-5 text-[#806c64]">{category.description}</p> : null}
            <div className="mt-3 flex flex-wrap items-center gap-1.5">{applied.map((name) => <span key={name} className="rounded-full bg-[#f7ece7] px-2.5 py-1 text-[9px] text-[#8e5552]">{name}</span>)}<span className={`rounded-full px-2.5 py-1 text-[9px] font-medium ${category.isVisible ? "bg-[#eaf2eb] text-[#50795f]" : "bg-[#f4eee8] text-[#907a72]"}`}>{category.isVisible ? "Visible" : "Hidden"}</span></div>
          </article>;
        })}</div> : <div className="mt-4 rounded-xl bg-[#fff9f6] p-6 text-center text-sm text-[#806c64]">Start with a collection such as Clothing, then create child categories for Shirts and Jeans.</div>}
      </section>

      <section className="panel mt-5 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3"><div><p className="admin-eyebrow">Product field library</p><h2 className="mt-2 font-display text-2xl text-[#392623]">Details you can add to listings</h2></div><span className="rounded-full bg-[#f5eee4] px-3 py-1.5 text-xs font-semibold text-[#91724c]">{attributes.length}</span></div>
        {attributes.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{attributes.map((attribute) => <article key={attribute._id} className="rounded-xl border border-[#f0e7e2] p-4"><div className="flex items-center justify-between gap-2"><p className="text-sm font-semibold text-[#493530]">{attribute.name}</p><span className="rounded-full bg-[#f7ece7] px-2.5 py-1 text-[9px] font-medium text-[#8e5552]">{attribute.dataType.replaceAll("_", " ")}</span></div><p className="mt-1 text-[10px] text-[#907a72]">{attribute.code}{attribute.isFilterable ? " · customer filter" : ""}{attribute.isVariantAxis ? " · option axis" : ""}</p><p className="mt-2 text-[10px] text-[#907a72]">{attribute.appliesToCategoryIds.map((id) => categories.find((category) => category._id === id)?.name).filter(Boolean).join(", ") || "All collections"}</p></article>)}</div> : <p className="mt-4 text-sm text-[#907a72]">Create fields to describe materials, fit, care, and other product details.</p>}
      </section>
    </main>
  );
}
