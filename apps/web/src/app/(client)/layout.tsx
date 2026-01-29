import dynamic from "next/dynamic";

import { SidebarProvider } from "@/components/ui/sidebar";
import { Footer } from "@/features/landing-page/footer";
import { Header } from "@/features/nav/header";
import { HydrateClient } from "@/trpc/server";

// Dynamically import components that use nuqs (useSearchParams)
// with ssr: false to prevent static generation issues
const RightSidebarContainer = dynamic(
  () =>
    import("@/features/right-sidebars").then(
      (mod) => mod.RightSidebarContainer,
    ),
  { ssr: false },
);

const GlobalSearch = dynamic(
  () =>
    import("@/features/global-search/global-search").then(
      (mod) => mod.GlobalSearch,
    ),
  { ssr: false },
);

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <HydrateClient>
      <SidebarProvider defaultLeftOpen={false}>
        <div className="flex h-svh flex-1 flex-col overflow-y-auto">
          <Header />
          {children}
          <Footer />
        </div>
        <RightSidebarContainer />
        <GlobalSearch />
      </SidebarProvider>
    </HydrateClient>
  );
}
