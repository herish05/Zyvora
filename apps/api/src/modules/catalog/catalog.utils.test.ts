import { describe, expect, it } from "vitest";
import { buildCategoryTree } from "./catalog.utils.js";

describe("buildCategoryTree", () => {
  it("builds nested hierarchy and sorts by sortOrder then name", () => {
    const tree = buildCategoryTree([
      { id: "1", name: "Electronics", slug: "electronics", sortOrder: 2 },
      { id: "2", name: "Fashion", slug: "fashion", sortOrder: 1 },
      {
        id: "3",
        name: "Laptops",
        slug: "laptops",
        parentCategoryId: "1",
        sortOrder: 1
      },
      {
        id: "4",
        name: "Audio",
        slug: "audio",
        parentCategoryId: "1",
        sortOrder: 0
      }
    ]);

    expect(tree[0]?.slug).toBe("fashion");
    expect(tree[1]?.slug).toBe("electronics");
    expect(tree[1]?.children.map((n) => n.slug)).toEqual(["audio", "laptops"]);
  });
});
