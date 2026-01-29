import { z } from "zod";

// =============================================================================
// FILTER TYPES
// =============================================================================

/**
 * Number range for filtering (price, quantity, etc.)
 */
export const numberRangeSchema = z
  .object({
    from: z.number().optional(),
    to: z.number().optional(),
  })
  .optional();

export type NumberRange = z.infer<typeof numberRangeSchema>;

/**
 * Date range for filtering
 */
export const dateRangeSchema = z
  .object({
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
  })
  .optional();

export type DateRange = z.infer<typeof dateRangeSchema>;

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
export const inventoryStatusSchema = z.enum([
  "in_stock",
  "out_of_stock",
  "low_stock",
]);
export type InventoryStatus = z.infer<typeof inventoryStatusSchema>;

/**
 * Option value filter - for filtering by specific option values
 */
export const optionValueFilterSchema = z.object({
  optionName: z.string(),
  values: z.array(z.string()),
});
export type OptionValueFilter = z.infer<typeof optionValueFilterSchema>;

// =============================================================================
// ADMIN PRODUCT FILTER
// =============================================================================

/**
 * Admin product filter schema
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

  // Option value filters
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
 * Default admin filter values
 */
export const defaultProductFilter: Partial<ProductFilter> = {
  onSale: "all",
  published: "all",
  trackInventory: "all",
  hasSku: "all",
  hasBarcode: "all",
};

// =============================================================================
// STOREFRONT PRODUCT FILTER
// =============================================================================

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
  inStock: undefined,
  onSale: undefined,
};
