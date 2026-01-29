"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Tag,
  TrendingUp,
  ChevronRight,
  LayoutGrid,
  Folder,
} from "lucide-react";

import { useProductListSearchParams } from "./search-params";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc";



type QuickLink = {
  label: string;
  icon: React.ElementType;
  filter: Record<string, unknown>;
  description?: string;
};

const quickLinks: QuickLink[] = [
  {
    label: "On Sale",
    icon: Tag,
    filter: { onSale: true },
    description: "Save big",
  },
  {
    label: "Best Sellers",
    icon: TrendingUp,
    filter: { tags: ["best-seller"] },
    description: "Top picks",
  },
];

export function ShopSidebar() {
  const trpc = useTRPC();
  const { searchParams, setSearchParams } = useProductListSearchParams();

  const { data: collections, isLoading: collectionsLoading } = useQuery(
    trpc.product.storefrontCollections.queryOptions(),
  );

  const { data: tags, isLoading: tagsLoading } = useQuery(
    trpc.product.storefrontTags.queryOptions(),
  );

  const handleCollectionClick = (collectionId: string) => {
    const currentCollections = searchParams.filter?.collectionIds ?? [];
    const isSelected = currentCollections.includes(collectionId);
    const newCollections = isSelected
      ? currentCollections.filter((id) => id !== collectionId)
      : [...currentCollections, collectionId];

    const newFilter = {
      ...searchParams.filter,
      collectionIds: newCollections.length > 0 ? newCollections : undefined,
    };

    // Clean up undefined values
    const cleanFilter = Object.fromEntries(
      Object.entries(newFilter).filter(([, v]) => v !== undefined),
    );

    void setSearchParams({
      filter: Object.keys(cleanFilter).length > 0 ? cleanFilter : null,
      page: 1,
    });
  };

  const handleTagClick = (tagValue: string) => {
    const currentTags = searchParams.filter?.tags ?? [];
    const isSelected = currentTags.includes(tagValue);
    const newTags = isSelected
      ? currentTags.filter((t) => t !== tagValue)
      : [...currentTags, tagValue];

    const newFilter = {
      ...searchParams.filter,
      tags: newTags.length > 0 ? newTags : undefined,
    };

    // Clean up undefined values
    const cleanFilter = Object.fromEntries(
      Object.entries(newFilter).filter(([, v]) => v !== undefined),
    );

    void setSearchParams({
      filter: Object.keys(cleanFilter).length > 0 ? cleanFilter : null,
      page: 1,
    });
  };

  const handleQuickLinkClick = (filter: Record<string, unknown>) => {
    const newFilter = { ...searchParams.filter };

    // Handle onSale toggle
    if ("onSale" in filter) {
      if (newFilter.onSale === filter.onSale) {
        delete newFilter.onSale;
      } else {
        newFilter.onSale = filter.onSale as boolean;
      }
    }

    // Handle tags toggle (for best-seller)
    if ("tags" in filter && Array.isArray(filter.tags)) {
      const filterTags = filter.tags as string[];
      const currentTags = newFilter.tags ?? [];
      const allTagsActive = filterTags.every((t) => currentTags.includes(t));

      if (allTagsActive) {
        // Remove these tags
        newFilter.tags = currentTags.filter((t) => !filterTags.includes(t));
        if (newFilter.tags.length === 0) {
          delete newFilter.tags;
        }
      } else {
        // Add these tags
        newFilter.tags = [...new Set([...currentTags, ...filterTags])];
      }
    }

    void setSearchParams({
      filter: Object.keys(newFilter).length > 0 ? newFilter : null,
      page: 1,
    });
  };

  const handleClearAll = () => {
    void setSearchParams({
      filter: null,
      page: 1,
    });
  };

  const isCollectionSelected = (collectionId: string) =>
    searchParams.filter?.collectionIds?.includes(collectionId) ?? false;

  const isTagSelected = (tagValue: string) =>
    searchParams.filter?.tags?.includes(tagValue) ?? false;

  const hasActiveFilters =
    (searchParams.filter?.collectionIds?.length ?? 0) > 0 ||
    (searchParams.filter?.tags?.length ?? 0) > 0 ||
    searchParams.filter?.onSale;

  return (
    <aside className="w-40 shrink-0 hidden md:block">
      <div className="sticky top-20 space-y-6">
        {/* Shop by section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <LayoutGrid className="size-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold tracking-tight">Shop by</h3>
          </div>
          <nav className="space-y-1">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                link.filter.onSale === true
                  ? searchParams.filter?.onSale === true
                  : link.filter.tags
                    ? (link.filter.tags as string[]).every((t) =>
                        searchParams.filter?.tags?.includes(t),
                      )
                    : false;

              return (
                <button
                  key={link.label}
                  onClick={() => handleQuickLinkClick(link.filter)}
                  className={cn(
                    "group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all",
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-4 transition-colors",
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground group-hover:text-foreground",
                    )}
                  />
                  <span className="flex-1 text-left">{link.label}</span>
                  <ChevronRight
                    className={cn(
                      "size-3.5 opacity-0 -translate-x-1 transition-all",
                      "group-hover:opacity-100 group-hover:translate-x-0",
                      isActive && "opacity-100 translate-x-0",
                    )}
                  />
                </button>
              );
            })}
          </nav>
        </div>

        <Separator />

        {/* Collections */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Folder className="size-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold tracking-tight">
              Collections
            </h3>
          </div>
          <nav className="space-y-1">
            {collectionsLoading ? (
              <CollectionsSkeleton />
            ) : collections && collections.length > 0 ? (
              collections.map((collection) => (
                <button
                  key={collection.id}
                  onClick={() => handleCollectionClick(collection.id)}
                  className={cn(
                    "group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                    isCollectionSelected(collection.id)
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <span className="flex-1 text-left truncate">
                    {collection.title}
                  </span>
                  {collection.productCount > 0 && (
                    <span
                      className={cn(
                        "text-xs tabular-nums",
                        isCollectionSelected(collection.id)
                          ? "text-primary/70"
                          : "text-muted-foreground/60",
                      )}
                    >
                      {collection.productCount}
                    </span>
                  )}
                </button>
              ))
            ) : (
              <p className="text-xs text-muted-foreground px-3 py-2">
                No collections yet
              </p>
            )}
          </nav>
        </div>

        {/* Popular Tags */}
        {tags && tags.length > 0 && (
          <>
            <Separator />
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Tag className="size-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold tracking-tight">
                  Popular Tags
                </h3>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {tagsLoading ? (
                  <TagsSkeleton />
                ) : (
                  tags.slice(0, 10).map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => handleTagClick(tag.value)}
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium transition-all",
                        isTagSelected(tag.value)
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                      )}
                    >
                      {tag.value}
                    </button>
                  ))
                )}
              </div>
            </div>
          </>
        )}

        {/* Clear filters button */}
        {hasActiveFilters && (
          <div className=" flex items-center gap-2 flex-col">
            <Separator />
            <Button onClick={handleClearAll} className="w-full">
              Clear all filters
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
}

function CollectionsSkeleton() {
  return (
    <div className="space-y-1">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2">
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-6" />
        </div>
      ))}
    </div>
  );
}

function TagsSkeleton() {
  return (
    <>
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} className="h-6 w-16 rounded-full" />
      ))}
    </>
  );
}
