import type { CategoryTreeNode } from "./catalog.types.js";

type FlatCategory = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  parentCategoryId?: string;
  sortOrder: number;
};

export const buildCategoryTree = (categories: FlatCategory[]): CategoryTreeNode[] => {
  const nodes = new Map<string, CategoryTreeNode>();

  for (const category of categories) {
    nodes.set(category.id, {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      imageUrl: category.imageUrl,
      parentCategoryId: category.parentCategoryId,
      sortOrder: category.sortOrder,
      children: []
    });
  }

  const roots: CategoryTreeNode[] = [];

  for (const category of categories) {
    const node = nodes.get(category.id);
    if (!node) {
      continue;
    }

    if (category.parentCategoryId) {
      const parent = nodes.get(category.parentCategoryId);
      if (parent) {
        parent.children.push(node);
        continue;
      }
    }

    roots.push(node);
  }

  const sortNode = (node: CategoryTreeNode) => {
    node.children.sort((a, b) => (a.sortOrder === b.sortOrder ? a.name.localeCompare(b.name) : a.sortOrder - b.sortOrder));
    node.children.forEach(sortNode);
  };

  roots.sort((a, b) => (a.sortOrder === b.sortOrder ? a.name.localeCompare(b.name) : a.sortOrder - b.sortOrder));
  roots.forEach(sortNode);

  return roots;
};
