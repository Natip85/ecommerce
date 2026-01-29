import {
  productFilterSchema,
  defaultProductFilter,
} from "@ecommerce/api/schemas";
import {
  createLoader,
  parseAsInteger,
  parseAsJson,
  parseAsString,
} from "nuqs/server";
import { z } from "zod/v4";

const viewModeSchema = z.enum(["list", "grid", "grid-detailed", "carousel"]);
export type ViewMode = z.infer<typeof viewModeSchema>;

const sortSchema = z.array(
  z.object({
    field: z.string(),
    direction: z.enum(["asc", "desc"]),
  })
);

export const adminProductSearchParamsParser = {
  q: parseAsString.withDefault(""),
  limit: parseAsInteger.withDefault(50),
  page: parseAsInteger.withDefault(1),
  viewMode: parseAsJson((value) => viewModeSchema.parse(value)).withDefault(
    "grid"
  ),
  sort: parseAsJson((value) => sortSchema.parse(value)).withDefault([
    { field: "createdAt", direction: "desc" as const },
  ]),
  filter: parseAsJson((value) =>
    productFilterSchema.optional().parse(value)
  ).withDefault(defaultProductFilter),
};

export const loadAdminProductSearchParams = createLoader(
  adminProductSearchParamsParser
);
