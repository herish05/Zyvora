export type MockReview = {
  id: string;
  name: string;
  rating: number;
  title: string;
  comment: string;
  imageUrl?: string;
  verified: boolean;
  receivedAt: string;
};

export type MockVariant = {
  id: string;
  label: string;
  priceMinor: number;
  compareAtMinor?: number;
  inStock: boolean;
  currency?: string;
};

export type MockProduct = {
  id: string;
  slug: string;
  category: "shoes" | "shirts" | "jeans" | "purse";
  name: string;
  brand: string;
  shortDescription: string;
  description: string;
  images: string[];
  rating: number;
  reviewCount: number;
  variants: MockVariant[];
  highlights: string[];
  specifications: Array<{ label: string; value: string }>;
  reviews: MockReview[];
  similarSlugs: string[];
};

export const mockProducts: MockProduct[] = [
  {
    id: "p-shoe-001",
    slug: "stridelab-runner-pro",
    category: "shoes",
    name: "StrideLab Runner Pro",
    brand: "StrideLab",
    shortDescription: "Lightweight running shoes with responsive foam and all-day comfort.",
    description:
      "Built for city pace and weekend training, Runner Pro balances lightweight mesh, structured heel support, and high-rebound cushioning.",
    images: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600269452121-4f2416e55c28?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=1200&q=80"
    ],
    rating: 4.6,
    reviewCount: 218,
    variants: [
      { id: "v-shoe-8", label: "UK 8", priceMinor: 499900, compareAtMinor: 599900, inStock: true },
      { id: "v-shoe-9", label: "UK 9", priceMinor: 499900, compareAtMinor: 599900, inStock: true },
      { id: "v-shoe-10", label: "UK 10", priceMinor: 499900, compareAtMinor: 599900, inStock: false }
    ],
    highlights: ["Breathable knit upper", "Slip-resistant outsole", "8mm heel drop"],
    specifications: [
      { label: "Material", value: "Engineered mesh + TPU frame" },
      { label: "Sole", value: "EVA + rubber traction pods" },
      { label: "Weight", value: "286g (single shoe, UK 8)" },
      { label: "Warranty", value: "6 months manufacturing" }
    ],
    reviews: [
      {
        id: "r-shoe-1",
        name: "Ananya M.",
        rating: 5,
        title: "Great cushioning",
        comment: "Used them for 2 weeks daily walks. Very comfortable and good grip on wet roads.",
        imageUrl: "https://images.unsplash.com/photo-1512374382149-233c42b6a83b?auto=format&fit=crop&w=800&q=80",
        verified: true,
        receivedAt: "2026-10-18"
      },
      {
        id: "r-shoe-2",
        name: "Rohit K.",
        rating: 4,
        title: "Good fit",
        comment: "Fit is true to size. I wish the insole was slightly softer.",
        verified: true,
        receivedAt: "2026-09-29"
      }
    ],
    similarSlugs: ["loomline-oxford-shirt", "atlas-straight-denim"]
  },
  {
    id: "p-shirt-001",
    slug: "loomline-oxford-shirt",
    category: "shirts",
    name: "Loomline Oxford Shirt",
    brand: "Loomline",
    shortDescription: "Classic oxford shirt tailored for smart casual and office wear.",
    description:
      "Designed with breathable cotton weave and crisp collar structure. Easy to layer and durable for weekly wear.",
    images: [
      "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80"
    ],
    rating: 4.4,
    reviewCount: 164,
    variants: [
      { id: "v-shirt-m", label: "M / Navy", priceMinor: 229900, compareAtMinor: 279900, inStock: true },
      { id: "v-shirt-l", label: "L / Navy", priceMinor: 229900, compareAtMinor: 279900, inStock: true },
      { id: "v-shirt-xl", label: "XL / White", priceMinor: 229900, compareAtMinor: 279900, inStock: true }
    ],
    highlights: ["100% cotton", "Wrinkle-resistant finish", "Regular fit"],
    specifications: [
      { label: "Fabric", value: "Oxford cotton" },
      { label: "Sleeve", value: "Full sleeve" },
      { label: "Fit", value: "Regular" },
      { label: "Country of Origin", value: "India" }
    ],
    reviews: [
      {
        id: "r-shirt-1",
        name: "Neeraj S.",
        rating: 5,
        title: "Premium look",
        comment: "Stitching and fabric feel better than expected for this price.",
        imageUrl: "https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=800&q=80",
        verified: true,
        receivedAt: "2026-11-02"
      }
    ],
    similarSlugs: ["atlas-straight-denim", "velora-mini-satchel"]
  },
  {
    id: "p-jeans-001",
    slug: "atlas-straight-denim",
    category: "jeans",
    name: "Atlas Straight Denim",
    brand: "Atlas",
    shortDescription: "Straight-fit stretch denim for everyday movement and comfort.",
    description:
      "Crafted with soft stretch cotton blend and clean finishing for daily use. Holds shape and color through repeated washes.",
    images: [
      "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1582552938357-32b906df40cb?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=1200&q=80"
    ],
    rating: 4.5,
    reviewCount: 193,
    variants: [
      { id: "v-jeans-30", label: "30 / Indigo", priceMinor: 259900, compareAtMinor: 319900, inStock: true },
      { id: "v-jeans-32", label: "32 / Indigo", priceMinor: 259900, compareAtMinor: 319900, inStock: true },
      { id: "v-jeans-34", label: "34 / Charcoal", priceMinor: 259900, compareAtMinor: 319900, inStock: true }
    ],
    highlights: ["Stretch comfort fabric", "Color-lock wash", "Mid-rise straight fit"],
    specifications: [
      { label: "Fabric", value: "Cotton 78%, Polyester 20%, Elastane 2%" },
      { label: "Closure", value: "Button + zip" },
      { label: "Pockets", value: "5 pocket styling" },
      { label: "Wash Care", value: "Machine wash cold" }
    ],
    reviews: [
      {
        id: "r-jeans-1",
        name: "Aakash T.",
        rating: 4,
        title: "Nice daily wear",
        comment: "Comfortable for all-day office wear and commute.",
        verified: true,
        receivedAt: "2026-10-21"
      }
    ],
    similarSlugs: ["loomline-oxford-shirt", "stridelab-runner-pro"]
  },
  {
    id: "p-purse-001",
    slug: "velora-mini-satchel",
    category: "purse",
    name: "Velora Mini Satchel",
    brand: "Velora",
    shortDescription: "Structured mini satchel with detachable strap and matte metal accents.",
    description:
      "A compact day-to-evening purse with organized interior, premium vegan leather, and reinforced edges for durability.",
    images: [
      "https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=1200&q=80"
    ],
    rating: 4.7,
    reviewCount: 146,
    variants: [
      { id: "v-purse-tan", label: "Tan", priceMinor: 329900, compareAtMinor: 399900, inStock: true },
      { id: "v-purse-black", label: "Black", priceMinor: 329900, compareAtMinor: 399900, inStock: true }
    ],
    highlights: ["Detachable shoulder strap", "Dual compartment", "Scratch-resistant finish"],
    specifications: [
      { label: "Material", value: "Vegan leather" },
      { label: "Dimensions", value: "23cm x 16cm x 9cm" },
      { label: "Weight", value: "540g" },
      { label: "Closure", value: "Magnetic flap" }
    ],
    reviews: [
      {
        id: "r-purse-1",
        name: "Priya D.",
        rating: 5,
        title: "Looks expensive",
        comment: "Loved the finish and compartments. Looks premium in person.",
        imageUrl: "https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?auto=format&fit=crop&w=800&q=80",
        verified: true,
        receivedAt: "2026-11-10"
      }
    ],
    similarSlugs: ["loomline-oxford-shirt", "stridelab-runner-pro"]
  }
];

export const getMockProductBySlug = (slug: string) => mockProducts.find((product) => product.slug === slug) ?? null;

export const getMockSimilarProducts = (product: MockProduct) =>
  product.similarSlugs
    .map((slug) => getMockProductBySlug(slug))
    .filter((item): item is MockProduct => Boolean(item));
