export const attributeDataTypes = [
  "text",
  "number",
  "boolean",
  "date",
  "single_select",
  "multi_select",
  "measurement",
  "url"
] as const;

export type AttributeDataType = (typeof attributeDataTypes)[number];

export type CategoryTreeNode = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  parentCategoryId?: string;
  sortOrder: number;
  children: CategoryTreeNode[];
};
