import { TRPCError } from "@trpc/server";
import { and, count as drizzleCount, eq, ilike, or } from "drizzle-orm";
import { z } from "zod";

import { db } from "@ecommerce/db";
import {
  collections,
  productCollections,
  productImages,
  productOptions,
  productOptionValues,
  products,
  productTags,
  productVariants,
  tags,
  variantOptionValues,
} from "@ecommerce/db/schema/product";

import { createListInput } from "../lib/list-input";
import { productFilterSchema, storefrontFilterSchema } from "../lib/product-filter-types";
import {
  buildCollectionFilterSubquery,
  buildInStockSubquery,
  buildOnSaleSubquery,
  buildOptionFilterSubquery,
  buildPriceRangeSubquery,
  buildProductOrderBy,
  buildProductWhereConditions,
  buildStorefrontWhereConditions,
  buildTagFilterSubquery,
  buildTagValueFilterSubquery,
  PRODUCT_SORTABLE_COLUMNS,
} from "../lib/product-query-builder";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

// =============================================================================
// SCHEMAS
// =============================================================================

export const createProductSchema = z.object({
  title: z.string().min(1).optional(),
});

// Product option schema for API
const productOptionInputSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  values: z.array(z.string().min(1)),
});

// Product variant schema for API
const productVariantInputSchema = z.object({
  id: z.string().uuid().optional(),
  optionValues: z.record(z.string(), z.string()),
  price: z.string(),
  compareAtPrice: z.string().optional(),
  sku: z.string().optional(),
  quantity: z.number(),
});

export const updateProductSchema = z.object({
  productId: z.string().uuid(),
  title: z.string().min(1).optional(),
  handle: z.string().min(1).optional(),
  description: z.string().optional(),
  vendor: z.string().optional(),
  productType: z.string().optional(),
  status: z.enum(["draft", "active", "archived"]).optional(),
  creationStatus: z.enum(["in_progress", "completed"]).optional(),
  published: z.boolean().optional(),
  tags: z.array(z.string()).optional(), // Array of tag values
  collections: z.array(z.string().uuid()).optional(), // Array of collection IDs
  metadata: z
    .object({
      metaTitle: z.string().optional(),
      metaDescription: z.string().optional(),
    })
    .optional(),
  // Product options (Size, Color, etc.)
  options: z.array(productOptionInputSchema).optional(),
  // Product variants (when options are defined)
  variants: z.array(productVariantInputSchema).optional(),
  // Variant fields (for default variant when no options exist)
  variant: z
    .object({
      price: z.string().optional(),
      compareAtPrice: z.string().optional(),
      sku: z.string().optional(),
      barcode: z.string().optional(),
      inventoryQuantity: z.number().optional(),
      inventoryTracked: z.boolean().optional(),
      chargeTax: z.boolean().optional(),
      continueSellingWhenOutOfStock: z.boolean().optional(),
    })
    .optional(),
});

export const insertProductImageSchema = z.object({
  productId: z.string().uuid(),
  url: z.string().url(),
  alt: z.string().optional(),
  position: z.number().int().positive().optional(),
});

// =============================================================================
// SERVICE FUNCTIONS (can be called directly from server-side code)
// =============================================================================

/**
 * Insert a product image into the database
 * Can be called directly from uploadthing or via tRPC
 */
export async function insertProductImage(input: z.infer<typeof insertProductImageSchema>) {
  // If no position provided, get the next position
  const getPosition = async (): Promise<number> => {
    if (input.position !== undefined) {
      return input.position;
    }
    const [result] = await db
      .select({ count: drizzleCount() })
      .from(productImages)
      .where(eq(productImages.productId, input.productId));
    return (result?.count ?? 0) + 1;
  };

  const position = await getPosition();

  const [insertedImage] = await db
    .insert(productImages)
    .values({
      productId: input.productId,
      url: input.url,
      alt: input.alt,
      position,
    })
    .returning();

  if (!insertedImage) {
    throw new Error("Failed to insert product image");
  }

  return insertedImage;
}

// =============================================================================
// TRPC ROUTER
// =============================================================================

export const productRouter = createTRPCRouter({
  /**
   * Add an image to a product
   */
  addImage: protectedProcedure.input(insertProductImageSchema).mutation(async ({ ctx, input }) => {
    // Check if user is admin
    if (ctx.session.user.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Admin access required",
      });
    }

    return insertProductImage(input);
  }),

  /**
   * Get all images for a product
   */
  getImages: protectedProcedure
    .input(z.object({ productId: z.string().uuid() }))
    .query(async ({ input }) => {
      const images = await db
        .select()
        .from(productImages)
        .where(eq(productImages.productId, input.productId))
        .orderBy(productImages.position);

      return images;
    }),

  /**
   * Delete a product image
   */
  deleteImage: protectedProcedure
    .input(z.object({ imageId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin
      if (ctx.session.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      const [deleted] = await db
        .delete(productImages)
        .where(eq(productImages.id, input.imageId))
        .returning();

      if (!deleted) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Image not found",
        });
      }

      return deleted;
    }),

  // ===========================================================================
  // PRODUCT CRUD
  // ===========================================================================

  /**
   * Create a new draft product with default variant
   */
  create: protectedProcedure.input(createProductSchema).mutation(async ({ ctx, input }) => {
    if (ctx.session.user.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Admin access required",
      });
    }

    const title = input.title ?? "Untitled product";
    const handle = `untitled-product-${Date.now()}`;

    const [product] = await db
      .insert(products)
      .values({
        title,
        handle,
        status: "draft",
        creationStatus: "in_progress",
      })
      .returning();

    if (!product) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create product",
      });
    }

    // Create default variant
    await db.insert(productVariants).values({
      productId: product.id,
      title: "Default Title",
      price: "0",
      optionValues: {},
      position: 1,
    });

    return product;
  }),

  /**
   * Get a product by ID with all related data
   */
  getById: protectedProcedure
    .input(z.object({ productId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      const product = await db.query.products.findFirst({
        where: (products, { eq }) => eq(products.id, input.productId),
        with: {
          images: {
            orderBy: (images, { asc }) => [asc(images.position)],
          },
          variants: {
            orderBy: (variants, { asc }) => [asc(variants.position)],
          },
          options: {
            orderBy: (options, { asc }) => [asc(options.position)],
            with: {
              values: {
                orderBy: (values, { asc }) => [asc(values.position)],
              },
            },
          },
          productTags: {
            with: {
              tag: true,
            },
          },
          productCollections: {
            with: {
              collection: true,
            },
          },
        },
      });

      if (!product) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }

      // Transform tags to simple string array
      const tagValues = product.productTags.map((pt) => pt.tag.value);

      // Transform collections to ID array
      const collectionIds = product.productCollections.map((pc) => pc.collection.id);

      // Transform options to expected format
      const options = product.options.map((option) => ({
        id: option.id,
        name: option.name,
        values: option.values.map((v) => v.value),
      }));

      // Transform variants to form format
      const variants = product.variants.map((v) => ({
        id: v.id,
        optionValues: (v.optionValues as Record<string, string>) || {},
        price: v.price || "",
        compareAtPrice: v.compareAtPrice ?? "",
        sku: v.sku ?? "",
        quantity: String(v.inventoryQuantity ?? 0),
      }));

      // Get default variant (first variant, or create if missing)
      let defaultVariant = product.variants[0];

      // If no variant exists (old product), create one
      if (!defaultVariant) {
        const [newVariant] = await db
          .insert(productVariants)
          .values({
            productId: input.productId,
            title: "Default Title",
            price: "0",
            optionValues: {},
            position: 1,
          })
          .returning();
        defaultVariant = newVariant;
      }

      return {
        ...product,
        images: product.images,
        tags: tagValues,
        collections: collectionIds,
        options,
        variants,
        defaultVariant,
        // Remove join table intermediates from spread
        productTags: undefined,
        productCollections: undefined,
      };
    }),

  /**
   * Update a product
   */
  update: protectedProcedure.input(updateProductSchema).mutation(async ({ ctx, input }) => {
    if (ctx.session.user.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Admin access required",
      });
    }

    const {
      productId,
      metadata,
      tags: tagValues,
      collections: collectionIds,
      options: optionsData,
      variants: variantsData,
      variant: variantData,
      ...updateData
    } = input;

    // Remove undefined values from top-level fields
    const cleanedData: Record<string, unknown> = Object.fromEntries(
      Object.entries(updateData).filter(([, v]) => v !== undefined)
    );

    // Handle metadata separately - only include if it has actual values
    if (metadata) {
      const cleanedMetadata = Object.fromEntries(
        Object.entries(metadata).filter(([, v]) => v !== undefined)
      );
      // Only add metadata if it has at least one value
      if (Object.keys(cleanedMetadata).length > 0) {
        cleanedData.metadata = cleanedMetadata;
      }
    }

    // Handle tags if provided
    if (tagValues !== undefined) {
      // Delete existing product tags
      await db.delete(productTags).where(eq(productTags.productId, productId));

      // If there are new tags to add
      if (tagValues.length > 0) {
        // Filter out empty strings
        const validTagValues = tagValues.filter((v) => v.trim().length > 0);

        if (validTagValues.length > 0) {
          // Upsert tags (create if they don't exist)
          const tagRecords = await Promise.all(
            validTagValues.map(async (value) => {
              const normalizedValue = value.trim().toLowerCase();

              // Check if tag exists
              const [existingTag] = await db
                .select()
                .from(tags)
                .where(eq(tags.value, normalizedValue));

              if (existingTag) {
                return existingTag;
              }

              // Create new tag
              const [newTag] = await db.insert(tags).values({ value: normalizedValue }).returning();

              return newTag;
            })
          );

          // Create product-tag associations (filter out any undefined tags)
          const validTagRecords = tagRecords.filter(
            (tag): tag is NonNullable<typeof tag> => tag !== undefined
          );

          if (validTagRecords.length > 0) {
            await db.insert(productTags).values(
              validTagRecords.map((tag) => ({
                productId,
                tagId: tag.id,
              }))
            );
          }
        }
      }
    }

    // Handle collections if provided
    if (collectionIds !== undefined) {
      // Delete existing product collections
      await db.delete(productCollections).where(eq(productCollections.productId, productId));

      // If there are collections to add
      if (collectionIds.length > 0) {
        await db.insert(productCollections).values(
          collectionIds.map((collectionId) => ({
            productId,
            collectionId,
          }))
        );
      }
    }

    // Handle options and variants if provided
    if (optionsData !== undefined) {
      // Delete existing options (cascades to option values and variant option values)
      await db.delete(productOptions).where(eq(productOptions.productId, productId));

      // Create option name to ID mapping for variants
      const optionNameToId: Record<string, string> = {};
      const optionValueToId: Record<string, Record<string, string>> = {};

      // Create new options and their values
      for (let i = 0; i < optionsData.length; i++) {
        const option = optionsData[i];
        if (!option) continue;

        // Create the option
        const [createdOption] = await db
          .insert(productOptions)
          .values({
            productId,
            name: option.name,
            position: i + 1,
          })
          .returning();

        if (createdOption) {
          optionNameToId[option.name] = createdOption.id;
          optionValueToId[option.name] = {};

          // Create option values
          for (let j = 0; j < option.values.length; j++) {
            const value = option.values[j];
            if (!value) continue;

            const [createdValue] = await db
              .insert(productOptionValues)
              .values({
                optionId: createdOption.id,
                value,
                position: j + 1,
              })
              .returning();

            if (createdValue) {
              const optionValuesMap = optionValueToId[option.name];
              if (optionValuesMap) {
                optionValuesMap[value] = createdValue.id;
              }
            }
          }
        }
      }

      // Handle variants if provided along with options
      if (variantsData !== undefined && variantsData.length > 0) {
        // Delete existing variants
        await db.delete(productVariants).where(eq(productVariants.productId, productId));

        // Create new variants
        for (let i = 0; i < variantsData.length; i++) {
          const variant = variantsData[i];
          if (!variant) continue;

          // Generate variant title from option values
          const title = Object.values(variant.optionValues).join(" / ") || "Default";

          const [createdVariant] = await db
            .insert(productVariants)
            .values({
              productId,
              title,
              price: variant.price || "0",
              compareAtPrice: variant.compareAtPrice ?? null,
              sku: variant.sku ?? null,
              inventoryQuantity: variant.quantity || 0,
              optionValues: variant.optionValues,
              position: i + 1,
            })
            .returning();

          // Create variant-option-value associations
          if (createdVariant) {
            for (const [optionName, optionValue] of Object.entries(variant.optionValues)) {
              const optionValueId = optionValueToId[optionName]?.[optionValue];
              if (optionValueId) {
                await db.insert(variantOptionValues).values({
                  variantId: createdVariant.id,
                  optionValueId,
                });
              }
            }
          }
        }
      } else if (optionsData.length === 0 || !optionsData.some((o) => o.values.length > 0)) {
        // No options or no values = ensure default variant exists
        const existingVariants = await db
          .select()
          .from(productVariants)
          .where(eq(productVariants.productId, productId));

        if (existingVariants.length === 0) {
          await db.insert(productVariants).values({
            productId,
            title: "Default Title",
            price: "0",
            optionValues: {},
            position: 1,
          });
        }
      }
    }

    // Handle default variant fields if provided (when no options exist)
    if (variantData && !variantsData) {
      // Get the default variant
      let [defaultVariant] = await db
        .select()
        .from(productVariants)
        .where(eq(productVariants.productId, productId))
        .orderBy(productVariants.position)
        .limit(1);

      // Create default variant if it doesn't exist
      if (!defaultVariant) {
        [defaultVariant] = await db
          .insert(productVariants)
          .values({
            productId,
            title: "Default Title",
            price: variantData.price ?? "0",
            optionValues: {},
            position: 1,
          })
          .returning();
      }

      // Build variant update data
      const variantUpdateData: Record<string, unknown> = {};
      if (variantData.price !== undefined) {
        variantUpdateData.price = variantData.price;
      }
      if (variantData.compareAtPrice !== undefined) {
        variantUpdateData.compareAtPrice = variantData.compareAtPrice || null;
      }
      if (variantData.sku !== undefined) {
        variantUpdateData.sku = variantData.sku || null;
      }
      if (variantData.barcode !== undefined) {
        variantUpdateData.barcode = variantData.barcode || null;
      }
      if (variantData.inventoryQuantity !== undefined) {
        variantUpdateData.inventoryQuantity = variantData.inventoryQuantity;
      }
      if (variantData.inventoryTracked !== undefined) {
        variantUpdateData.inventoryTracked = variantData.inventoryTracked;
      }
      if (variantData.chargeTax !== undefined) {
        variantUpdateData.chargeTax = variantData.chargeTax;
      }
      if (variantData.continueSellingWhenOutOfStock !== undefined) {
        variantUpdateData.continueSellingWhenOutOfStock = variantData.continueSellingWhenOutOfStock;
      }

      // Update variant if there are fields to update
      if (Object.keys(variantUpdateData).length > 0 && defaultVariant) {
        await db
          .update(productVariants)
          .set(variantUpdateData)
          .where(eq(productVariants.id, defaultVariant.id));
      }
    }

    // Only update product if there are fields to update
    if (Object.keys(cleanedData).length > 0) {
      const [updated] = await db
        .update(products)
        .set(cleanedData)
        .where(eq(products.id, productId))
        .returning();

      if (!updated) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }

      return updated;
    }

    // If only tags were updated, fetch and return the product
    const [product] = await db.select().from(products).where(eq(products.id, productId));

    if (!product) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Product not found",
      });
    }

    return product;
  }),

  /**
   * Delete a product
   */
  delete: protectedProcedure
    .input(z.object({ productId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      // Check if product exists
      const existing = await db.query.products.findFirst({
        where: eq(products.id, input.productId),
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }

      // Delete product (related data will be deleted via cascade)
      await db.delete(products).where(eq(products.id, input.productId));

      return { success: true };
    }),

  /**
   * Delete multiple products
   */
  deleteMany: protectedProcedure
    .input(z.object({ productIds: z.array(z.string().uuid()) }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      for (const productId of input.productIds) {
        await db.delete(products).where(eq(products.id, productId));
      }

      return { success: true, count: input.productIds.length };
    }),

  /**
   * Get the latest incomplete product (for resuming product creation)
   */
  getIncompleteProduct: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.session.user.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Admin access required",
      });
    }

    const incomplete = await db.query.products.findFirst({
      where: (products, { eq }) => eq(products.creationStatus, "in_progress"),
      orderBy: (products, { desc }) => [desc(products.createdAt)],
      with: {
        variants: {
          orderBy: (variants, { asc }) => [asc(variants.position)],
        },
        images: {
          orderBy: (images, { asc }) => [asc(images.position)],
        },
      },
    });

    return incomplete ?? null;
  }),

  /**
   * List all products with related data (admin - with pagination, filtering, sorting)
   */
  list: protectedProcedure
    .input(createListInput(PRODUCT_SORTABLE_COLUMNS, productFilterSchema))
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      const offset = (input.page - 1) * input.limit;

      try {
        // Build additional conditions for related data filters
        const additionalConditions = [];

        // Tag filter
        if (input.filter?.tagIds && input.filter.tagIds.length > 0) {
          additionalConditions.push(buildTagFilterSubquery(input.filter.tagIds));
        }

        // Excluded tag filter
        if (input.filter?.excludedTagIds && input.filter.excludedTagIds.length > 0) {
          additionalConditions.push(buildTagFilterSubquery(input.filter.excludedTagIds));
        }

        // Collection filter
        if (input.filter?.collectionIds && input.filter.collectionIds.length > 0) {
          additionalConditions.push(buildCollectionFilterSubquery(input.filter.collectionIds));
        }

        // Price range filter
        const priceSubquery = buildPriceRangeSubquery(
          input.filter?.price?.from,
          input.filter?.price?.to
        );
        if (priceSubquery) {
          additionalConditions.push(priceSubquery);
        }

        // On sale filter
        if (input.filter?.onSale === "yes") {
          additionalConditions.push(buildOnSaleSubquery());
        }

        // Option filters (Size, Color, etc.)
        if (input.filter?.optionFilters && input.filter.optionFilters.length > 0) {
          const optionSubquery = buildOptionFilterSubquery(input.filter.optionFilters);
          if (optionSubquery) {
            additionalConditions.push(optionSubquery);
          }
        }

        // Build where conditions
        const { whereConditions, fuzzyOrderBy } = buildProductWhereConditions({
          filter: input.filter,
          searchQuery: input.q,
          additionalConditions,
        });

        // Build order by
        const orderBy = buildProductOrderBy({
          sort: input.sort,
          fuzzyOrderBy,
          allowedColumns: [...PRODUCT_SORTABLE_COLUMNS],
        });

        // Determine what to include based on view mode
        const includeFullDetails = input.viewMode !== "grid";

        // Execute queries in parallel
        const [result, totalCount] = await Promise.all([
          db.query.products.findMany({
            where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
            limit: input.limit,
            offset,
            orderBy: () => orderBy,
            with: {
              variants: {
                orderBy: (variants, { asc }) => [asc(variants.position)],
                columns:
                  includeFullDetails ? undefined : (
                    {
                      id: true,
                      price: true,
                      compareAtPrice: true,
                      inventoryQuantity: true,
                      inventoryTracked: true,
                      continueSellingWhenOutOfStock: true,
                    }
                  ),
              },
              images: {
                orderBy: (images, { asc }) => [asc(images.position)],
                limit: includeFullDetails ? undefined : 1,
              },
              ...(includeFullDetails ?
                {
                  options: {
                    orderBy: (options, { asc }) => [asc(options.position)],
                    with: {
                      values: {
                        orderBy: (values, { asc }) => [asc(values.position)],
                      },
                    },
                  },
                  productTags: {
                    with: {
                      tag: true,
                    },
                  },
                  productCollections: {
                    with: {
                      collection: true,
                    },
                  },
                }
              : {
                  productTags: {
                    with: {
                      tag: true,
                    },
                  },
                }),
            },
          }),
          db.$count(products, whereConditions.length > 0 ? and(...whereConditions) : undefined),
        ]);

        // Transform the data
        const items = result.map((product) => ({
          ...product,
          tags: product.productTags?.map((pt) => pt.tag.value) ?? [],
          collections:
            "productCollections" in product ?
              ((
                product as typeof product & { productCollections: { collection: unknown }[] }
              ).productCollections?.map((pc) => pc.collection) ?? [])
            : [],
          productTags: undefined,
          productCollections: undefined,
        }));

        return {
          items,
          total: totalCount,
          page: input.page,
          limit: input.limit,
          totalPages: Math.ceil(totalCount / input.limit),
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch products",
          cause: error,
        });
      }
    }),

  /**
   * List products for storefront (public - only published, active products)
   */
  storefront: protectedProcedure
    .input(createListInput(PRODUCT_SORTABLE_COLUMNS, storefrontFilterSchema))
    .query(async ({ input }) => {
      const offset = (input.page - 1) * input.limit;

      try {
        // Build additional conditions for related data filters
        const additionalConditions = [];

        // Tag filter (by value for storefront)
        if (input.filter?.tags && input.filter.tags.length > 0) {
          additionalConditions.push(buildTagValueFilterSubquery(input.filter.tags));
        }

        // Collection filter
        if (input.filter?.collectionIds && input.filter.collectionIds.length > 0) {
          additionalConditions.push(buildCollectionFilterSubquery(input.filter.collectionIds));
        }

        // Price range filter
        const priceSubquery = buildPriceRangeSubquery(
          input.filter?.minPrice,
          input.filter?.maxPrice
        );
        if (priceSubquery) {
          additionalConditions.push(priceSubquery);
        }

        // On sale filter
        if (input.filter?.onSale === true) {
          additionalConditions.push(buildOnSaleSubquery());
        }

        // In stock filter
        if (input.filter?.inStock === true) {
          additionalConditions.push(buildInStockSubquery());
        }

        // Option filters (Color, Size, Material, etc.)
        if (input.filter?.optionFilters && input.filter.optionFilters.length > 0) {
          const optionSubquery = buildOptionFilterSubquery(input.filter.optionFilters);
          if (optionSubquery) {
            additionalConditions.push(optionSubquery);
          }
        }

        // Build where conditions
        const { whereConditions, fuzzyOrderBy } = buildStorefrontWhereConditions({
          filter: input.filter,
          searchQuery: input.q,
          additionalConditions,
        });

        // Build order by
        const orderBy = buildProductOrderBy({
          sort: input.sort,
          fuzzyOrderBy,
          allowedColumns: [...PRODUCT_SORTABLE_COLUMNS],
        });

        // Execute queries in parallel
        const [result, totalCount] = await Promise.all([
          db.query.products.findMany({
            where: and(...whereConditions),
            limit: input.limit,
            offset,
            orderBy: () => orderBy,
            columns: {
              id: true,
              title: true,
              handle: true,
              description: input.viewMode !== "grid" ? true : undefined,
              vendor: true,
              productType: true,
              createdAt: true,
            },
            with: {
              variants: {
                orderBy: (variants, { asc }) => [asc(variants.position)],
                columns: {
                  id: true,
                  price: true,
                  compareAtPrice: true,
                  inventoryQuantity: true,
                  inventoryTracked: true,
                  continueSellingWhenOutOfStock: true,
                },
              },
              images: {
                orderBy: (images, { asc }) => [asc(images.position)],
                limit: input.viewMode === "grid" ? 1 : 4,
                columns: {
                  id: true,
                  url: true,
                  alt: true,
                },
              },
              productTags: {
                with: {
                  tag: {
                    columns: {
                      value: true,
                    },
                  },
                },
              },
            },
          }),
          db.$count(products, and(...whereConditions)),
        ]);

        // Transform the data
        const items = result.map((product) => ({
          ...product,
          tags: product.productTags?.map((pt) => pt.tag.value) ?? [],
          productTags: undefined,
        }));

        return {
          items,
          total: totalCount,
          page: input.page,
          limit: input.limit,
          totalPages: Math.ceil(totalCount / input.limit),
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch products",
          cause: error,
        });
      }
    }),

  /**
   * List all collections (for product form dropdown)
   */
  listCollections: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.session.user.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Admin access required",
      });
    }

    const allCollections = await db.query.collections.findMany({
      orderBy: (collections, { asc }) => [asc(collections.title)],
    });

    return allCollections;
  }),

  /**
   * List all product options with their values (for filter sidebar)
   * Returns distinct option names and their available values across all products
   */
  listOptions: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.session.user.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Admin access required",
      });
    }

    // Get all options with their values
    const allOptions = await db.query.productOptions.findMany({
      with: {
        values: {
          orderBy: (values, { asc }) => [asc(values.position)],
        },
      },
      orderBy: (options, { asc }) => [asc(options.name)],
    });

    // Group by option name and collect unique values
    const optionMap = new Map<string, Set<string>>();

    for (const option of allOptions) {
      if (!optionMap.has(option.name)) {
        optionMap.set(option.name, new Set());
      }
      const valuesSet = optionMap.get(option.name);
      if (valuesSet) {
        for (const value of option.values) {
          valuesSet.add(value.value);
        }
      }
    }

    // Convert to array format
    const result = Array.from(optionMap.entries()).map(([name, valuesSet]) => ({
      name,
      values: Array.from(valuesSet).sort(),
    }));

    return result;
  }),

  /**
   * List collections for storefront (public - no auth required)
   * Returns collections with product counts for shop navigation
   */
  storefrontCollections: publicProcedure.query(async () => {
    const allCollections = await db.query.collections.findMany({
      orderBy: (collections, { asc }) => [asc(collections.title)],
      with: {
        productCollections: true,
      },
    });

    return allCollections.map((collection) => ({
      id: collection.id,
      title: collection.title,
      handle: collection.handle,
      description: collection.description,
      productCount: collection.productCollections.length,
    }));
  }),

  /**
   * List tags for storefront (public - no auth required)
   * Returns tags with product counts for shop navigation
   */
  storefrontTags: publicProcedure.query(async () => {
    const allTags = await db.query.tags.findMany({
      orderBy: (tags, { asc }) => [asc(tags.value)],
      with: {
        productTags: true,
      },
    });

    return allTags.map((tag) => ({
      id: tag.id,
      value: tag.value,
      productCount: tag.productTags.length,
    }));
  }),

  /**
   * Global search for products and collections (public - no auth required)
   * Used by the global search dialog (Cmd+K)
   */
  globalSearch: publicProcedure.input(z.string().optional()).query(async ({ input }) => {
    const searchTerm = input?.trim();

    if (!searchTerm || searchTerm.length < 2) {
      return {
        products: [],
        collections: [],
      };
    }

    try {
      // Search products by title or description (only published, active products)
      const productsResult = await db.query.products.findMany({
        where: and(
          or(
            ilike(products.title, `%${searchTerm}%`),
            ilike(products.description, `%${searchTerm}%`)
          ),
          eq(products.published, true),
          eq(products.status, "active")
        ),
        columns: {
          id: true,
          title: true,
          handle: true,
          productType: true,
        },
        with: {
          variants: {
            limit: 1,
            orderBy: (variants, { asc }) => [asc(variants.position)],
            columns: {
              price: true,
            },
          },
          images: {
            limit: 1,
            orderBy: (images, { asc }) => [asc(images.position)],
            columns: {
              url: true,
              alt: true,
            },
          },
        },
        limit: 10,
      });

      // Search collections by title
      const collectionsResult = await db.query.collections.findMany({
        where: ilike(collections.title, `%${searchTerm}%`),
        columns: {
          id: true,
          title: true,
          handle: true,
        },
        with: {
          productCollections: {
            columns: {
              productId: true,
            },
          },
        },
        limit: 5,
      });

      return {
        products: productsResult.map((p) => ({
          id: p.id,
          title: p.title,
          handle: p.handle,
          productType: p.productType,
          price: p.variants[0]?.price ?? null,
          image: p.images[0] ?? null,
        })),
        collections: collectionsResult.map((c) => ({
          id: c.id,
          title: c.title,
          handle: c.handle,
          productCount: c.productCollections.length,
        })),
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to perform global search ${error as string}`,
      });
    }
  }),

  /**
   * Get a single product by ID for storefront (public - no auth required)
   * Returns full product details for the product detail page
   */
  getByIdPublic: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      try {
        const product = await db.query.products.findFirst({
          where: and(
            eq(products.id, input.id),
            eq(products.published, true),
            eq(products.status, "active")
          ),
          with: {
            images: {
              orderBy: (images, { asc }) => [asc(images.position)],
            },
            variants: {
              orderBy: (variants, { asc }) => [asc(variants.position)],
            },
            options: {
              orderBy: (options, { asc }) => [asc(options.position)],
              with: {
                values: {
                  orderBy: (values, { asc }) => [asc(values.position)],
                },
              },
            },
            productTags: {
              with: {
                tag: true,
              },
            },
          },
        });

        if (!product) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Product not found",
          });
        }

        // Calculate total inventory and stock status
        const totalInventory = product.variants.reduce(
          (sum, v) => sum + (v.inventoryQuantity ?? 0),
          0
        );
        const hasInStockVariant = product.variants.some(
          (v) =>
            (v.inventoryQuantity ?? 0) > 0 ||
            (v.continueSellingWhenOutOfStock ?? false) ||
            (v.inventoryTracked ?? true)
        );

        // Get price info from first variant
        const firstVariant = product.variants[0];
        const price = firstVariant?.price ? parseFloat(firstVariant.price) : 0;
        const compareAtPrice =
          firstVariant?.compareAtPrice ? parseFloat(firstVariant.compareAtPrice) : undefined;

        // Transform images to expected format
        const images = product.images.map((img) => ({
          id: img.id,
          src: img.url,
          alt: img.alt ?? product.title,
        }));

        // Transform options to colors/sizes format with stock info
        const colorOption = product.options.find((o) => o.name.toLowerCase() === "color");
        const sizeOption = product.options.find((o) => o.name.toLowerCase() === "size");

        // Helper to check if an option value is in stock
        const isOptionValueInStock = (optionName: string, optionValue: string) => {
          return product.variants.some((v) => {
            const variantOptions = v.optionValues as Record<string, string>;
            if (variantOptions[optionName] !== optionValue) return false;
            return (
              (v.inventoryQuantity ?? 0) > 0 ||
              (v.continueSellingWhenOutOfStock ?? false) ||
              !v.inventoryTracked
            );
          });
        };

        const colors =
          colorOption ?
            colorOption.values.map((v) => ({
              id: v.id,
              name: v.value,
              value: v.value, // Could be enhanced with color hex codes stored in metadata
              inStock: isOptionValueInStock("Color", v.value),
            }))
          : [];

        const sizes =
          sizeOption ?
            sizeOption.values.map((v) => ({
              id: v.id,
              name: v.value,
              value: v.value,
              inStock: isOptionValueInStock("Size", v.value),
            }))
          : [];

        // Transform tags
        const tags = product.productTags.map((pt) => pt.tag.value);

        return {
          id: product.id,
          handle: product.handle,
          title: product.title,
          description: product.description ?? "",
          price,
          originalPrice: compareAtPrice,
          inStock: hasInStockVariant,
          stockCount: totalInventory,
          sku: firstVariant?.sku ?? undefined,
          brand: product.vendor ?? undefined,
          images,
          colors,
          sizes,
          tags,
          // Variants for more advanced selection logic
          variants: product.variants.map((v) => ({
            id: v.id,
            sku: v.sku,
            price: v.price ? parseFloat(v.price) : 0,
            compareAtPrice: v.compareAtPrice ? parseFloat(v.compareAtPrice) : undefined,
            inventoryQuantity: v.inventoryQuantity ?? 0,
            optionValues: v.optionValues as Record<string, string>,
            inStock:
              (v.inventoryQuantity ?? 0) > 0 ||
              (v.continueSellingWhenOutOfStock ?? false) ||
              !v.inventoryTracked,
          })),
          // Options for generic option handling
          options: product.options.map((o) => ({
            id: o.id,
            name: o.name,
            values: o.values.map((v) => ({
              id: v.id,
              value: v.value,
              inStock: isOptionValueInStock(o.name, v.value),
            })),
          })),
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch product",
        });
      }
    }),
});
