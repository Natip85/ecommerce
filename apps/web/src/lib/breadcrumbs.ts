import type { BreadcrumbPageType } from "@/components/breadcrumbs";

// Base breadcrumb definitions
export const homeBreadcrumb: BreadcrumbPageType = { href: "/", label: "Home" };

export const shopBreadcrumb: BreadcrumbPageType = { href: "/shop", label: "Shop" };

export const cartBreadcrumb: BreadcrumbPageType = { href: "/cart", label: "Cart" };

export const adminBreadcrumb: BreadcrumbPageType = { href: "/admin", label: "Admin" };

// Common breadcrumb arrays
export const shopBreadcrumbs: BreadcrumbPageType[] = [homeBreadcrumb, shopBreadcrumb];

export const cartBreadcrumbs: BreadcrumbPageType[] = [homeBreadcrumb, cartBreadcrumb];

export const adminDashboardBreadcrumbs: BreadcrumbPageType[] = [
  adminBreadcrumb,
  { href: "/admin/dashboard", label: "Dashboard" },
];

export const adminProductsBreadcrumbs: BreadcrumbPageType[] = [
  adminBreadcrumb,
  { href: "/admin/products", label: "Products" },
];

export const adminUsersBreadcrumbs: BreadcrumbPageType[] = [
  adminBreadcrumb,
  { href: "/admin/users", label: "Users" },
];

export const adminCollectionsBreadcrumbs: BreadcrumbPageType[] = [
  adminBreadcrumb,
  { href: "/admin/collections", label: "Collections" },
];

// Factory functions for dynamic breadcrumbs
export function createProductDetailBreadcrumbs(
  productId: string,
  productTitle: string
): BreadcrumbPageType[] {
  return [homeBreadcrumb, shopBreadcrumb, { href: `/shop/${productId}`, label: productTitle }];
}

export function createAdminProductDetailBreadcrumbs(
  productId: string,
  productTitle?: string
): BreadcrumbPageType[] {
  return [
    adminBreadcrumb,
    { href: "/admin/products", label: "Products" },
    { href: `/admin/products/${productId}`, label: productTitle ?? "Edit Product" },
  ];
}

export function createAdminCollectionDetailBreadcrumbs(
  collectionId: string,
  collectionTitle?: string
): BreadcrumbPageType[] {
  return [
    adminBreadcrumb,
    { href: "/admin/collections", label: "Collections" },
    { href: `/admin/collections/${collectionId}`, label: collectionTitle ?? "Edit Collection" },
  ];
}
