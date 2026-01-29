"use client";

import { useQuery } from "@tanstack/react-query";
import { Filter, ChevronDown } from "lucide-react";
import { useRef, type RefObject } from "react";
import { useResizeObserver } from "usehooks-ts";

import { useProductListSearchParams } from "./search-params";
import { SortMenu } from "./sort-menu";

import {
  ListRenderer,
  ListRendererEmpty,
  ListRendererList,
  ListRendererListItem,
  ListRendererLoading,
  ListRendererNoResults,
} from "@/components/list-renderer";
import { PaginationRow } from "@/components/pagination-row";
import {
  ProductCard,
  ProductCardImage,
  ProductCardContent,
  ProductCardFooter,
  calcDiscount,
  isInStock,
} from "@/components/product/product-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSidebarParams } from "@/features/right-sidebars/query-params";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store";
import { useTRPC } from "@/trpc";


// Grid breakpoints based on container width
const GRID_5_COLS = 1300;
const GRID_4_COLS = 1200;
const GRID_3_COLS = 800;
const GRID_2_COLS = 420;

const getGridCols = (width: number) => {
  if (width >= GRID_5_COLS) return 5;
  if (width >= GRID_4_COLS) return 4;
  if (width >= GRID_3_COLS) return 3;
  if (width >= GRID_2_COLS) return 2;
  return 1;
};

export const ProductList = () => {
  const trpc = useTRPC();
  const { searchParams, setSearchParams } = useProductListSearchParams();
  const { toggleFilterOpen, toggleInfoSidebarId, sidebarParams } =
    useSidebarParams();

  const ref = useRef<HTMLDivElement>(null);
  const { width = 0 } = useResizeObserver({
    ref: ref as RefObject<HTMLElement>,
    box: "border-box",
  });

  const gridCols = getGridCols(width);

  const { data, isPending } = useQuery(
    trpc.product.storefront.queryOptions(searchParams),
  );

  const hasQuery = Boolean(searchParams.q && searchParams.q.length > 0);

  return (
    <div>
      <div className="flex justify-between items-center gap-3 mb-5 ">
        {data?.total !== undefined && (
          <div className="flex items-center gap-2">
            <p className="text-sm ">Results: </p>
            <Badge variant="outline">
              {data.total} {data.total === 1 ? "product" : "products"}
            </Badge>
          </div>
        )}
        <div className="flex items-center gap-3">
          <SortMenu />
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleFilterOpen("new")}
            className="flex transition-all duration-300 ease-in-out"
          >
            <Filter className="size-4 mr-3" />
            Filters
            <ChevronDown
              className={cn(
                "size-4 transition-transform duration-200",
                sidebarParams.filterOpen && "rotate-270",
              )}
            />
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <div ref={ref} className="mb-10">
          <ListRenderer
            hasData={Boolean(data?.items && data.items.length > 0)}
            isLoading={isPending}
            hasSearch={hasQuery}
            viewMode={searchParams.viewMode}
          >
            <ListRendererLoading />

            <ListRendererEmpty>
              <div className="col-span-full flex h-full flex-col items-center justify-center gap-6">
                <p className="text-muted-foreground">No results found</p>
              </div>
            </ListRendererEmpty>

            <ListRendererNoResults>
              <div className="col-span-full flex h-full flex-col items-center justify-center gap-6">
                <p className="text-muted-foreground">No results found</p>
              </div>
            </ListRendererNoResults>

            <ListRendererList>
              <ListRendererListItem type={"grid"}>
                <div
                  className="grid gap-2"
                  style={{
                    gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
                  }}
                >
                  {data?.items.map((item) => {
                    const variant = item.variants?.[0];
                    const price = variant?.price
                      ? parseFloat(variant.price)
                      : 0;
                    const compareAtPrice = variant?.compareAtPrice
                      ? parseFloat(variant.compareAtPrice)
                      : undefined;
                    const inStock = isInStock(variant);

                    return (
                      <ProductCard
                        key={item.id}
                        onClick={() => toggleInfoSidebarId(item.id)}
                        productId={item.id}
                        variantId={variant?.id}
                      >
                        <ProductCardImage
                          src={item.images?.[0]?.url}
                          alt={item.title}
                          badge={item.tags?.[0]}
                          discount={calcDiscount(price, compareAtPrice)}
                          inStock={inStock}
                          onAddToCart={() => {
                            useCartStore.getState().addItem({
                              productId: item.id,
                              variantId: variant?.id,
                              title: item.title,
                              description: (item as { description?: string })
                                .description,
                              price,
                              compareAtPrice,
                              imageUrl: item.images?.[0]?.url,
                            });
                          }}
                        />
                        <ProductCardContent
                          title={item.title}
                          description={
                            (item as { description?: string }).description
                          }
                        />
                        <ProductCardFooter
                          price={price}
                          compareAtPrice={compareAtPrice}
                          inStock={inStock}
                          onAddToCart={() => {
                            useCartStore.getState().addItem({
                              productId: item.id,
                              variantId: variant?.id,
                              title: item.title,
                              description: (item as { description?: string })
                                .description,
                              price,
                              compareAtPrice,
                              imageUrl: item.images?.[0]?.url,
                            });
                          }}
                        />
                      </ProductCard>
                    );
                  })}
                </div>
              </ListRendererListItem>
            </ListRendererList>
          </ListRenderer>
        </div>
        <PaginationRow
          total={data?.total}
          limit={searchParams.limit}
          currentPage={searchParams.page}
          onPageChange={(page) => {
            void setSearchParams({ page });
          }}
          onPageSizeChange={(pageSize) => {
            void setSearchParams({ limit: pageSize, page: 1 });
          }}
        />
      </div>
    </div>
  );
};
