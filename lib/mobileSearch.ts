/** Lets any client surface open the mobile search overlay in the bottom pill. */
const MOBILE_SEARCH_OPEN = "mobile-search-open";

export function requestMobileSearch() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(MOBILE_SEARCH_OPEN));
}

export function onMobileSearchOpen(handler: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(MOBILE_SEARCH_OPEN, handler);
  return () => window.removeEventListener(MOBILE_SEARCH_OPEN, handler);
}
