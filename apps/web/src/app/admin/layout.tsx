import { auth } from "@ecommerce/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  SidebarInset,
  SidebarMobileTrigger,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/features/nav/app-sidebar";
import { RightSidebarContainer } from "@/features/right-sidebars";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/auth/sign-in");
  }

  const isAdmin = session.user.role === "admin";

  if (!isAdmin) {
    redirect("/");
  }

  return (
    <div>
      <SidebarProvider>
        <AppSidebar />

        <SidebarMobileTrigger />
        <SidebarInset>
          <div className="py-8">{children}</div>
        </SidebarInset>
        <RightSidebarContainer />
      </SidebarProvider>
    </div>
  );
}
