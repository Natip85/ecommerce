export type NavSubMenuItem = {
  title: string;
  url: string;
};

export type NavMainItem = {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string } & React.SVGProps<SVGSVGElement>>;
  hasDropdown?: boolean;
  submenu?: NavSubMenuItem[];
};

export type NavFooterItem = Omit<NavMainItem, "hasDropdown" | "submenu">;

export type NavigationItems = {
  items: NavMainItem[];
  footerItems: NavFooterItem[];
};
