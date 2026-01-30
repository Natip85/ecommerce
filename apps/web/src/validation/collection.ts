import { z } from "zod/v4";

import { handleSchema, optionalText } from "./common";

// =============================================================================
// COLLECTION SCHEMA
// =============================================================================

/**
 * Core collection schema - represents the data structure
 */
export const collectionSchema = z.object({
  // Basic Info
  title: z.string().min(1, "Title is required").max(255, "Title must be at most 255 characters"),
  handle: handleSchema,
  description: optionalText(2000, "Description"),

  // Publishing
  published: z.boolean(),
});

export type Collection = z.infer<typeof collectionSchema>;

// =============================================================================
// COLLECTION FORM SCHEMA
// =============================================================================

/**
 * Collection form schema - used for form validation
 */
export const collectionFormSchema = collectionSchema;

export type CollectionForm = z.infer<typeof collectionFormSchema>;

// =============================================================================
// DEFAULT VALUES
// =============================================================================

/**
 * Default form values - used to initialize react-hook-form
 */
export const defaultCollectionForm: CollectionForm = {
  title: "",
  handle: "",
  description: "",
  published: false,
} as const;

// =============================================================================
// COLLECTION FILTER SCHEMA
// =============================================================================

/**
 * Collection filter schema for admin list
 */
export const collectionFilterSchema = z.object({
  search: z.string().optional(),
  published: z.enum(["all", "yes", "no"]).default("all").optional(),
});

export type CollectionFilter = z.infer<typeof collectionFilterSchema>;

/**
 * Default filter values
 */
export const defaultCollectionFilter: Partial<CollectionFilter> = {
  published: "all",
};
