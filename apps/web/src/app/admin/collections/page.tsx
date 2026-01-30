import type { SearchParams } from "nuqs";
import { Suspense } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Plus } from "lucide-react";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { loadAdminCollectionSearchParams } from "@/features/admin/collections/search-params.server";
import { PageTitle } from "@/features/admin/page-title";
import { adminCollectionsBreadcrumbs } from "@/lib/breadcrumbs";
import { prefetch, trpc } from "@/trpc/server";

const AdminCollectionsList = dynamic(() =>
  import("@/features/admin/collections/admin-collections-list").then((mod) => ({
    default: mod.AdminCollectionsList,
  }))
);

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function CollectionsPage({ searchParams }: PageProps) {
  const params = await loadAdminCollectionSearchParams(searchParams);
  prefetch(trpc.collection.list.queryOptions(params));

  return (
    <div className="flex flex-1 flex-col gap-4 py-6 pr-4.5 pl-6">
      <Breadcrumbs
        pages={adminCollectionsBreadcrumbs}
        className="mb-2"
      />
      <PageTitle title="Collections">
        <Button asChild>
          <Link href="/admin/collections/new">
            <Plus /> Add collection
          </Link>
        </Button>
      </PageTitle>
      <Suspense fallback={<Skeleton />}>
        <AdminCollectionsList />
      </Suspense>
    </div>
  );
}
