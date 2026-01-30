"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Download } from "lucide-react";

import type { NavigationItems } from "./nav-types";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

type NavMainProps = NavigationItems & React.ComponentProps<typeof SidebarGroup>;

export function NavMain({ items, footerItems, children, ...props }: NavMainProps) {
  const pathname = usePathname();
  const { state } = useSidebar();

  return (
    <>
      <SidebarGroup {...props}>
        <SidebarMenu>
          {children}

          {items.map((item) => {
            const isActive =
              pathname === item.url || (item.url !== "/" && pathname.startsWith(item.url + "/"));
            const hasSubmenu = item.submenu && item.submenu.length > 0;
            const isSubmenuActive =
              hasSubmenu &&
              item.submenu?.some(
                (subItem) =>
                  pathname === subItem.url ||
                  (subItem.url !== "/" && pathname.startsWith(subItem.url + "/"))
              );

            if (hasSubmenu) {
              return (
                <Collapsible
                  key={item.title}
                  defaultOpen={isActive || isSubmenuActive}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <div className="flex w-full items-center">
                      <SidebarMenuButton
                        isActive={isActive}
                        size="lg"
                        tooltip={item.title}
                        asChild
                        className="flex-1"
                      >
                        <Link href={item.url as Route}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                      {state !== "collapsed" && (
                        <CollapsibleTrigger
                          asChild
                          className="mr-3 shrink-0"
                        >
                          <Button
                            type="button"
                            variant="ghost"
                            aria-label="Toggle submenu"
                            className="flex items-center justify-center rounded-md p-0"
                          >
                            <ChevronDown className="size-6 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                          </Button>
                        </CollapsibleTrigger>
                      )}
                    </div>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.submenu?.map((subItem) => {
                          const isSubActive =
                            pathname === subItem.url ||
                            (subItem.url !== "/" && pathname.startsWith(subItem.url + "/"));

                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={isSubActive}
                                className="[&_svg]:text-sidebar-foreground! hover:[&_svg]:text-primary!"
                              >
                                <Link href={subItem.url as Route}>
                                  <Download />
                                  <span>{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              );
            }

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  isActive={isActive}
                  asChild
                  size="lg"
                  tooltip={item.title}
                >
                  <Link
                    href={item.url as Route}
                    className={cn(isActive && "bg-(--color-primary)")}
                  >
                    <item.icon className="size-5" />
                    <span>{item.title}</span>
                    {item.hasDropdown && <ChevronDown className="ml-auto" />}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroup>

      {/* Footer navigation items that appear above the user profile */}
      <SidebarGroup className="mt-auto">
        <SidebarMenu>
          {footerItems.map((item) => {
            const isActive =
              pathname === item.url || (item.url !== "/" && pathname.startsWith(item.url + "/"));
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  isActive={isActive}
                  size="lg"
                  asChild
                  tooltip={item.title}
                >
                  <Link href={item.url as Route}>
                    <item.icon className="size-5" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroup>
    </>
  );
}
