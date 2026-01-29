"use client";

import { AnimatePresence, motion } from "motion/react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { useSidebarParams } from "./query-params";
import { RightSidebar, useSidebar } from "./right-sidebar";

const ProductInfoSidebar = dynamic(() =>
  import("./product-info-sidebar").then((mod) => ({
    default: mod.ProductInfoSidebar,
  })),
);

const ProductFilterSidebar = dynamic(() =>
  import("./product-filter-sidebar").then((mod) => ({
    default: mod.ProductFilterSidebar,
  })),
);

export const RightSidebarContainer = () => {
  const { sidebarParams, setSidebarParams } = useSidebarParams();

  const pathname = usePathname();
  const { setOpen, open } = useSidebar("right");

  const hasSidebarParams = Object.values(sidebarParams).some(Boolean);

  // TODO: check if we can remove this now that we are not using cookies
  const checkSidebar = () => {
    // closing reasons
    const noParams = !hasSidebarParams && open;
    // staying open reasons

    const shouldClose = noParams;

    if (shouldClose) {
      setOpen(false);
      void setSidebarParams(null);
    } else if (hasSidebarParams && !open) {
      setOpen(true);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      checkSidebar();
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [pathname, open, hasSidebarParams]); // eslint-disable-line react-hooks/exhaustive-deps

  // Get the current active component key for animation
  const getActiveKey = () => {
    if (sidebarParams.infoId) return "asset-info";
    if (sidebarParams.filterSaving) return "create-smart-list";
    if (sidebarParams.filterOpen && !sidebarParams.filterSaving)
      return "product-filter";
    return null;
  };

  return (
    <RightSidebar
      className="h-svh"
      onClose={() => {
        void setSidebarParams(null);
      }}
    >
      <AnimatePresence mode="wait">
        {getActiveKey() && (
          <motion.div
            key={getActiveKey()}
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="flex h-svh flex-col"
          >
            {sidebarParams.infoId && <ProductInfoSidebar />}
            {sidebarParams.filterOpen && !sidebarParams.filterSaving && (
              <ProductFilterSidebar />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </RightSidebar>
  );
};
