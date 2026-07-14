"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { RedThreadWordmark } from "@/components/Brand";
import { SidebarSearch } from "@/components/HeaderSearch";
import { NavIcon } from "@/components/nav/NavIcons";
import { PRIMARY_NAV, SECONDARY_NAV, isNavActive } from "@/lib/navSections";

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
    const frame = window.requestAnimationFrame(() => {
      if (stored === "1") setCollapsed(true);
      setMounted(true);
    });
    return () => window.cancelAnimationFrame(frame);
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
  const secondaryActive = SECONDARY_NAV.some((item) => isNavActive(pathname, item.href));

  const navItem = (item: (typeof PRIMARY_NAV)[number] | (typeof SECONDARY_NAV)[number]) => {
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
  };

  return (
    <aside
      className={[
        "site-sidebar hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:flex",
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
          <div className="site-sidebar-group">
            {!collapsed && <p className="site-sidebar-group-label">Red Thread</p>}
            <ul className="site-sidebar-group-list">{PRIMARY_NAV.map(navItem)}</ul>
          </div>
          <details className="site-sidebar-secondary" open={secondaryActive || undefined}>
            <summary
              className={["site-sidebar-link", secondaryActive ? "site-sidebar-link--active" : ""].filter(Boolean).join(" ")}
              title={collapsed ? "More sections" : undefined}
              data-tooltip={collapsed ? "More sections" : undefined}
            >
              <span className="site-sidebar-link-icon"><NavIcon id="analytics" /></span>
              <span className="site-sidebar-link-label">More</span>
              <span className="site-sidebar-secondary-chevron" aria-hidden>⌄</span>
            </summary>
            <ul className="site-sidebar-group-list site-sidebar-secondary-list">{SECONDARY_NAV.map(navItem)}</ul>
          </details>
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
