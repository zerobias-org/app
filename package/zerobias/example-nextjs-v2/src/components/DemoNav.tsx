"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DEMOS, HOME } from "@/lib/demos";

/**
 * Side navigation — a port of ngx-library's component-showcase shell.
 *
 * Mirrors the showcase's `mat-nav-list` structure (app.component.ts): each item is an
 * anchor holding an icon + a label, and the active item is marked with an `active` class
 * whose only styling is `background: var(--zb-hover-overlay)`. Angular expresses that with
 * `routerLinkActive="active"`; the React equivalent is `usePathname()`.
 *
 * Fixed 220px, and deliberately NO responsive collapse — the showcase's sidenav is
 * `mode="side" opened` at a fixed width with no media queries anywhere, so a collapse here
 * would be an invention rather than parity. If we ever want one, that is a design decision
 * to take knowingly (see docs/component-strategy.md).
 */
export function DemoNav() {
  const pathname = usePathname();
  const items = [HOME, ...DEMOS];

  return (
    <nav className="demo-nav" aria-label="Demos">
      <ul>
        {items.map((item) => {
          // Home matches exactly; demo routes match their subtree, so a nested
          // Phase-3 route keeps its parent highlighted.
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={active ? "active" : undefined}
                aria-current={active ? "page" : undefined}
              >
                <span className="material-symbols-outlined" aria-hidden>
                  {item.icon}
                </span>
                <span className="demo-nav-label">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
