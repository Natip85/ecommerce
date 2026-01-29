"use client";

import { debounce } from "lodash-es";
import { useQueryStates } from "nuqs";
import { useMemo } from "react";

import { adminCollectionSearchParamsParser } from "./search-params.server";

import { defaultCollectionFilter, type CollectionFilter } from "@/validation/collection";

// Re-export for backward compatibility
export { adminCollectionSearchParamsParser };

export const useAdminCollectionSearchParams = ({
  debounceMs = 500,
}: { debounceMs?: number } = {}) => {
  const [searchParams, setSearchParams] = useQueryStates(
    adminCollectionSearchParamsParser
  );

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
