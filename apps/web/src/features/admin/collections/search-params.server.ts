import { createLoader, parseAsInteger, parseAsJson, parseAsString } from "nuqs/server";
import { z } from "zod/v4";

import { collectionFilterSchema, defaultCollectionFilter } from "@/validation/collection";

const sortSchema = z.array(
  z.object({
    field: z.string(),
    direction: z.enum(["asc", "desc"]),
  })
);

export const adminCollectionSearchParamsParser = {
  q: parseAsString.withDefault(""),
  limit: parseAsInteger.withDefault(50),
  page: parseAsInteger.withDefault(1),
  sort: parseAsJson((value) => sortSchema.parse(value)).withDefault([
    { field: "createdAt", direction: "desc" as const },
  ]),
  filter: parseAsJson((value) => collectionFilterSchema.optional().parse(value)).withDefault(
    defaultCollectionFilter
  ),
};

export const loadAdminCollectionSearchParams = createLoader(adminCollectionSearchParamsParser);
