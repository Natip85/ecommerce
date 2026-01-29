import { z } from "zod";

// =============================================================================
// COMMON CONSTANTS
// =============================================================================

export const PRODUCT_STATUSES = ["draft", "active", "archived"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

// =============================================================================
// COMMON SCHEMAS
// =============================================================================

/**
 * Price schema - validates currency format (e.g., "29.99")
 */
export const priceSchema = z
  .string()
  .regex(/^(\d+(\.\d{1,2})?)?$/, "Invalid price format (e.g., 29.99)")
  .optional()
  .or(z.literal(""));

/**
 * Handle schema - URL-friendly identifier
 */
export const handleSchema = z
  .string()
  .min(1, "Handle is required")
  .max(255, "Handle must be at most 255 characters")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Handle must be lowercase with hyphens only (e.g., my-product-name)"
  );

/**
 * Optional text with max length
 */
export const optionalText = (maxLength: number, fieldName: string) =>
  z
    .string()
    .max(maxLength, `${fieldName} must be at most ${maxLength} characters`)
    .optional()
    .or(z.literal(""));

// =============================================================================
// COMMON HELPERS
// =============================================================================

/**
 * Generate a URL handle from a title
 */
export function generateHandle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
