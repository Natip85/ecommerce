import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const productStatuses = ["draft", "active", "archived"] as const;
export type ProductStatus = (typeof productStatuses)[number];

export const creationStatuses = ["in_progress", "completed"] as const;
export type CreationStatus = (typeof creationStatuses)[number];

// =============================================================================
// CORE TABLES
// =============================================================================

/**
 * Products - Main product entity
 */
export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    title: text("title").notNull(),
    handle: text("handle").notNull().unique(), // shopify-style slug
    description: text("description"),

    vendor: text("vendor"),
    productType: text("product_type"),
    status: text("status").$type<ProductStatus>().notNull().default("draft"),
    creationStatus: text("creation_status")
      .$type<CreationStatus>()
      .notNull()
      .default("in_progress"),

    published: boolean("published").default(false),

    metadata: jsonb("metadata"), // tags, seo, etc

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("products_handle_idx").on(table.handle)]
);

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

/**
 * Product Options - Size, Color, Material, etc.
 */
export const productOptions = pgTable("product_options", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),

  name: text("name").notNull(), // Size, Color
  position: integer("position").notNull(),
});

export type ProductOption = typeof productOptions.$inferSelect;
export type NewProductOption = typeof productOptions.$inferInsert;

/**
 * Product Option Values - Red, Blue, XL, Small, etc.
 */
export const productOptionValues = pgTable("product_option_values", {
  id: uuid("id").defaultRandom().primaryKey(),
  optionId: uuid("option_id")
    .notNull()
    .references(() => productOptions.id, { onDelete: "cascade" }),

  value: text("value").notNull(),
  position: integer("position").notNull(),
});

export type ProductOptionValue = typeof productOptionValues.$inferSelect;
export type NewProductOptionValue = typeof productOptionValues.$inferInsert;

/**
 * Product Variants - The heart of Shopify's model
 * Each variant represents a specific combination of options (e.g., Red/Large)
 */
export const productVariants = pgTable("product_variants", {
  id: uuid("id").defaultRandom().primaryKey(),

  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),

  sku: text("sku").unique(),
  barcode: text("barcode"), // ISBN, UPC, GTIN, etc.
  title: text("title"), // "Red / Large"

  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  compareAtPrice: numeric("compare_at_price", { precision: 10, scale: 2 }),
  chargeTax: boolean("charge_tax").default(true),

  inventoryQuantity: integer("inventory_quantity").default(0),
  inventoryTracked: boolean("inventory_tracked").default(true),
  continueSellingWhenOutOfStock: boolean("continue_selling_when_out_of_stock").default(false),

  // Denormalized for fast storefront reads (Shopify-style)
  // Example: { "Color": "Red", "Size": "Large" }
  optionValues: jsonb("option_values").notNull(),

  position: integer("position").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ProductVariant = typeof productVariants.$inferSelect;
export type NewProductVariant = typeof productVariants.$inferInsert;

/**
 * Product Images - Images for products and variants
 */
export const productImages = pgTable("product_images", {
  id: uuid("id").defaultRandom().primaryKey(),

  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),

  // Optional: directly link to a variant (for variant-specific images)
  variantId: uuid("variant_id").references(() => productVariants.id, {
    onDelete: "set null",
  }),

  url: text("url").notNull(),
  alt: text("alt"),
  position: integer("position").notNull(),
});

export type ProductImage = typeof productImages.$inferSelect;
export type NewProductImage = typeof productImages.$inferInsert;

// =============================================================================
// JOIN TABLES
// =============================================================================

/**
 * Variant Option Values - Join table for variant <-> option value (many-to-many)
 * Used for admin integrity and filtering
 */
export const variantOptionValues = pgTable(
  "variant_option_values",
  {
    variantId: uuid("variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),

    optionValueId: uuid("option_value_id")
      .notNull()
      .references(() => productOptionValues.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.variantId, table.optionValueId] })]
);

export type VariantOptionValue = typeof variantOptionValues.$inferSelect;
export type NewVariantOptionValue = typeof variantOptionValues.$inferInsert;

/**
 * Collections - Product groupings (e.g., "Summer Sale", "New Arrivals")
 */
export const collections = pgTable("collections", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  handle: text("handle").notNull().unique(),
  description: text("description"),
  published: boolean("published").default(false),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export type Collection = typeof collections.$inferSelect;
export type NewCollection = typeof collections.$inferInsert;

/**
 * Product Collections - Join table for product <-> collection (many-to-many)
 */
export const productCollections = pgTable(
  "product_collections",
  {
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),

    collectionId: uuid("collection_id")
      .notNull()
      .references(() => collections.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.productId, table.collectionId] })]
);

export type ProductCollection = typeof productCollections.$inferSelect;
export type NewProductCollection = typeof productCollections.$inferInsert;

/**
 * Tags - Product tags for filtering and organization
 */
export const tags = pgTable("tags", {
  id: uuid("id").defaultRandom().primaryKey(),
  value: text("value").notNull().unique(),
});

export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;

/**
 * Product Tags - Join table for product <-> tag (many-to-many)
 */
export const productTags = pgTable(
  "product_tags",
  {
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),

    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.productId, table.tagId] })]
);

export type ProductTag = typeof productTags.$inferSelect;
export type NewProductTag = typeof productTags.$inferInsert;

/**
 * Variant Images - Join table for variant <-> image (many-to-many)
 * Allows one image to be shared across multiple variants
 */
export const variantImages = pgTable(
  "variant_images",
  {
    variantId: uuid("variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),

    imageId: uuid("image_id")
      .notNull()
      .references(() => productImages.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.variantId, table.imageId] })]
);

export type VariantImage = typeof variantImages.$inferSelect;
export type NewVariantImage = typeof variantImages.$inferInsert;

// =============================================================================
// RELATIONS
// =============================================================================

/**
 * Product Relations
 */
export const productRelations = relations(products, ({ many }) => ({
  variants: many(productVariants),
  options: many(productOptions),
  images: many(productImages),
  productCollections: many(productCollections),
  productTags: many(productTags),
}));

/**
 * Product Option Relations
 */
export const productOptionRelations = relations(productOptions, ({ one, many }) => ({
  product: one(products, {
    fields: [productOptions.productId],
    references: [products.id],
  }),
  values: many(productOptionValues),
}));

/**
 * Product Option Value Relations
 */
export const productOptionValueRelations = relations(productOptionValues, ({ one, many }) => ({
  option: one(productOptions, {
    fields: [productOptionValues.optionId],
    references: [productOptions.id],
  }),
  variantOptionValues: many(variantOptionValues),
}));

/**
 * Product Variant Relations
 */
export const productVariantRelations = relations(productVariants, ({ one, many }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
  images: many(productImages),
  variantOptionValues: many(variantOptionValues),
  variantImages: many(variantImages),
}));

/**
 * Product Image Relations
 */
export const productImageRelations = relations(productImages, ({ one, many }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [productImages.variantId],
    references: [productVariants.id],
  }),
  variantImages: many(variantImages),
}));

/**
 * Variant Option Value Relations (Join Table)
 */
export const variantOptionValueRelations = relations(variantOptionValues, ({ one }) => ({
  variant: one(productVariants, {
    fields: [variantOptionValues.variantId],
    references: [productVariants.id],
  }),
  optionValue: one(productOptionValues, {
    fields: [variantOptionValues.optionValueId],
    references: [productOptionValues.id],
  }),
}));

/**
 * Collection Relations
 */
export const collectionRelations = relations(collections, ({ many }) => ({
  productCollections: many(productCollections),
}));

/**
 * Product Collection Relations (Join Table)
 */
export const productCollectionRelations = relations(productCollections, ({ one }) => ({
  product: one(products, {
    fields: [productCollections.productId],
    references: [products.id],
  }),
  collection: one(collections, {
    fields: [productCollections.collectionId],
    references: [collections.id],
  }),
}));

/**
 * Tag Relations
 */
export const tagRelations = relations(tags, ({ many }) => ({
  productTags: many(productTags),
}));

/**
 * Product Tag Relations (Join Table)
 */
export const productTagRelations = relations(productTags, ({ one }) => ({
  product: one(products, {
    fields: [productTags.productId],
    references: [products.id],
  }),
  tag: one(tags, {
    fields: [productTags.tagId],
    references: [tags.id],
  }),
}));

/**
 * Variant Image Relations (Join Table)
 */
export const variantImageRelations = relations(variantImages, ({ one }) => ({
  variant: one(productVariants, {
    fields: [variantImages.variantId],
    references: [productVariants.id],
  }),
  image: one(productImages, {
    fields: [variantImages.imageId],
    references: [productImages.id],
  }),
}));
