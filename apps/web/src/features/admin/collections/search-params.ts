"use client";

import { useMemo } from "react";
import { debounce } from "lodash-es";
import { useQueryStates } from "nuqs";

import type { CollectionFilter } from "@/validation/collection";
import { defaultCollectionFilter } from "@/validation/collection";
import { adminCollectionSearchParamsParser } from "./search-params.server";

// Re-export for backward compatibility
export { adminCollectionSearchParamsParser };

export const useAdminCollectionSearchParams = ({
  debounceMs = 500,
}: { debounceMs?: number } = {}) => {
  const [searchParams, setSearchParams] = useQueryStates(adminCollectionSearchParamsParser);

  const debouncedSetSearchParams = useMemo(
    () => debounce(setSearchParams, debounceMs),
    [setSearchParams, debounceMs]
  );

  const resetFilters = async (filter?: CollectionFilter) => {
    const newFilter = filter ?? {
      ...defaultCollectionFilter,
    };
    await setSearchParams({ filter: newFilter });
  };

  return {
    searchParams,
    setSearchParams,
    debouncedSetSearchParams,
    resetFilters,
  };
};
