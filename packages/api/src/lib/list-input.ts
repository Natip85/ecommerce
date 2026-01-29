import { z } from "zod";

/**
 * View modes for list display
 */
export const viewModes = ["grid", "grid-detailed", "list", "carousel"] as const;
export type ViewMode = (typeof viewModes)[number];

/**
 * Sort direction schema
 */
export const sortDirectionSchema = z.enum(["asc", "desc"]);

/**
 * Creates a basic list input schema with pagination, search, and sorting
 * @param sortableColumns - Array of column names that can be sorted
 * @param defaultSortField - Default field to sort by
 */
export const createBasicListInput = <T extends readonly string[]>(
  sortableColumns: T,
  defaultSortField: T[number] = sortableColumns[0] ?? "createdAt"
) =>
  z.object({
    limit: z.number().min(1).max(1000).default(50),
    page: z.number().min(1).default(1),
    q: z.string().optional().default(""),
    viewMode: z.enum(viewModes).optional().default("grid"),
    sort: z
      .array(
        z.object({
          field: z
            .enum(sortableColumns as unknown as [string, ...string[]])
            .default(defaultSortField)
            .or(z.literal("")),
          direction: sortDirectionSchema.optional().default("asc"),
        })
      )
      .optional()
      .default([{ field: defaultSortField, direction: "asc" }]),
  });

/**
 * Creates a list input schema with filtering support
 * @param sortableColumns - Array of column names that can be sorted
 * @param filterSchema - Zod schema for the filter object
 */
export const createListInput = <
  T extends readonly string[],
  F extends z.ZodTypeAny,
>(
  sortableColumns: T,
  filterSchema: F
) =>
  createBasicListInput(sortableColumns).extend({
    filter: filterSchema.optional().nullable(),
  });

/**
 * Type for list input
 */
export type BasicListInput<T extends readonly string[]> = z.infer<
  ReturnType<typeof createBasicListInput<T>>
>;

export type ListInput<
  T extends readonly string[],
  F extends z.ZodTypeAny,
> = z.infer<ReturnType<typeof createListInput<T, F>>>;
