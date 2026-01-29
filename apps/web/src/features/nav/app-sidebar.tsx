"use client";

import {
  ChevronsLeft,
  ChevronsRight,
  Key,
  LayoutDashboard,
  ShoppingBag,
  Users2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

import { AdminNavUser } from "./admin-nav-user";
import { NavMain } from "./nav-main";

import type { NavigationItems } from "./nav-types";
import type * as React from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";



const data: NavigationItems = {
  items: [
    {
      title: "Dashboard",
      url: "/admin/dashboard",
      icon: LayoutDashboard as React.ComponentType,
    },
    {
      title: "Users",
      url: "/admin/users",
      icon: Users2 as React.ComponentType,
    },
    {
      title: "Products",
      url: "/admin/products",
      icon: ShoppingBag as React.ComponentType,
    },
  ],
  footerItems: [
    // {
    //   title: "Settings",
    //   url: "/settings",
    //   icon: Settings as React.ComponentType,
    // },
  ],
};

function CustomSidebarTrigger() {
  const { state } = useSidebar();
  return (
    <SidebarTrigger
      className={cn(
        "bg-background text-foreground hover:bg-sidebar hover:text-sidebar-foreground absolute top-14 -right-4 z-50 rounded-full border-0 transition-all duration-300 ease-in-out",
        "[&_svg]:transition-all [&_svg]:duration-300 [&_svg]:ease-in-out active:[&_svg]:scale-125",
        state === "collapsed" ? "cursor-e-resize" : "cursor-w-resize",
      )}
      variant="ghost"
      size="icon"
    >
      {state === "collapsed" ? <ChevronsRight /> : <ChevronsLeft />}
    </SidebarTrigger>
  );
}

export function AppSidebar({
  children,
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { state } = useSidebar();
  return (
    <Sidebar
      collapsible="icon"
      variant="sidebar"
      className="border-border border-r"
      {...props}
    >
      <SidebarHeader>
        <CustomSidebarTrigger />
        <Link
          href="/"
          className="relative mt-4 mb-6 flex h-[24px] items-center justify-center"
        >
          {/* Expanded state - full logo with text */}
          <span
            className={cn(
              "absolute left-1.5 flex items-center gap-5 transition-all duration-300 ease-in-out",
              state === "collapsed"
                ? "scale-0 opacity-0"
                : "scale-100 opacity-100",
            )}
          >
            <div className="text-xl font-semibold tracking-tight text-foreground">
              Lumière
            </div>
          </span>
          {/* Collapsed state - icon/small logo */}
          <span
            className={cn(
              "absolute transition-all duration-300 ease-in-out",
              state === "collapsed"
                ? "scale-100 opacity-100"
                : "scale-0 opacity-0",
            )}
          >
            <div className="text-xs font-semibold tracking-tight text-foreground">
              Lumière
            </div>
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.items} footerItems={data.footerItems}>
          {children}
        </NavMain>
      </SidebarContent>
      <SidebarFooter>
        <Suspense>
          <AdminNavUser />
        </Suspense>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
