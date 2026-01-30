import { useMemo } from "react";
import { debounce } from "lodash-es";
import { useQueryStates } from "nuqs";
import {
  createLoader,
  parseAsBoolean,
  parseAsInteger,
  parseAsJson,
  parseAsString,
} from "nuqs/server";
import { z } from "zod/v4";

import type { StorefrontFilter } from "@/validation";
import { defaultStorefrontFilter, sortSchema, storefrontFilterSchema } from "@/validation";

const viewModeSchema = z.enum(["list", "grid", "grid-detailed", "carousel"]);
export type ViewMode = z.infer<typeof viewModeSchema>;

export const searchParamsParser = {
  q: parseAsString.withDefault(""),
  limit: parseAsInteger.withDefault(50),
  page: parseAsInteger.withDefault(1),
  viewMode: parseAsJson((value) => viewModeSchema.parse(value)).withDefault("grid"),
  sort: parseAsJson((value) => sortSchema.parse(value)).withDefault([
    { field: "createdAt", direction: "desc" },
  ]),
  reset: parseAsBoolean.withDefault(false),
  filter: parseAsJson((value) => storefrontFilterSchema.optional().parse(value)).withDefault(
    defaultStorefrontFilter
  ),
};

export const loadSearchParams = createLoader(searchParamsParser);

export const useProductListSearchParams = ({ debounceMs = 500 }: { debounceMs?: number } = {}) => {
  const [searchParams, setSearchParams] = useQueryStates(searchParamsParser);

  const debouncedSetSearchParams = useMemo(
    () => debounce(setSearchParams, debounceMs),
    [setSearchParams, debounceMs]
  );

  const resetFilters = async (filter?: StorefrontFilter) => {
    const newFilter = filter ?? {
      ...defaultStorefrontFilter,
    };
    await setSearchParams({ filter: newFilter, reset: true });
  };

  const clearReset = async () => {
    await setSearchParams({ reset: null });
  };

  return {
    searchParams,
    setSearchParams,
    debouncedSetSearchParams,
    resetFilters,
    clearReset,
  };
};
