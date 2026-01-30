import { z } from "zod/v4";

import { handleSchema, optionalText, priceSchema, PRODUCT_STATUSES } from "./common";

export { PRODUCT_STATUSES } from "./common";

// =============================================================================
// PRODUCT OPTIONS & VARIANTS SCHEMAS
// =============================================================================

/**
 * Product option schema - defines an option like "Size" or "Color"
 */
export const productOptionSchema = z.object({
  id: z.string().uuid().optional(), // UUID if existing option
  name: z
    .string()
    .min(1, "Option name is required")
    .max(255, "Option name must be at most 255 characters"),
  values: z
    .array(z.string().min(1, "Value cannot be empty"))
    .min(1, "At least one value is required"),
});

export type ProductOption = z.infer<typeof productOptionSchema>;

/**
 * Product variant schema - represents a specific combination of options
 */
export const productVariantSchema = z.object({
  id: z.string().uuid().optional(), // UUID if existing variant
  optionValues: z.record(z.string(), z.string()), // { "Size": "S", "Color": "Red" }
  price: priceSchema,
  compareAtPrice: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Invalid price format")
    .optional()
    .or(z.literal("")),
  sku: optionalText(255, "SKU"),
  quantity: z.string().regex(/^\d*$/, "Quantity must be a number"),
});

export type ProductVariant = z.infer<typeof productVariantSchema>;

/**
 * Default variant - used when no options are defined
 */
export const defaultVariant: ProductVariant = {
  optionValues: {},
  price: "",
  compareAtPrice: "",
  sku: "",
  quantity: "0",
};

// =============================================================================
// PRODUCT SCHEMA
// =============================================================================

/**
 * Core product schema - represents the data structure
 */
export const productSchema = z.object({
  // Basic Info
  title: z.string().min(1, "Title is required").max(255, "Title must be at most 255 characters"),
  handle: handleSchema,
  description: optionalText(5000, "Description"),

  // Pricing (for default variant - used when no options defined)
  price: priceSchema,
  compareAtPrice: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Invalid price format")
    .optional()
    .or(z.literal("")),
  chargeTax: z.boolean(),

  // Inventory (for default variant - used when no options defined)
  sku: optionalText(255, "SKU"),
  barcode: optionalText(255, "Barcode"),
  trackQuantity: z.boolean(),
  quantity: z.string().regex(/^\d*$/, "Quantity must be a number"),
  continueSellingWhenOutOfStock: z.boolean(),

  // Options & Variants
  options: z.array(productOptionSchema).optional(),
  variants: z.array(productVariantSchema).optional(),

  // Organization
  productType: optionalText(255, "Product type"),
  vendor: optionalText(255, "Vendor"),
  tags: z.string().optional().or(z.literal("")),
  collections: z.array(z.string()).optional(),

  // Status
  status: z.enum(PRODUCT_STATUSES),

  // Publishing
  published: z.boolean(),

  // SEO
  metaTitle: optionalText(70, "Meta title"),
  metaDescription: optionalText(160, "Meta description"),
});

export type Product = z.infer<typeof productSchema>;

// =============================================================================
// PRODUCT FORM SCHEMA
// =============================================================================

/**
 * Product form schema - used for form validation
 * Can include additional refinements for form-specific logic
 */
export const productFormSchema = productSchema.refine(
  (data) => {
    // If compare-at price is set, it should be greater than price
    if (data.compareAtPrice && data.price) {
      const price = parseFloat(data.price);
      const compareAt = parseFloat(data.compareAtPrice);
      if (!isNaN(price) && !isNaN(compareAt)) {
        return compareAt > price;
      }
    }
    return true;
  },
  {
    message: "Compare-at price must be greater than price",
    path: ["compareAtPrice"],
  }
);

export type ProductForm = z.infer<typeof productFormSchema>;

// =============================================================================
// DEFAULT VALUES
// =============================================================================

/**
 * Full default values - all fields populated
 */
export const defaultProductFull: Required<Product> = {
  title: "",
  handle: "",
  description: "",
  price: "",
  compareAtPrice: "",
  chargeTax: true,
  sku: "",
  barcode: "",
  trackQuantity: true,
  quantity: "0",
  continueSellingWhenOutOfStock: false,
  options: [],
  variants: [],
  productType: "",
  vendor: "",
  tags: "",
  collections: [],
  status: "draft",
  published: false,
  metaTitle: "",
  metaDescription: "",
} as const;

/**
 * Minimal default values - only essential fields
 */
export const defaultProduct: Partial<Product> = {
  status: "draft",
  chargeTax: true,
  trackQuantity: true,
  quantity: "0",
  continueSellingWhenOutOfStock: false,
  published: false,
  options: [],
  variants: [],
} as const;

/**
 * Default form values - used to initialize react-hook-form
 */
export const defaultProductForm: ProductForm = {
  title: "",
  handle: "",
  description: "",
  price: "",
  compareAtPrice: "",
  chargeTax: true,
  sku: "",
  barcode: "",
  trackQuantity: true,
  quantity: "0",
  continueSellingWhenOutOfStock: false,
  options: [],
  variants: [],
  productType: "",
  vendor: "",
  tags: "",
  collections: [],
  status: "draft",
  published: false,
  metaTitle: "",
  metaDescription: "",
} as const;

// =============================================================================
// VARIANT HELPERS
// =============================================================================

/**
 * Generate all variant combinations from options (Cartesian product)
 * Preserves existing variant data when possible
 */
export function generateVariants(
  options: ProductOption[],
  existingVariants: ProductVariant[] = []
): ProductVariant[] {
  if (options.length === 0) {
    // No options = single default variant
    return (
        existingVariants.length > 0 &&
          Object.keys(existingVariants[0]?.optionValues || {}).length === 0
      ) ?
        [existingVariants[0]]
      : [{ ...defaultVariant }];
  }

  // Generate Cartesian product of all option values
  const combinations = options.reduce<Record<string, string>[]>((acc, option) => {
    if (acc.length === 0) {
      return option.values.map((value) => ({ [option.name]: value }));
    }
    return acc.flatMap((combo) =>
      option.values.map((value) => ({ ...combo, [option.name]: value }))
    );
  }, []);

  // Map combinations to variants, preserving existing data where possible
  return combinations.map((optionValues) => {
    // Find existing variant with matching optionValues
    const existingVariant = existingVariants.find((v) =>
      isMatchingOptionValues(v.optionValues, optionValues)
    );

    if (existingVariant) {
      return { ...existingVariant, optionValues };
    }

    return {
      optionValues,
      price: "",
      compareAtPrice: "",
      sku: "",
      quantity: "0",
    };
  });
}

/**
 * Check if two optionValues objects are equivalent
 */
function isMatchingOptionValues(a: Record<string, string>, b: Record<string, string>): boolean {
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  return keysA.every((key) => a[key] === b[key]);
}

/**
 * Generate a title for a variant based on its option values
 * e.g., { "Size": "S", "Color": "Red" } => "S / Red"
 */
export function getVariantTitle(optionValues: Record<string, string>): string {
  const values = Object.values(optionValues);
  return values.length > 0 ? values.join(" / ") : "Default";
}

export const sortOptionSchema = z.object({
  field: z.string(),
  direction: z.enum(["asc", "desc"]),
});

export const sortSchema = z.array(sortOptionSchema);

// =============================================================================
// PRODUCT FILTER SCHEMAS
// =============================================================================

/**
 * Number range schema - for price, quantity, etc.
 */
export const numberRangeSchema = z
  .object({
    from: z.number().optional(),
    to: z.number().optional(),
  })
  .optional()
  .refine(
    (data) => {
      if (data?.from !== undefined && data?.to !== undefined) {
        return data.from <= data.to;
      }
      return true;
    },
    { message: "From must be less than or equal to To" }
  )
  .transform((data) => {
    if (data?.from === undefined && data?.to === undefined) {
      return undefined;
    }
    return data;
  });
export type NumberRange = NonNullable<z.infer<typeof numberRangeSchema>>;

/**
 * Date range schema - for createdAt, updatedAt filters
 */
export const dateRangeSchema = z
  .object({
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
  })
  .optional()
  .transform((data) => {
    if (data?.from === undefined && data?.to === undefined) {
      return undefined;
    }
    return data;
  });
export type DateRange = NonNullable<z.infer<typeof dateRangeSchema>>;

/**
 * Ternary filter - for boolean-like filters with "all" option
 */
export const filterTernarySchema = z.enum(["all", "yes", "no"]);
export type FilterTernary = z.infer<typeof filterTernarySchema>;

/**
 * Product statuses for filtering
 */
export const productStatusFilterSchema = z.enum(["draft", "active", "archived"]);
export type ProductStatusFilter = z.infer<typeof productStatusFilterSchema>;

/**
 * Inventory status for filtering
 */
export const inventoryStatusSchema = z.enum(["in_stock", "out_of_stock", "low_stock"]);
export type InventoryStatus = z.infer<typeof inventoryStatusSchema>;

/**
 * Option value filter - for filtering by specific option values (e.g., Color: Red)
 */
export const optionValueFilterSchema = z.object({
  optionName: z.string(), // e.g., "Color", "Size"
  values: z.array(z.string()), // e.g., ["Red", "Blue"]
});
export type OptionValueFilter = z.infer<typeof optionValueFilterSchema>;

/**
 * Main product filter schema
 */
export const productFilterSchema = z.object({
  // Search
  search: z.string().optional(),

  // Price filters (based on variant prices)
  price: numberRangeSchema,
  compareAtPrice: numberRangeSchema,
  onSale: filterTernarySchema.default("all").optional(),

  // Status filters
  status: z.array(productStatusFilterSchema).optional(),
  published: filterTernarySchema.default("all").optional(),

  // Organization filters
  vendors: z.array(z.string()).optional(),
  productTypes: z.array(z.string()).optional(),

  // Collection & Tag filters
  collectionIds: z.array(z.string().uuid()).optional(),
  tagIds: z.array(z.string().uuid()).optional(),
  excludedTagIds: z.array(z.string().uuid()).optional(),

  // Option value filters (dynamic - Color, Size, Material, etc.)
  optionFilters: z.array(optionValueFilterSchema).optional(),

  // Inventory filters
  inventoryStatus: z.array(inventoryStatusSchema).optional(),
  inventoryQuantity: numberRangeSchema,
  trackInventory: filterTernarySchema.default("all").optional(),

  // SKU/Barcode filters
  hasSku: filterTernarySchema.default("all").optional(),
  hasBarcode: filterTernarySchema.default("all").optional(),

  // Date filters
  createdAt: dateRangeSchema,
  updatedAt: dateRangeSchema,

  // Exclusions
  excludedProductIds: z.array(z.string().uuid()).optional(),
});

export type ProductFilter = z.infer<typeof productFilterSchema>;

/**
 * Default filter values
 */
export const defaultProductFilter: Partial<ProductFilter> = {
  onSale: "all",
  published: "all",
  trackInventory: "all",
  hasSku: "all",
  hasBarcode: "all",
};

/**
 * Storefront filter schema - simplified for customer-facing filters
 */
export const storefrontFilterSchema = z.object({
  // Search
  search: z.string().optional(),

  // Price
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  onSale: z.coerce.boolean().optional(),

  // Organization
  vendors: z.array(z.string()).optional(),
  productTypes: z.array(z.string()).optional(),

  // Collections & Tags
  collectionIds: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),

  // Options (dynamic - for faceted filtering)
  colors: z.array(z.string()).optional(),
  sizes: z.array(z.string()).optional(),
  materials: z.array(z.string()).optional(),

  // Generic option filters (for dynamic options like Color, Size, Material, etc.)
  optionFilters: z.array(optionValueFilterSchema).optional(),

  // Availability
  inStock: z.coerce.boolean().optional(),
});

export type StorefrontFilter = z.infer<typeof storefrontFilterSchema>;

/**
 * Default storefront filter values
 */
export const defaultStorefrontFilter: Partial<StorefrontFilter> = {
  inStock: undefined, // Show all by default
  onSale: undefined,
};
