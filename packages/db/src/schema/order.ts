import { relations } from "drizzle-orm";
import { index, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { user } from "./auth";
import { products, productVariants } from "./product";

export const orderStatuses = ["pending", "paid", "failed", "refunded", "cancelled"] as const;
export type OrderStatus = (typeof orderStatuses)[number];

// =============================================================================
// ORDER TABLES
// =============================================================================

/**
 * Orders - Main order entity
 */
export const orders = pgTable(
  "orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // User reference (optional for guest checkout)
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),

    // Order status
    status: text("status").$type<OrderStatus>().notNull().default("pending"),

    // Stripe payment intent ID (used to track and prevent duplicate charges)
    stripePaymentIntentId: text("stripe_payment_intent_id").unique(),

    // Pricing (stored in cents to avoid floating point issues)
    subtotal: integer("subtotal").notNull(), // in cents
    tax: integer("tax").notNull().default(0), // in cents
    shipping: integer("shipping").notNull().default(0), // in cents
    total: integer("total").notNull(), // in cents

    // Shipping address (stored as JSON for flexibility)
    shippingAddress: jsonb("shipping_address").$type<{
      name: string;
      email: string;
      phone?: string;
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    }>(),

    // Billing address (optional, can be same as shipping)
    billingAddress: jsonb("billing_address").$type<{
      name: string;
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    }>(),

    // Customer email (for guest checkout or if user is deleted)
    customerEmail: text("customer_email"),

    // Metadata for any additional info
    metadata: jsonb("metadata"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    paidAt: timestamp("paid_at"),
  },
  (table) => [
    index("orders_user_id_idx").on(table.userId),
    index("orders_status_idx").on(table.status),
    index("orders_stripe_payment_intent_id_idx").on(table.stripePaymentIntentId),
  ]
);

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;

/**
 * Order Items - Line items in an order
 */
export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),

    // Product references (nullable in case product is deleted)
    productId: uuid("product_id").references(() => products.id, {
      onDelete: "set null",
    }),
    variantId: uuid("variant_id").references(() => productVariants.id, {
      onDelete: "set null",
    }),

    // Denormalized product info (preserved even if product is deleted)
    productTitle: text("product_title").notNull(),
    variantTitle: text("variant_title"),
    sku: text("sku"),
    imageUrl: text("image_url"),

    // Pricing at time of purchase (in cents)
    priceAtPurchase: integer("price_at_purchase").notNull(),
    quantity: integer("quantity").notNull(),
    total: integer("total").notNull(), // priceAtPurchase * quantity

    // Variant options at time of purchase (e.g., { "Color": "Red", "Size": "Large" })
    optionValues: jsonb("option_values"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("order_items_order_id_idx").on(table.orderId)]
);

export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;

// =============================================================================
// RELATIONS
// =============================================================================

/**
 * Order Relations
 */
export const orderRelations = relations(orders, ({ one, many }) => ({
  user: one(user, {
    fields: [orders.userId],
    references: [user.id],
  }),
  items: many(orderItems),
}));

/**
 * Order Item Relations
 */
export const orderItemRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [orderItems.variantId],
    references: [productVariants.id],
  }),
}));
