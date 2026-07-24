"use client";

import Link from "next/link";
import { UserMenu } from "./UserMenu";

/**
 * Top bar — brand on the left, org + user on the right.
 *
 * Demo navigation deliberately does NOT live here. It lives in the side rail
 * (`DemoNav`), mirroring ngx-library's component-showcase shell. See
 * docs/component-strategy.md.
 */
export function Header() {
  return (
    <>
      <header className="app-header">
        <div className="app-header-left">
          <Link href="/" className="brand">
            {/* The ZeroBias mark — same navy tile + white "0" the portal app bar uses (from the
                platform nav template). A plain <img> for a tiny static SVG; next/image is overkill. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="brand-icon" src="/app-icon.svg" alt="ZeroBias" width={36} height={36} />
            <span className="brand-name">ZeroBias</span>
            <span className="brand-sub">v2 Example &middot; Next.js</span>
          </Link>
        </div>
        <div className="app-header-right">
          <UserMenu />
        </div>
      </header>
      {/* Portal `.zb-ui-bar` — the 4px cyan->dark accent strip is a SEPARATE element below the
          toolbar, NOT a border-bottom (a border would push the bar to 68px). */}
      <div className="zb-ui-bar" />
    </>
  );
}
