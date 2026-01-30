import { TRPCError } from "@trpc/server";
import { desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import type { NewOrder, NewOrderItem } from "@ecommerce/db/schema/order";
import { orderItems, orders } from "@ecommerce/db/schema/order";
import { productImages, products, productVariants } from "@ecommerce/db/schema/product";

import { stripe, toCents } from "../lib/stripe";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

// =============================================================================
// INPUT SCHEMAS
// =============================================================================

const cartItemSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  quantity: z.number().int().min(1),
});

const shippingAddressSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  postalCode: z.string().min(1),
  country: z.string().min(1).default("US"),
});

const createPaymentIntentInput = z.object({
  items: z.array(cartItemSchema).min(1),
  shippingAddress: shippingAddressSchema,
});

// =============================================================================
// ORDER ROUTER
// =============================================================================

export const orderRouter = createTRPCRouter({
  /**
   * Create a payment intent and order
   * This is the main checkout endpoint
   */
  createPaymentIntent: publicProcedure
    .input(createPaymentIntentInput)
    .mutation(async ({ ctx, input }) => {
      const { items, shippingAddress } = input;

      // Get unique product and variant IDs
      const productIds = [...new Set(items.map((item) => item.productId))];
      const variantIds = [
        ...new Set(
          items.map((item) => item.variantId).filter((id): id is string => id !== undefined)
        ),
      ];

      // Fetch products from database to verify prices
      const dbProducts = await ctx.db
        .select({
          id: products.id,
          title: products.title,
          status: products.status,
        })
        .from(products)
        .where(inArray(products.id, productIds));

      // Fetch variants from database
      const dbVariants =
        variantIds.length > 0 ?
          await ctx.db
            .select({
              id: productVariants.id,
              productId: productVariants.productId,
              title: productVariants.title,
              price: productVariants.price,
              sku: productVariants.sku,
              optionValues: productVariants.optionValues,
              inventoryQuantity: productVariants.inventoryQuantity,
            })
            .from(productVariants)
            .where(inArray(productVariants.id, variantIds))
        : [];

      // Create maps for quick lookup
      const productMap = new Map(dbProducts.map((p) => [p.id, p]));
      const variantMap = new Map(dbVariants.map((v) => [v.id, v]));

      // Fetch product images (first image for each product)
      const dbImages = await ctx.db
        .select({
          productId: productImages.productId,
          variantId: productImages.variantId,
          url: productImages.url,
        })
        .from(productImages)
        .where(inArray(productImages.productId, productIds));

      // Create maps for quick lookup (productId -> first image URL, variantId -> image URL)
      const productImageMap = new Map<string, string>();
      const variantImageMap = new Map<string, string>();

      for (const img of dbImages) {
        // Set product image if not already set (first image wins based on query order)
        if (!productImageMap.has(img.productId)) {
          productImageMap.set(img.productId, img.url);
        }
        // Set variant image if variant is specified
        if (img.variantId && !variantImageMap.has(img.variantId)) {
          variantImageMap.set(img.variantId, img.url);
        }
      }

      // Validate items and calculate totals
      let subtotal = 0;
      const validatedItems: {
        productId: string;
        variantId?: string;
        productTitle: string;
        variantTitle?: string;
        sku?: string;
        imageUrl?: string;
        priceInCents: number;
        quantity: number;
        optionValues?: Record<string, string>;
      }[] = [];

      for (const item of items) {
        const product = productMap.get(item.productId);
        if (!product) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Product not found: ${item.productId}`,
          });
        }

        if (product.status !== "active") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Product is not available: ${product.title}`,
          });
        }

        if (item.variantId) {
          const variant = variantMap.get(item.variantId);
          if (!variant) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Variant not found: ${item.variantId}`,
            });
          }

          if (variant.productId !== item.productId) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Variant does not belong to product`,
            });
          }

          // Check inventory
          if (variant.inventoryQuantity !== null && variant.inventoryQuantity < item.quantity) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Insufficient inventory for ${product.title} - ${variant.title}`,
            });
          }

          const priceInCents = toCents(Number(variant.price));
          subtotal += priceInCents * item.quantity;

          // Get image URL: prefer variant-specific image, fall back to product image
          const imageUrl =
            variantImageMap.get(item.variantId) ?? productImageMap.get(item.productId);

          validatedItems.push({
            productId: item.productId,
            variantId: item.variantId,
            productTitle: product.title,
            variantTitle: variant.title ?? undefined,
            sku: variant.sku ?? undefined,
            imageUrl,
            priceInCents,
            quantity: item.quantity,
            optionValues: variant.optionValues as Record<string, string> | undefined,
          });
        } else {
          // Product without variant - need to get the default variant
          const defaultVariant = await ctx.db
            .select({
              id: productVariants.id,
              title: productVariants.title,
              price: productVariants.price,
              sku: productVariants.sku,
              optionValues: productVariants.optionValues,
              inventoryQuantity: productVariants.inventoryQuantity,
            })
            .from(productVariants)
            .where(eq(productVariants.productId, item.productId))
            .limit(1)
            .then((rows) => rows[0]);

          if (!defaultVariant) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `No variant found for product: ${product.title}`,
            });
          }

          // Check inventory
          if (
            defaultVariant.inventoryQuantity !== null &&
            defaultVariant.inventoryQuantity < item.quantity
          ) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Insufficient inventory for ${product.title}`,
            });
          }

          const priceInCents = toCents(Number(defaultVariant.price));
          subtotal += priceInCents * item.quantity;

          // Get image URL: prefer variant-specific image, fall back to product image
          const imageUrl =
            variantImageMap.get(defaultVariant.id) ?? productImageMap.get(item.productId);

          validatedItems.push({
            productId: item.productId,
            variantId: defaultVariant.id,
            productTitle: product.title,
            variantTitle: defaultVariant.title ?? undefined,
            sku: defaultVariant.sku ?? undefined,
            imageUrl,
            priceInCents,
            quantity: item.quantity,
            optionValues: defaultVariant.optionValues as Record<string, string> | undefined,
          });
        }
      }

      // Calculate shipping (free for orders $50+, otherwise $9.99)
      const shipping = subtotal >= toCents(50) ? 0 : toCents(9.99);

      // Calculate tax (8%)
      const tax = Math.round(subtotal * 0.08);

      // Calculate total
      const total = subtotal + shipping + tax;

      // Create Stripe PaymentIntent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: total,
        currency: "usd",
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          // We'll add order ID after creating the order
        },
      });

      // Create order in database
      const orderData: NewOrder = {
        userId: ctx.session?.user?.id ?? null,
        status: "pending",
        stripePaymentIntentId: paymentIntent.id,
        subtotal,
        tax,
        shipping,
        total,
        shippingAddress,
        customerEmail: shippingAddress.email,
      };

      const [order] = await ctx.db.insert(orders).values(orderData).returning();

      if (!order) {
        // Cancel the payment intent if order creation fails
        await stripe.paymentIntents.cancel(paymentIntent.id);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create order",
        });
      }

      // Create order items
      const orderItemsData: NewOrderItem[] = validatedItems.map((item) => ({
        orderId: order.id,
        productId: item.productId,
        variantId: item.variantId,
        productTitle: item.productTitle,
        variantTitle: item.variantTitle ?? null,
        sku: item.sku ?? null,
        imageUrl: item.imageUrl ?? null,
        priceAtPurchase: item.priceInCents,
        quantity: item.quantity,
        total: item.priceInCents * item.quantity,
        optionValues: item.optionValues ?? null,
      }));

      await ctx.db.insert(orderItems).values(orderItemsData);

      // Update PaymentIntent with order ID
      await stripe.paymentIntents.update(paymentIntent.id, {
        metadata: {
          orderId: order.id,
        },
      });

      return {
        clientSecret: paymentIntent.client_secret,
        orderId: order.id,
        total,
      };
    }),

  /**
   * Get a single order by ID
   */
  getOrder: publicProcedure
    .input(z.object({ orderId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const order = await ctx.db.query.orders.findFirst({
        where: eq(orders.id, input.orderId),
        with: {
          items: true,
        },
      });

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order not found",
        });
      }

      // Only allow access to own orders if logged in, or by orderId for guest checkout
      if (ctx.session?.user?.id && order.userId && order.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied",
        });
      }

      // For items that don't have an imageUrl stored (legacy orders),
      // fetch images from the product images table
      const itemsNeedingImages = order.items.filter((item) => !item.imageUrl && item.productId);

      if (itemsNeedingImages.length > 0) {
        const productIds = [
          ...new Set(
            itemsNeedingImages.map((item) => item.productId).filter((id): id is string => !!id)
          ),
        ];

        const images = await ctx.db
          .select({
            productId: productImages.productId,
            variantId: productImages.variantId,
            url: productImages.url,
          })
          .from(productImages)
          .where(inArray(productImages.productId, productIds));

        // Create lookup maps
        const productImageMap = new Map<string, string>();
        const variantImageMap = new Map<string, string>();

        for (const img of images) {
          if (!productImageMap.has(img.productId)) {
            productImageMap.set(img.productId, img.url);
          }
          if (img.variantId && !variantImageMap.has(img.variantId)) {
            variantImageMap.set(img.variantId, img.url);
          }
        }

        // Return order with augmented items
        return {
          ...order,
          items: order.items.map((item) => ({
            ...item,
            imageUrl:
              item.imageUrl ??
              (item.variantId && variantImageMap.get(item.variantId)) ??
              (item.productId && productImageMap.get(item.productId)) ??
              null,
          })),
        };
      }

      return order;
    }),

  /**
   * Get all orders for the current user
   */
  getOrders: protectedProcedure.query(async ({ ctx }) => {
    const userOrders = await ctx.db.query.orders.findMany({
      where: eq(orders.userId, ctx.session.user.id),
      orderBy: [desc(orders.createdAt)],
      with: {
        items: true,
      },
    });

    // For items that don't have an imageUrl stored (legacy orders),
    // fetch images from the product images table
    const productIdsNeedingImages = new Set<string>();
    const variantIdsNeedingImages = new Set<string>();

    for (const order of userOrders) {
      for (const item of order.items) {
        if (!item.imageUrl && item.productId) {
          productIdsNeedingImages.add(item.productId);
          if (item.variantId) {
            variantIdsNeedingImages.add(item.variantId);
          }
        }
      }
    }

    // If there are items needing images, fetch them
    if (productIdsNeedingImages.size > 0) {
      const images = await ctx.db
        .select({
          productId: productImages.productId,
          variantId: productImages.variantId,
          url: productImages.url,
        })
        .from(productImages)
        .where(inArray(productImages.productId, [...productIdsNeedingImages]));

      // Create lookup maps
      const productImageMap = new Map<string, string>();
      const variantImageMap = new Map<string, string>();

      for (const img of images) {
        if (!productImageMap.has(img.productId)) {
          productImageMap.set(img.productId, img.url);
        }
        if (img.variantId && !variantImageMap.has(img.variantId)) {
          variantImageMap.set(img.variantId, img.url);
        }
      }

      // Augment items with image URLs
      return userOrders.map((order) => ({
        ...order,
        items: order.items.map((item) => ({
          ...item,
          imageUrl:
            item.imageUrl ??
            (item.variantId && variantImageMap.get(item.variantId)) ??
            (item.productId && productImageMap.get(item.productId)) ??
            null,
        })),
      }));
    }

    return userOrders;
  }),

  /**
   * Get order by Stripe PaymentIntent ID
   * Used internally by webhook to update order status
   */
  getOrderByPaymentIntent: publicProcedure
    .input(z.object({ paymentIntentId: z.string() }))
    .query(async ({ ctx, input }) => {
      const order = await ctx.db.query.orders.findFirst({
        where: eq(orders.stripePaymentIntentId, input.paymentIntentId),
      });

      return order;
    }),
});
