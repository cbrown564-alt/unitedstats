"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { RedThreadWordmark } from "@/components/Brand";
import { SidebarSearch } from "@/components/HeaderSearch";
import { NavIcon } from "@/components/nav/NavIcons";
import { NAV_GROUPS, isNavActive } from "@/lib/navSections";

const STORAGE_KEY = "rt-sidebar-collapsed";

function CollapseIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      {collapsed ? (
        <polyline points="9 18 15 12 9 6" />
      ) : (
        <>
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <line x1="9" y1="3" x2="9" y2="21" />
          <polyline points="14 12 11 9 14 6" />
        </>
      )}
    </svg>
  );
}

/** Desktop primary navigation — collapsible sidebar (lg+). Mobile uses the floating bottom pill. */
export function SidebarNav() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "1") setCollapsed(true);
    setMounted(true);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.sidebarCollapsed = collapsed ? "1" : "0";
  }, [collapsed]);

  const toggle = useCallback(() => {
    setCollapsed((current) => {
      const next = !current;
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }, []);

  return (
    <aside
      className={[
        "site-sidebar hidden lg:flex",
        collapsed ? "site-sidebar--collapsed" : "",
        mounted ? "" : "site-sidebar--pending",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label="Site navigation"
    >
      <div className="site-sidebar-inner">
        <header className="site-sidebar-header">
          <Link
            href="/"
            className="site-sidebar-brand focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-devil-bright"
          >
            {collapsed ? <RedThreadWordmark hideText markSize={28} /> : <RedThreadWordmark markSize={30} />}
          </Link>
        </header>

        <div className="site-sidebar-search">
          <SidebarSearch collapsed={collapsed} />
        </div>

        <nav aria-label="Primary navigation" className="site-sidebar-nav">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="site-sidebar-group">
              {!collapsed && <p className="site-sidebar-group-label">{group.label}</p>}
              <ul className="site-sidebar-group-list">
                {group.items.map((item) => {
                  const active = isNavActive(pathname, item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        title={collapsed ? item.label : undefined}
                        data-tooltip={collapsed ? item.label : undefined}
                        className={["site-sidebar-link", active ? "site-sidebar-link--active" : ""]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        <span className="site-sidebar-link-icon">
                          <NavIcon id={item.icon} />
                        </span>
                        <span className="site-sidebar-link-label">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <footer className="site-sidebar-rail">
          <button
            type="button"
            onClick={toggle}
            aria-expanded={!collapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="site-sidebar-toggle focus-ring"
          >
            <CollapseIcon collapsed={collapsed} />
            {!collapsed && <span className="site-sidebar-toggle-label">Collapse</span>}
          </button>
        </footer>
      </div>
    </aside>
  );
}
