export const ACTIVATE_SIDEBAR_SEARCH_EVENT = "rt:activate-sidebar-search";
export const OPEN_MOBILE_SEARCH_EVENT = "rt:open-mobile-search";

export function isEditableTarget(el: Element | null | undefined): boolean {
  if (!el || !(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return true;
  if (el.isContentEditable) return true;
  return el.getAttribute("role") === "textbox";
}

export function isSlashKey(e: KeyboardEvent): boolean {
  return e.key === "/" || e.code === "Slash";
}

/** The first visible search field registered for the / shortcut. */
export function visibleSlashSearchInput(): HTMLInputElement | null {
  const scopes = [document.querySelector("main.site-main"), document];
  for (const scope of scopes) {
    if (!scope) continue;
    for (const node of scope.querySelectorAll<HTMLInputElement>("[data-slash-search]")) {
      if (node.disabled) continue;
      const rect = node.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) continue;
      if (node.offsetParent === null && getComputedStyle(node).position !== "fixed") continue;
      return node;
    }
  }
  return null;
}

export function focusSlashSearch(): boolean {
  const input = visibleSlashSearchInput();
  if (!input) return false;
  input.focus();
  return true;
}

export function requestSidebarSearchActivation(): void {
  window.dispatchEvent(new CustomEvent(ACTIVATE_SIDEBAR_SEARCH_EVENT));
}

export function requestMobileSearchOpen(): void {
  window.dispatchEvent(new CustomEvent(OPEN_MOBILE_SEARCH_EVENT));
}
