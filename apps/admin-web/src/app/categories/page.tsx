"use client";

import { useEffect, useState } from "react";
import { apiRequest, getStoredAdminToken } from "../../lib/api";

type CategoryItem = {
  _id: string;
  name: string;
  slug: string;
  isVisible: boolean;
  sortOrder: number;
};

type AttributeItem = {
  _id: string;
  name: string;
  code: string;
  dataType: string;
  isFilterable: boolean;
};

export default function CategoriesPage() {
  const [token, setToken] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [attributes, setAttributes] = useState<AttributeItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [dataType, setDataType] = useState("text");
  const [attributeName, setAttributeName] = useState("");
  const [attributeCode, setAttributeCode] = useState("");

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
      setError("Admin token not found. Please sign in first.");
      return;
    }

    setToken(storedToken);
    loadData(storedToken).catch((loadError) => {
      setError(loadError instanceof Error ? loadError.message : "Failed to load catalog data");
    });
  }, []);

  const createCategory = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;

    await apiRequest("/catalog/admin/categories", {
      method: "POST",
      body: JSON.stringify({
        name,
        slug: slug || undefined,
        isVisible: true,
        sortOrder: 0,
        attributeDefinitionIds: []
      })
    }, token);

    setName("");
    setSlug("");
    await loadData(token);
  };

  const createAttribute = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;

    await apiRequest("/catalog/admin/attributes", {
      method: "POST",
      body: JSON.stringify({
        name: attributeName,
        code: attributeCode || undefined,
        dataType,
        options: [],
        isFilterable: true,
        isVariantAxis: false,
        appliesToCategoryIds: [],
        isActive: true
      })
    }, token);

    setAttributeName("");
    setAttributeCode("");
    await loadData(token);
  };

  return (
    <main className="mx-auto max-w-6xl px-4 pb-12 pt-6 sm:px-8">
      <h1 className="text-3xl sm:text-4xl" style={{ fontFamily: "var(--font-display)" }}>Category Management</h1>
      {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}
      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <section className="panel p-6">
          <h2 className="text-2xl" style={{ fontFamily: "var(--font-display)" }}>Create Category</h2>
          <form className="mt-4 space-y-3" onSubmit={createCategory}>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Category name"
              className="w-full rounded-xl border border-[#d3d7dd] px-4 py-2.5"
              required
            />
            <input
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              placeholder="slug (optional, kebab-case)"
              className="w-full rounded-xl border border-[#d3d7dd] px-4 py-2.5"
            />
            <button className="rounded-full bg-[#111827] px-4 py-2 text-sm text-white">Create Category</button>
          </form>
        </section>
        <section className="panel p-6">
          <h2 className="text-2xl" style={{ fontFamily: "var(--font-display)" }}>Create Attribute</h2>
          <form className="mt-4 space-y-3" onSubmit={createAttribute}>
            <input
              value={attributeName}
              onChange={(event) => setAttributeName(event.target.value)}
              placeholder="Attribute name"
              className="w-full rounded-xl border border-[#d3d7dd] px-4 py-2.5"
              required
            />
            <input
              value={attributeCode}
              onChange={(event) => setAttributeCode(event.target.value)}
              placeholder="attribute_code (optional)"
              className="w-full rounded-xl border border-[#d3d7dd] px-4 py-2.5"
            />
            <select value={dataType} onChange={(event) => setDataType(event.target.value)} className="w-full rounded-xl border border-[#d3d7dd] px-4 py-2.5">
              {[
                "text",
                "number",
                "boolean",
                "date",
                "single_select",
                "multi_select",
                "measurement",
                "url"
              ].map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <button className="rounded-full bg-[#111827] px-4 py-2 text-sm text-white">Create Attribute</button>
          </form>
        </section>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <section className="panel p-6">
          <h3 className="text-xl" style={{ fontFamily: "var(--font-display)" }}>Categories</h3>
          <div className="mt-3 space-y-2 text-sm">
            {categories.map((category) => (
              <div key={category._id} className="rounded-lg border border-[#e5e7eb] p-3">
                <p className="font-medium">{category.name}</p>
                <p className="text-[#5b6470]">/{category.slug} • sort {category.sortOrder} • {category.isVisible ? "visible" : "hidden"}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="panel p-6">
          <h3 className="text-xl" style={{ fontFamily: "var(--font-display)" }}>Attribute Definitions</h3>
          <div className="mt-3 space-y-2 text-sm">
            {attributes.map((attribute) => (
              <div key={attribute._id} className="rounded-lg border border-[#e5e7eb] p-3">
                <p className="font-medium">{attribute.name}</p>
                <p className="text-[#5b6470]">{attribute.code} • {attribute.dataType} • {attribute.isFilterable ? "filterable" : "not filterable"}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
