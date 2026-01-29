import { SidebarProvider } from "@/components/ui/sidebar";
import { Footer } from "@/features/landing-page/footer";
import { ClientLayoutComponents } from "@/features/layout/client-layout-components";
import { Header } from "@/features/nav/header";
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
        <ClientLayoutComponents />
      </SidebarProvider>
    </HydrateClient>
  );
}
