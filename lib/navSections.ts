import type { NavIconId } from "@/components/nav/NavIcons";

type NavItem = {
  label: string;
  href: string;
  icon: NavIconId;
};

export type NavGroup = {
  label: string;
  items: readonly NavItem[];
};

/** Primary site sections — grouped for sidebar, flat list for mobile shell. */
export const NAV_GROUPS: readonly NavGroup[] = [
  {
    label: "Explore",
    items: [
      { label: "Discover", href: "/explore", icon: "discover" },
      { label: "Matches", href: "/matches", icon: "matches" },
      { label: "Seasons", href: "/seasons", icon: "seasons" },
    ],
  },
  {
    label: "People",
    items: [
      { label: "Players", href: "/players", icon: "players" },
      { label: "Managers", href: "/managers", icon: "managers" },
      { label: "Opponents", href: "/opponents", icon: "opponents" },
    ],
  },
  {
    label: "Records",
    items: [
      { label: "Analytics", href: "/analytics", icon: "analytics" },
      { label: "Transfers", href: "/transfers", icon: "transfers" },
      { label: "Data", href: "/data", icon: "data" },
    ],
  },
] as const;

export const NAV_SECTIONS = NAV_GROUPS.flatMap((group) =>
  group.items.map((item) => [item.label, item.href] as const),
);

export function isNavActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function mobileNavLabel(pathname: string): string {
  if (pathname === "/") return "Home";
  const section = NAV_SECTIONS.find(([, href]) => isNavActive(pathname, href));
  return section?.[0] ?? "Explore";
}
