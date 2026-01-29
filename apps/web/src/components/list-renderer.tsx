"use client";

import { createContext, useContext } from "react";

import { cn } from "../lib/utils";
import { Skeleton } from "./ui/skeleton";

import type { ReactNode } from "react";

type ViewMode = "carousel" | "grid" | "grid-detailed" | "list";

type ListRendererContextType = {
  hasData: boolean;
  isLoading: boolean;
  hasSearch: boolean;
  viewMode: ViewMode;
  limit?: number;
};

const ListRendererContext = createContext<ListRendererContextType | null>(null);

function useListRendererContext() {
  const context = useContext(ListRendererContext);
  if (!context) {
    throw new Error(
      "ListRenderer compound components must be used within ListRenderer",
    );
  }
  return context;
}

type ListRendererProps = {
  hasData: boolean;
  isLoading: boolean;
  hasSearch: boolean;
  viewMode: ViewMode;
  limit?: number;
  children: ReactNode;
};

export function ListRenderer({
  hasData,
  isLoading,
  hasSearch,
  viewMode,
  limit,
  children,
}: ListRendererProps) {
  return (
    <ListRendererContext.Provider
      value={{ hasData, isLoading, hasSearch, viewMode, limit }}
    >
      {children}
    </ListRendererContext.Provider>
  );
}

type ListRendererChildProps = {
  children?: ReactNode;
};

type CatalogListSkeletonProps = {
  viewMode: ViewMode;
  limit?: number;
};

function CatalogListSkeleton({
  viewMode,
  limit = 12,
}: CatalogListSkeletonProps) {
  const items = Array.from({ length: limit }, (_, i) => i);

  if (viewMode === "list") {
    return (
      <div className="flex flex-col gap-1">
        {/* Table header skeleton */}
        <div className="flex h-10 items-center gap-4 border-b px-4">
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16 ml-auto" />
        </div>
        {/* Table rows skeleton */}
        {items.map((i) => (
          <div key={i} className="flex h-12 items-center gap-4 border-b px-4">
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16 ml-auto" />
          </div>
        ))}
      </div>
    );
  }

  if (viewMode === "grid-detailed") {
    return (
      <div className="@2col:columns-2 @3col:columns-3 w-full columns-1 gap-3">
        {items.map((i) => (
          <div key={i} className="mb-3 break-inside-avoid">
            <div className="ring-foreground/10 flex flex-col gap-3 rounded-none p-4 ring-1">
              {/* Image skeleton with varying heights for masonry effect */}
              <Skeleton
                className="w-full"
                style={{ height: `${180 + (i % 3) * 60}px` }}
              />
              {/* Title skeleton */}
              <Skeleton className="h-4 w-3/4" />
              {/* Description skeleton */}
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
              {/* Meta info skeleton */}
              <div className="flex items-center gap-2 pt-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-12" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (viewMode === "carousel") {
    return (
      <div className="flex gap-3 overflow-hidden">
        {items.slice(0, 6).map((i) => (
          <div
            key={i}
            className="ring-foreground/10 shrink-0 rounded-none ring-1"
            style={{ width: "200px" }}
          >
            {/* Image skeleton */}
            <Skeleton className="h-[300px] w-full" />
            {/* Content skeleton */}
            <div className="flex flex-col gap-2 p-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Default: grid view
  return (
    <div className="flex flex-wrap content-start gap-3">
      {items.map((i) => (
        <div
          key={i}
          className="ring-foreground/10 shrink-0 rounded-none ring-1"
          style={{ width: "200px", height: "344px" }}
        >
          {/* Image skeleton */}
          <Skeleton className="h-[300px] w-full" />
          {/* Content skeleton */}
          <div className="flex flex-col gap-2 p-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ListRendererLoading({ children }: ListRendererChildProps) {
  const { isLoading, viewMode, limit } = useListRendererContext();

  if (!isLoading) return null;

  if (children) {
    return <>{children}</>;
  }

  return <CatalogListSkeleton viewMode={viewMode} limit={limit} />;
}

export function ListRendererEmpty({ children }: ListRendererChildProps) {
  const { hasData, isLoading, hasSearch } = useListRendererContext();

  if (isLoading || hasData || hasSearch) return null;

  return <>{children}</>;
}

export function ListRendererNoResults({ children }: ListRendererChildProps) {
  const { hasData, isLoading, hasSearch } = useListRendererContext();

  if (isLoading || hasData || !hasSearch) return null;

  return <>{children}</>;
}

export function ListRendererList({
  children,
  className,
  ...props
}: ListRendererChildProps & React.HTMLAttributes<HTMLDivElement>) {
  const { hasData, isLoading } = useListRendererContext();

  if (isLoading || !hasData) return null;

  return (
    <div {...props} className={cn("", className)}>
      {children}
    </div>
  );
}

export type ListRendererViewType =
  | "carousel"
  | "grid"
  | "grid-detailed"
  | "list";

type ListRendererListItemProps = {
  type: ListRendererViewType | ListRendererViewType[];
  children: ReactNode;
};
export function ListRendererListItem({
  type,
  children,
}: ListRendererListItemProps) {
  const { viewMode } = useListRendererContext();

  if (Array.isArray(type) ? !type.includes(viewMode) : viewMode !== type)
    return null;

  return <>{children}</>;
}
