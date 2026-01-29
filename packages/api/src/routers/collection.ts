import { db } from "@ecommerce/db";
import {
  collections,
  productCollections,
} from "@ecommerce/db/schema/product";
import { TRPCError } from "@trpc/server";
import { and, count as drizzleCount, desc, eq, ilike, asc } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "../trpc";

// =============================================================================
// SCHEMAS
// =============================================================================

export const createCollectionSchema = z.object({
  title: z.string().min(1),
  handle: z.string().min(1),
  description: z.string().optional(),
  published: z.boolean().optional(),
});

export const updateCollectionSchema = z.object({
  collectionId: z.string().uuid(),
  title: z.string().min(1).optional(),
  handle: z.string().min(1).optional(),
  description: z.string().optional(),
  published: z.boolean().optional(),
});

const collectionFilterSchema = z.object({
  search: z.string().optional(),
  published: z.enum(["all", "yes", "no"]).optional(),
});

// =============================================================================
// ROUTER
// =============================================================================

export const collectionRouter = createTRPCRouter({
  /**
   * Create a new collection
   */
  create: protectedProcedure
    .input(createCollectionSchema)
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      // Check if handle already exists
      const existingCollection = await db.query.collections.findFirst({
        where: eq(collections.handle, input.handle),
      });

      if (existingCollection) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A collection with this handle already exists",
        });
      }

      const [collection] = await db
        .insert(collections)
        .values({
          title: input.title,
          handle: input.handle,
          description: input.description,
          published: input.published ?? false,
        })
        .returning();

      return collection;
    }),

  /**
   * Get a collection by ID
   */
  getById: protectedProcedure
    .input(z.object({ collectionId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      const collection = await db.query.collections.findFirst({
        where: eq(collections.id, input.collectionId),
        with: {
          productCollections: {
            with: {
              product: {
                with: {
                  images: {
                    limit: 1,
                  },
                },
              },
            },
          },
        },
      });

      if (!collection) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Collection not found",
        });
      }

      // Transform to include product count and product list
      return {
        ...collection,
        productCount: collection.productCollections.length,
        products: collection.productCollections.map((pc) => ({
          id: pc.product.id,
          title: pc.product.title,
          handle: pc.product.handle,
          image: pc.product.images[0] ?? null,
        })),
        productCollections: undefined,
      };
    }),

  /**
   * Update a collection
   */
  update: protectedProcedure
    .input(updateCollectionSchema)
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      const { collectionId, ...updateData } = input;

      // Check if collection exists
      const existing = await db.query.collections.findFirst({
        where: eq(collections.id, collectionId),
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Collection not found",
        });
      }

      // If handle is being updated, check for uniqueness
      if (updateData.handle && updateData.handle !== existing.handle) {
        const handleExists = await db.query.collections.findFirst({
          where: and(
            eq(collections.handle, updateData.handle),
          ),
        });

        if (handleExists && handleExists.id !== collectionId) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "A collection with this handle already exists",
          });
        }
      }

      const [updated] = await db
        .update(collections)
        .set(updateData)
        .where(eq(collections.id, collectionId))
        .returning();

      return updated;
    }),

  /**
   * Delete a collection
   */
  delete: protectedProcedure
    .input(z.object({ collectionId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      // Check if collection exists
      const existing = await db.query.collections.findFirst({
        where: eq(collections.id, input.collectionId),
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Collection not found",
        });
      }

      // Delete collection (product associations will be deleted via cascade)
      await db.delete(collections).where(eq(collections.id, input.collectionId));

      return { success: true };
    }),

  /**
   * Delete multiple collections
   */
  deleteMany: protectedProcedure
    .input(z.object({ collectionIds: z.array(z.string().uuid()) }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      for (const collectionId of input.collectionIds) {
        await db.delete(collections).where(eq(collections.id, collectionId));
      }

      return { success: true, count: input.collectionIds.length };
    }),

  /**
   * List collections with pagination and filtering
   */
  list: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(50),
        filter: collectionFilterSchema.optional(),
        sort: z
          .array(
            z.object({
              field: z.string(),
              direction: z.enum(["asc", "desc"]),
            })
          )
          .optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      const { page, limit, filter, sort } = input;
      const offset = (page - 1) * limit;

      // Build where conditions
      const conditions = [];

      if (filter?.search) {
        conditions.push(
          ilike(collections.title, `%${filter.search}%`)
        );
      }

      if (filter?.published === "yes") {
        conditions.push(eq(collections.published, true));
      } else if (filter?.published === "no") {
        conditions.push(eq(collections.published, false));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Build order by
      let orderBy: ReturnType<typeof desc>[] = [desc(collections.createdAt)];
      if (sort && sort.length > 0) {
        orderBy = sort.map((s) => {
          const column = s.field === "title" ? collections.title :
            s.field === "createdAt" ? collections.createdAt :
              s.field === "updatedAt" ? collections.updatedAt :
                collections.createdAt;
          return s.direction === "asc" ? asc(column) : desc(column);
        });
      }

      // Get total count
      const countResult = await db
        .select({ count: drizzleCount() })
        .from(collections)
        .where(whereClause);
      const totalCount = countResult[0]?.count ?? 0;

      // Get paginated collections with product counts
      const result = await db.query.collections.findMany({
        where: whereClause,
        orderBy,
        limit,
        offset,
        with: {
          productCollections: {
            columns: {
              productId: true,
            },
          },
        },
      });

      // Transform to include product count
      const items = result.map((collection) => ({
        ...collection,
        productCount: collection.productCollections.length,
        productCollections: undefined,
      }));

      return {
        items,
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      };
    }),

  /**
   * Add products to a collection
   */
  addProducts: protectedProcedure
    .input(
      z.object({
        collectionId: z.string().uuid(),
        productIds: z.array(z.string().uuid()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      const { collectionId, productIds } = input;

      // Check if collection exists
      const collection = await db.query.collections.findFirst({
        where: eq(collections.id, collectionId),
      });

      if (!collection) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Collection not found",
        });
      }

      // Add products (ignore duplicates)
      for (const productId of productIds) {
        try {
          await db.insert(productCollections).values({
            collectionId,
            productId,
          });
        } catch {
          // Ignore duplicate key errors
        }
      }

      return { success: true };
    }),

  /**
   * Remove products from a collection
   */
  removeProducts: protectedProcedure
    .input(
      z.object({
        collectionId: z.string().uuid(),
        productIds: z.array(z.string().uuid()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      const { collectionId, productIds } = input;

      for (const productId of productIds) {
        await db
          .delete(productCollections)
          .where(
            and(
              eq(productCollections.collectionId, collectionId),
              eq(productCollections.productId, productId)
            )
          );
      }

      return { success: true };
    }),
});
