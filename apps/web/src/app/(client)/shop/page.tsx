import type { SearchParams } from "nuqs";

import { ProductList } from "@/features/products/product-list";
import { loadSearchParams } from "@/features/products/search-params";
import { ShopSidebar } from "@/features/products/shop-sidebar";
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
    <div className="flex flex-1 gap-3 py-6 px-2">
      <ShopSidebar />
      <main className="flex-1 min-w-0">
        <ProductList />
      </main>
    </div>
  );
}
