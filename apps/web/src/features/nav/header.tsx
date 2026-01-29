"use client";

import { Menu, Search, Shield, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { NavUser } from "./nav-user";

import type { Route } from "next";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useGlobalSearchParams } from "@/hooks/use-global-search-params";
import { authClient } from "@/lib/auth-client";
import { useCartStore } from "@/store";

const navigation = [
  { name: "Shop", href: "/shop" },
  { name: "About", href: "/about" },
];

export function Header() {
  const [mounted, setMounted] = useState(false);
  const cartCount = useCartStore((state) => state.getTotalQuantity());
  const { data: session } = authClient.useSession();
  const isAdmin = session?.user?.role === "admin";
  const { openGlobalSearch } = useGlobalSearchParams();

  // Only show cart count after hydration to prevent mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Mobile menu */}
        <div className="flex lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="-ml-2">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[200px] p-3">
              <Link href="/" className="flex items-center mt-2">
                <span className="text-xl font-semibold tracking-tight text-foreground">
                  Lumière
                </span>
              </Link>
              <nav className="mt-6 flex flex-col gap-6">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href as Route}
                    className="text-lg font-medium text-foreground transition-colors hover:text-muted-foreground"
                  >
                    {item.name}
                  </Link>
                ))}
                {isAdmin && (
                  <Link
                    href={"/admin" as Route}
                    className="flex items-center gap-2 text-lg font-medium text-foreground transition-colors hover:text-muted-foreground"
                  >
                    <Shield className="h-4 w-4" />
                    Admin
                  </Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>

        {/* Logo */}
        <Link href="/" className="flex items-center">
          <span className="text-xl font-semibold tracking-tight text-foreground">
            Lumière
          </span>
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden lg:flex lg:gap-8">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href as Route}
              className="text-sm font-medium text-foreground transition-colors hover:text-muted-foreground"
            >
              {item.name}
            </Link>
          ))}
          {isAdmin && (
            <Link
              href={"/admin" as Route}
              className="flex items-center gap-1.5 text-sm font-medium text-foreground transition-colors hover:text-muted-foreground"
            >
              <Shield className="h-4 w-4" />
              Admin
            </Link>
          )}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={openGlobalSearch}>
            <Search className="size-5" />
            <span className="sr-only">Search</span>
          </Button>
          <Button variant="ghost" size="sm" className="relative mr-2" asChild>
            <Link href="/cart" id="header-cart-icon">
              <ShoppingCart className="size-5" />
              <span className="sr-only">Cart</span>
              {mounted && cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                  {cartCount}
                </span>
              )}
            </Link>
          </Button>
          <NavUser />
        </div>
      </div>
    </header>
  );
}
