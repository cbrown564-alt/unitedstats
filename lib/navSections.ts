/** Primary site sections — shared by desktop rail and mobile shell. */
export const NAV_SECTIONS = [
  ["Discover", "/explore"],
  ["Matches", "/matches"],
  ["Seasons", "/seasons"],
  ["Players", "/players"],
  ["Managers", "/managers"],
  ["Opponents", "/opponents"],
  ["Analytics", "/analytics"],
  ["Transfers", "/transfers"],
  ["Data", "/data"],
] as const;

export function isNavActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function mobileNavLabel(pathname: string): string {
  if (pathname === "/") return "Home";
  const section = NAV_SECTIONS.find(([, href]) => isNavActive(pathname, href));
  return section?.[0] ?? "Explore";
}
