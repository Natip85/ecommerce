"use client";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/features/admin/page-title";
import { useSidebarParams } from "@/features/right-sidebars/query-params";
import { adminDashboardBreadcrumbs } from "@/lib/breadcrumbs";

export default function AdminDashboardPage() {
  const { toggleInfoSidebarId } = useSidebarParams();
  return (
    <div className="flex flex-1 flex-col gap-4 py-6 pr-4.5 pl-6">
      <Breadcrumbs
        pages={adminDashboardBreadcrumbs}
        className="mb-2"
      />
      <PageTitle
        title="Dashboard"
        className="mb-5"
      />
      <Button onClick={() => toggleInfoSidebarId("123")}>Open sidebar</Button>
    </div>
  );
}
