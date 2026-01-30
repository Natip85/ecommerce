import type { SQL } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, gte, ilike, inArray, lte, or, sql } from "drizzle-orm";
import { getTableColumns } from "drizzle-orm/utils";

import { products } from "@ecommerce/db/schema/product";

import type { OptionValueFilter, ProductFilter, StorefrontFilter } from "./product-filter-types";

// =============================================================================
// TYPES
// =============================================================================

export type SortInput = {
  field: string;
  direction: "asc" | "desc";
}[];

export type BuildProductWhereConditionsOptions = {
  filter?: ProductFilter | null;
  searchQuery?: string;
  additionalConditions?: SQL[];
};

export type BuildStorefrontWhereConditionsOptions = {
  filter?: StorefrontFilter | null;
  searchQuery?: string;
  additionalConditions?: SQL[];
};

export type BuildProductOrderByOptions = {
  sort: SortInput;
  fuzzyOrderBy?: SQL;
  defaultSort?: SQL;
  allowedColumns?: readonly string[];
};

export type WhereConditionsResult = {
  whereConditions: SQL[];
  fuzzyOrderBy?: SQL;
};

// Get product columns for validation
const productColumns = getTableColumns(products);

// Columns that can be sorted on the products table
const PRODUCT_TABLE_COLUMNS = Object.keys(productColumns).filter(
  (col) =>
    // Exclude JSON and complex fields that shouldn't be sorted
    !["metadata"].includes(col)
) as (keyof typeof productColumns)[];

// Special sort fields that require subquery-based sorting (not direct column sorts)
// These are handled separately in buildProductOrderBy
const SPECIAL_SORTABLE_FIELDS = ["price"] as const;

// Combined list of all sortable fields (table columns + special fields)
export const PRODUCT_SORTABLE_COLUMNS = [
  ...PRODUCT_TABLE_COLUMNS,
  ...SPECIAL_SORTABLE_FIELDS,
] as const;

export type ProductSortableColumn = (typeof PRODUCT_SORTABLE_COLUMNS)[number];

// =============================================================================
// FUZZY SEARCH UTILITY
// =============================================================================

/**
 * Builds fuzzy search SQL for a text column.
 * Returns both the where condition and the order by for relevance ranking.
 */
export function buildFuzzySearchSql(
  column: typeof products.title,
  searchQuery?: string
): { fuzzyWhere?: SQL; fuzzyOrderBy?: SQL } {
  if (!searchQuery?.trim()) {
    return {};
  }

  const trimmed = searchQuery.trim();
  const searchTerm = `%${trimmed}%`;

  const fuzzyWhere = or(
    ilike(products.title, searchTerm),
    ilike(products.handle, searchTerm),
    ilike(products.vendor, searchTerm),
    ilike(products.productType, searchTerm)
  );

  // Fuzzy relevance scoring - exact match > starts with > contains
  const fuzzyOrderBy = sql`CASE 
    WHEN LOWER(${column}) = LOWER(${trimmed}) THEN 0
    WHEN LOWER(${column}) LIKE LOWER(${trimmed + "%"}) THEN 1
    WHEN LOWER(${column}) LIKE LOWER(${"%" + trimmed + "%"}) THEN 2
    ELSE 3
  END`;

  return { fuzzyWhere, fuzzyOrderBy };
}

// =============================================================================
// WHERE CONDITION BUILDERS
// =============================================================================

/**
 * Builds product where conditions including filters, fuzzy search, and optional additional conditions.
 * Returns the where conditions array (to be used with and(...)) and the fuzzy order by (if applicable).
 */
export const buildProductWhereConditions = ({
  filter,
  searchQuery,
  additionalConditions = [],
}: BuildProductWhereConditionsOptions): WhereConditionsResult => {
  const whereConditions: SQL[] = [...additionalConditions];

  // Add fuzzy search on product title
  const { fuzzyWhere, fuzzyOrderBy } = buildFuzzySearchSql(products.title, searchQuery);
  if (fuzzyWhere) {
    whereConditions.push(fuzzyWhere);
  }

  if (!filter) {
    return { whereConditions, fuzzyOrderBy };
  }

  // Text search from filter (in addition to q param)
  if (filter.search?.trim()) {
    const searchTerm = `%${filter.search.trim()}%`;
    whereConditions.push(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      or(
        ilike(products.title, searchTerm),
        ilike(products.handle, searchTerm),
        ilike(products.vendor, searchTerm),
        ilike(products.productType, searchTerm)
      )!
    );
  }

  // Status filter
  if (filter.status && filter.status.length > 0) {
    whereConditions.push(inArray(products.status, filter.status));
  }

  // Published filter
  if (filter.published && filter.published !== "all") {
    whereConditions.push(eq(products.published, filter.published === "yes"));
  }

  // Vendor filter
  if (filter.vendors && filter.vendors.length > 0) {
    whereConditions.push(inArray(products.vendor, filter.vendors));
  }

  // Product type filter
  if (filter.productTypes && filter.productTypes.length > 0) {
    whereConditions.push(inArray(products.productType, filter.productTypes));
  }

  // Date range filters
  if (filter.createdAt?.from) {
    whereConditions.push(gte(products.createdAt, filter.createdAt.from));
  }
  if (filter.createdAt?.to) {
    whereConditions.push(lte(products.createdAt, filter.createdAt.to));
  }
  if (filter.updatedAt?.from) {
    whereConditions.push(gte(products.updatedAt, filter.updatedAt.from));
  }
  if (filter.updatedAt?.to) {
    whereConditions.push(lte(products.updatedAt, filter.updatedAt.to));
  }

  // Excluded product IDs
  if (filter.excludedProductIds && filter.excludedProductIds.length > 0) {
    whereConditions.push(
      sql`${products.id} NOT IN (${sql.join(
        filter.excludedProductIds.map((id: string) => sql`${id}`),
        sql`, `
      )})`
    );
  }

  return { whereConditions, fuzzyOrderBy };
};

/**
 * Builds storefront where conditions including filters, fuzzy search, and optional additional conditions.
 * Automatically enforces published=true and status=active for storefront queries.
 * Returns the where conditions array (to be used with and(...)) and the fuzzy order by (if applicable).
 */
export const buildStorefrontWhereConditions = ({
  filter,
  searchQuery,
  additionalConditions = [],
}: BuildStorefrontWhereConditionsOptions): WhereConditionsResult => {
  const whereConditions: SQL[] = [...additionalConditions];

  // Only show published, active products on storefront
  whereConditions.push(eq(products.published, true));
  whereConditions.push(eq(products.status, "active"));

  // Add fuzzy search on product title
  const { fuzzyWhere, fuzzyOrderBy } = buildFuzzySearchSql(products.title, searchQuery);
  if (fuzzyWhere) {
    whereConditions.push(fuzzyWhere);
  }

  if (!filter) {
    return { whereConditions, fuzzyOrderBy };
  }

  // Text search from filter (in addition to q param)
  if (filter.search?.trim()) {
    const searchTerm = `%${filter.search.trim()}%`;
    whereConditions.push(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      or(ilike(products.title, searchTerm), ilike(products.handle, searchTerm))!
    );
  }

  // Vendor filter
  if (filter.vendors && filter.vendors.length > 0) {
    whereConditions.push(inArray(products.vendor, filter.vendors));
  }

  // Product type filter
  if (filter.productTypes && filter.productTypes.length > 0) {
    whereConditions.push(inArray(products.productType, filter.productTypes));
  }

  return { whereConditions, fuzzyOrderBy };
};

// =============================================================================
// ORDER BY BUILDER
// =============================================================================

/**
 * Build a subquery-based ORDER BY for price sorting.
 * Uses the minimum price from product variants for each product.
 */
function buildPriceSortSql(direction: "asc" | "desc"): SQL {
  // Subquery to get minimum variant price for sorting
  // Using raw SQL to avoid issues with drizzle template interpolation in subqueries
  const priceSubquery = sql.raw(`(
    SELECT MIN(CAST("product_variants"."price" AS DECIMAL))
    FROM "product_variants"
    WHERE "product_variants"."product_id" = "products"."id"
  )`);

  return direction === "desc" ? desc(priceSubquery) : asc(priceSubquery);
}

/**
 * Builds product order by clause with column validation, fuzzy ordering, and default sort.
 * Validates that sort fields exist in the products table or are special sort fields (like price).
 * Throws TRPCError if an invalid sort field is provided.
 */
export const buildProductOrderBy = ({
  sort,
  fuzzyOrderBy,
  defaultSort = desc(products.createdAt),
  allowedColumns,
}: BuildProductOrderByOptions) => {
  // Use allowedColumns if provided, otherwise use all product columns (except metadata)
  const validColumns = allowedColumns ? new Set(allowedColumns) : new Set(PRODUCT_SORTABLE_COLUMNS);

  // Special sort fields that require subquery-based sorting
  const specialFields = new Set<string>(SPECIAL_SORTABLE_FIELDS);

  const orderBy = sort
    .filter((s) => s.field !== "")
    .map((s) => {
      // Check if it's a special sort field (price, etc.) - handle separately
      if (specialFields.has(s.field)) {
        if (s.field === "price") {
          return buildPriceSortSql(s.direction);
        }
        // Unknown special field - shouldn't happen but skip it
        return null;
      }

      const columnName = s.field as keyof typeof productColumns;

      // Validate column exists and is allowed
      if (!validColumns.has(s.field)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Invalid sort field: ${columnName}`,
        });
      }

      const sortColumn = productColumns[columnName];
      return s.direction === "desc" ? desc(sortColumn) : asc(sortColumn);
    })
    .filter((item): item is SQL => item !== null);

  // Add default sort if no sort specified
  if (orderBy.length === 0 && defaultSort) {
    orderBy.push(defaultSort);
  }

  // Add fuzzy order by if provided (from buildProductWhereConditions)
  if (fuzzyOrderBy) {
    orderBy.unshift(fuzzyOrderBy);
  }

  return orderBy;
};

// =============================================================================
// SUBQUERY BUILDERS FOR RELATED DATA
// =============================================================================

/**
 * Build subquery to filter products by tag IDs
 */
export function buildTagFilterSubquery(tagIds: string[]) {
  // Use raw SQL to avoid Drizzle column reference issues in subqueries
  const escapedIds = tagIds.map((id) => `'${id.replace(/'/g, "''")}'`).join(", ");

  return sql.raw(`EXISTS (
    SELECT 1 FROM "product_tags"
    WHERE "product_tags"."product_id" = "products"."id"
    AND "product_tags"."tag_id" IN (${escapedIds})
  )`);
}

/**
 * Build subquery to filter products by collection IDs
 */
export function buildCollectionFilterSubquery(collectionIds: string[]) {
  // Use raw SQL to avoid Drizzle column reference issues in subqueries
  const escapedIds = collectionIds.map((id) => `'${id.replace(/'/g, "''")}'`).join(", ");

  return sql.raw(`EXISTS (
    SELECT 1 FROM "product_collections"
    WHERE "product_collections"."product_id" = "products"."id"
    AND "product_collections"."collection_id" IN (${escapedIds})
  )`);
}

/**
 * Build subquery to filter products by tag values (for storefront)
 */
export function buildTagValueFilterSubquery(tagValues: string[]) {
  // Use raw SQL to avoid Drizzle column reference issues in subqueries
  const escapedValues = tagValues.map((v) => `'${v.toLowerCase().replace(/'/g, "''")}'`).join(", ");

  return sql.raw(`EXISTS (
    SELECT 1 FROM "product_tags"
    INNER JOIN "tags" ON "tags"."id" = "product_tags"."tag_id"
    WHERE "product_tags"."product_id" = "products"."id"
    AND "tags"."value" IN (${escapedValues})
  )`);
}

/**
 * Build subquery to filter products by price range (checks variants)
 */
export function buildPriceRangeSubquery(minPrice?: number, maxPrice?: number) {
  const conditions: string[] = [];

  if (minPrice !== undefined) {
    conditions.push(`CAST("product_variants"."price" AS DECIMAL) >= ${minPrice}`);
  }
  if (maxPrice !== undefined) {
    conditions.push(`CAST("product_variants"."price" AS DECIMAL) <= ${maxPrice}`);
  }

  if (conditions.length === 0) return null;

  return sql.raw(`EXISTS (
    SELECT 1 FROM "product_variants"
    WHERE "product_variants"."product_id" = "products"."id"
    AND ${conditions.join(" AND ")}
  )`);
}

/**
 * Build subquery to filter products on sale (compareAtPrice > price)
 */
export function buildOnSaleSubquery() {
  return sql.raw(`EXISTS (
    SELECT 1 FROM "product_variants"
    WHERE "product_variants"."product_id" = "products"."id"
    AND "product_variants"."compare_at_price" IS NOT NULL
    AND CAST("product_variants"."compare_at_price" AS DECIMAL) > CAST("product_variants"."price" AS DECIMAL)
  )`);
}

/**
 * Build subquery to filter products in stock
 */
export function buildInStockSubquery() {
  return sql.raw(`EXISTS (
    SELECT 1 FROM "product_variants"
    WHERE "product_variants"."product_id" = "products"."id"
    AND (
      "product_variants"."inventory_tracked" = false
      OR "product_variants"."inventory_quantity" > 0
      OR "product_variants"."continue_selling_when_out_of_stock" = true
    )
  )`);
}

/**
 * Build subquery to filter products by option values
 * For each option filter, checks if product has a variant with matching option values
 * Multiple values for the same option are OR'd, multiple options are AND'd
 */
export function buildOptionFilterSubquery(optionFilters: OptionValueFilter[]) {
  if (!optionFilters || optionFilters.length === 0) {
    return null;
  }

  // For each option filter, build a subquery that checks if the product has a variant
  // with any of the specified values for that option
  const conditions = optionFilters.map((filter) => {
    // Escape values for safe SQL injection
    const escapedValues = filter.values.map((v) => `'${v.replace(/'/g, "''")}'`).join(", ");
    const escapedOptionName = filter.optionName.replace(/'/g, "''");

    return sql.raw(`EXISTS (
      SELECT 1 FROM "product_variants" pv
      INNER JOIN "variant_option_values" vov ON vov."variant_id" = pv."id"
      INNER JOIN "product_option_values" pov ON pov."id" = vov."option_value_id"
      INNER JOIN "product_options" po ON po."id" = pov."option_id"
      WHERE pv."product_id" = "products"."id"
      AND po."name" = '${escapedOptionName}'
      AND pov."value" IN (${escapedValues})
    )`);
  });

  // AND all option conditions together
  if (conditions.length === 1) {
    return conditions[0];
  }

  return and(...conditions);
}
