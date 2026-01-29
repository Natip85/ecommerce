/**
 * Client-safe exports - only zod schemas and types, no server dependencies
 * Use this entry point for client components
 */

// List input utilities
export {
  createBasicListInput,
  createListInput,
  viewModes,
  sortDirectionSchema,
  type ViewMode,
  type BasicListInput,
  type ListInput,
} from "./lib/list-input";

// Product filter schemas and types
export {
  productFilterSchema,
  storefrontFilterSchema,
  numberRangeSchema,
  dateRangeSchema,
  filterTernarySchema,
  productStatusFilterSchema,
  inventoryStatusSchema,
  optionValueFilterSchema,
  defaultProductFilter,
  defaultStorefrontFilter,
  type ProductFilter,
  type StorefrontFilter,
  type NumberRange,
  type DateRange,
  type FilterTernary,
  type ProductStatusFilter,
  type InventoryStatus,
  type OptionValueFilter,
} from "./lib/product-filter-types";
