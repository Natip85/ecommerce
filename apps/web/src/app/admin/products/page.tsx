import { Plus } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Suspense } from "react";

import type { SearchParams } from "nuqs";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageTitle } from "@/features/admin/page-title";
import { loadAdminProductSearchParams } from "@/features/admin/products/search-params.server";
import { prefetch, trpc } from "@/trpc/server";



const AdminProductsList = dynamic(() =>
  import("@/features/admin/products/admin-products-list").then((mod) => ({
    default: mod.AdminProductsList,
  })),
);

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function ProductsPage({ searchParams }: PageProps) {
  const params = await loadAdminProductSearchParams(searchParams);
  prefetch(trpc.product.list.queryOptions(params));

  return (
    <div className="flex flex-1 flex-col gap-4 py-6 pr-4.5 pl-6">
      <PageTitle title="Products">
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus /> Add product
          </Link>
        </Button>
      </PageTitle>
      <Suspense fallback={<Skeleton />}>
        <AdminProductsList />
      </Suspense>
    </div>
  );
}
