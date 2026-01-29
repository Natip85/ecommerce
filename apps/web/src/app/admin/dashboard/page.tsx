"use client";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/features/admin/page-title";
import { useSidebarParams } from "@/features/right-sidebars/query-params";

export default function AdminDashboardPage() {
  const { toggleInfoSidebarId } = useSidebarParams();
  return (
    <div className="flex flex-1 flex-col gap-4 py-6 pr-4.5 pl-6">
      <PageTitle title="Dashboard" className="mb-5" />
      <Button onClick={() => toggleInfoSidebarId("123")}>Open sidebar</Button>
    </div>
  );
}
