import type { SearchParams } from "nuqs";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { ProductList } from "@/features/products/product-list";
import { loadSearchParams } from "@/features/products/search-params";
import { ShopSidebar } from "@/features/products/shop-sidebar";
import { shopBreadcrumbs } from "@/lib/breadcrumbs";
import { prefetch, trpc } from "@/trpc/server";

type PageProps = {
  searchParams: Promise<SearchParams>;
};
export default async function ShopPage({ searchParams }: PageProps) {
  const params = await loadSearchParams(searchParams);
  prefetch(trpc.product.storefront.queryOptions(params));
  prefetch(trpc.product.storefrontCollections.queryOptions());
  prefetch(trpc.product.storefrontTags.queryOptions());

  return (
    <div className="flex flex-1 flex-col gap-4 px-2 py-6">
      <Breadcrumbs
        pages={shopBreadcrumbs}
        className="px-2"
      />
      <div className="flex flex-1 gap-3">
        <ShopSidebar />
        <main className="min-w-0 flex-1">
          <ProductList />
        </main>
      </div>
    </div>
  );
}
