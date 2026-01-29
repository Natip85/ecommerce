import type { SearchParams } from "nuqs";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { ProductList } from "@/features/products/product-list";
import { loadSearchParams } from "@/features/products/search-params";
import { ShopSidebar } from "@/features/products/shop-sidebar";
import { shopBreadcrumbs } from "@/lib/breadcrumbs";
import { prefetch, trpc } from "@/trpc/server";

// Skip static generation - render dynamically at request time
// Required because layout components use nuqs/useSearchParams
export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<SearchParams>;
};
export default async function ShopPage({ searchParams }: PageProps) {
  const params = await loadSearchParams(searchParams);
  prefetch(trpc.product.storefront.queryOptions(params));
  prefetch(trpc.product.storefrontCollections.queryOptions());
  prefetch(trpc.product.storefrontTags.queryOptions());

  return (
    <div className="flex flex-1 flex-col gap-4 py-6 px-2">
      <Breadcrumbs pages={shopBreadcrumbs} className="px-2" />
      <div className="flex flex-1 gap-3">
        <ShopSidebar />
        <main className="flex-1 min-w-0">
          <ProductList />
        </main>
      </div>
    </div>
  );
}
