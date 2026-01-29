"use client";

import dynamic from "next/dynamic";

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

export function ClientLayoutComponents() {
  return (
    <>
      <RightSidebarContainer />
      <GlobalSearch />
    </>
  );
}
