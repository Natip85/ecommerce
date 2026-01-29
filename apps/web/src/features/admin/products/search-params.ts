"use client";

import { defaultProductFilter, type ProductFilter } from "@ecommerce/api/schemas";
import { debounce } from "lodash-es";
import { useQueryStates } from "nuqs";
import { useMemo } from "react";

import { adminProductSearchParamsParser, type ViewMode } from "./search-params.server";

// Re-export for backward compatibility
export { adminProductSearchParamsParser, type ViewMode };

export const useAdminProductSearchParams = ({
  debounceMs = 500,
}: { debounceMs?: number } = {}) => {
  const [searchParams, setSearchParams] = useQueryStates(
    adminProductSearchParamsParser
  );

  const debouncedSetSearchParams = useMemo(
    () => debounce(setSearchParams, debounceMs),
    [setSearchParams, debounceMs]
  );

  const resetFilters = async (filter?: ProductFilter) => {
    const newFilter = filter ?? {
      ...defaultProductFilter,
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
