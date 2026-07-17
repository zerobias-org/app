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
    <header className="app-header">
      <div className="app-header-left">
        <Link href="/" className="brand">
          <span className="brand-mark">ZB</span>
          ZeroBias <span>v2 Example</span>
        </Link>
      </div>
      <div className="app-header-right">
        <UserMenu />
      </div>
    </header>
  );
}
