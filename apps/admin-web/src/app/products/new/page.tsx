"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, getStoredAdminToken } from "../../../lib/api";

type CategoryItem = {
  _id: string;
  name: string;
};

export default function ProductCreatePage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState("");
  const [skuRoot, setSkuRoot] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");

  useEffect(() => {
    const storedToken = getStoredAdminToken();
    if (!storedToken) {
      setError("Admin token not found. Please sign in first.");
      return;
    }

    setToken(storedToken);
    apiRequest<Array<{ _id: string; name: string }>>("/catalog/admin/categories", undefined, storedToken)
      .then((result) => {
        setCategories(result.data);
        const firstCategory = result.data.at(0);
        if (firstCategory) {
          setSelectedCategoryId(firstCategory._id);
        }
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Failed to load categories");
      });
  }, []);

  const createProduct = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      return;
    }

    setError(null);
    setIsSaving(true);

    try {
      const result = await apiRequest<{ _id: string }>(
        "/admin/products",
        {
          method: "POST",
          body: JSON.stringify({
            name,
            skuRoot,
            categoryIds: [selectedCategoryId],
            highlights: [],
            tags: [],
            publicationStatus: "draft",
            attributeValues: []
          })
        },
        token
      );

      router.push(`/products/${result.data._id}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to create product");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-4 pb-12 pt-6 sm:px-8">
      <h1 className="text-4xl" style={{ fontFamily: "var(--font-display)" }}>Create Product</h1>
      {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}
      <form className="panel mt-6 space-y-4 p-6" onSubmit={createProduct}>
        <div>
          <label className="mb-1 block text-sm text-[#5b6470]">Product name</label>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-xl border border-[#d3d7dd] px-4 py-2.5"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-[#5b6470]">SKU Root</label>
          <input
            value={skuRoot}
            onChange={(event) => setSkuRoot(event.target.value.toUpperCase())}
            className="w-full rounded-xl border border-[#d3d7dd] px-4 py-2.5"
            placeholder="ZYV-PROD-001"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-[#5b6470]">Primary category</label>
          <select
            value={selectedCategoryId}
            onChange={(event) => setSelectedCategoryId(event.target.value)}
            className="w-full rounded-xl border border-[#d3d7dd] px-4 py-2.5"
            required
          >
            {categories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <button disabled={isSaving} className="rounded-full bg-[#111827] px-5 py-2 text-sm text-white disabled:opacity-60">
          {isSaving ? "Creating..." : "Create Product"}
        </button>
      </form>
    </main>
  );
}
