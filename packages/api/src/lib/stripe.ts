import Stripe from "stripe";

import { env } from "@ecommerce/env/server";

/**
 * Stripe client for server-side operations
 * Used for creating payment intents, handling webhooks, etc.
 */
export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-02-24.acacia",
  typescript: true,
});

/**
 * Convert a dollar amount to cents for Stripe
 * Stripe expects amounts in the smallest currency unit (cents for USD)
 */
export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Convert cents to dollars for display
 */
export function fromCents(cents: number): number {
  return cents / 100;
}
