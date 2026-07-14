import type { NavIconId } from "@/components/nav/NavIcons";

type NavItem = {
  label: string;
  href: string;
  icon: NavIconId;
};

/** Five destinations visible before any disclosure. */
export const PRIMARY_NAV: readonly NavItem[] = [
  { label: "Stories", href: "/stories", icon: "journey" },
  { label: "Discover", href: "/explore", icon: "discover" },
  { label: "Matches", href: "/matches", icon: "matches" },
  { label: "Seasons", href: "/seasons", icon: "seasons" },
  { label: "Players", href: "/players", icon: "players" },
] as const;

/** Expert record tools remain one disclosure away and fully searchable. */
export const SECONDARY_NAV: readonly NavItem[] = [
  { label: "Managers", href: "/managers", icon: "managers" },
  { label: "Analytics", href: "/analytics", icon: "analytics" },
  { label: "Transfers", href: "/transfers", icon: "transfers" },
  { label: "Data", href: "/data", icon: "data" },
] as const;

export const NAV_SECTIONS = [...PRIMARY_NAV, ...SECONDARY_NAV].map(
  (item) => [item.label, item.href] as const,
);

export function isNavActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  const detailOwner: Readonly<Record<string, readonly string[]>> = {
    "/explore": ["/questions/", "/compare", "/cut"],
    "/matches": ["/match/", "/on-this-day", "/surprise"],
    "/players": ["/player/"],
    "/managers": ["/manager/"],
  };
  if (detailOwner[href]?.some((prefix) => pathname === prefix || pathname.startsWith(prefix))) return true;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function mobileNavLabel(pathname: string): string {
  if (pathname === "/") return "Home";
  const section = NAV_SECTIONS.find(([, href]) => isNavActive(pathname, href));
  return section?.[0] ?? "Explore";
}
