import { Suspense } from "react";

import { SidebarProvider } from "@/components/ui/sidebar";
import { GlobalSearch } from "@/features/global-search/global-search";
import { Footer } from "@/features/landing-page/footer";
import { Header } from "@/features/nav/header";
import { RightSidebarContainer } from "@/features/right-sidebars";
import { HydrateClient } from "@/trpc/server";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <HydrateClient>
      <SidebarProvider defaultLeftOpen={false}>
        <div className="flex h-svh w-full flex-col">
          {/* Header outside the sidebar flex relationship - stays full width */}
          <Header />
          {/* Content area below header - this flex row is affected by sidebar */}
          <div className="flex min-h-0 flex-1">
            <div className="flex-1 overflow-y-auto">
              {children}
              <Footer />
            </div>
            <RightSidebarContainer />
          </div>
        </div>
        <Suspense>
          <GlobalSearch />
        </Suspense>
      </SidebarProvider>
    </HydrateClient>
  );
}
