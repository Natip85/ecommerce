import { SidebarProvider } from "@/components/ui/sidebar";
import { GlobalSearch } from "@/features/global-search/global-search";
import { Footer } from "@/features/landing-page/footer";
import { Header } from "@/features/nav/header";
import { RightSidebarContainer } from "@/features/right-sidebars";
import { HydrateClient } from "@/trpc/server";

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
