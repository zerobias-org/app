"use client";

import Link from "next/link";
import { useSession } from "@/context/session-context";
import { DEMOS } from "@/lib/demos";

function CodeGlyph() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 8l-4 4 4 4M15 8l4 4-4 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Demos come from the registry (src/lib/demos.ts) — the same list the side nav renders,
// so a new demo appears in both places from one edit.

export default function Home() {
  const { user, org } = useSession();

  return (
    <div>
      <section className="intro">
        <h1>ZeroBias v2 — Next.js reference app</h1>
        <p className="lead">
          Built on <strong>Next.js</strong> (App Router, React) + the ZeroBias v2 client + SDKs. It
          mirrors <code>example-angular-v2</code>: the{" "}
          <strong>project → board → task</strong> surface, with read demos and code-reveal write
          demos (which show the SDK call without ever issuing it).
        </p>
      </section>

      <section className="session-card">
        <div className="session-card-head">
          <h2>Your session</h2>
        </div>
        <div className="session-card-body">
          {user ? (
            <>
              <dl className="session-grid">
                <div>
                  <dt>Signed in as</dt>
                  <dd>{user.name}</dd>
                </div>
                {user.emails?.length ? (
                  <div>
                    <dt>Email</dt>
                    <dd>{String(user.emails[0])}</dd>
                  </div>
                ) : null}
                <div>
                  <dt>Organization</dt>
                  <dd>{org?.name ?? "—"}</dd>
                </div>
              </dl>
              <p className="session-hint">
                The client bootstrapped on load and established this session (platform SSO when
                deployed; an API key via the dev proxy locally). Every SDK call routes through{" "}
                <code>useSession().api</code>.
              </p>
            </>
          ) : (
            <p className="session-hint">Resolving your session…</p>
          )}
        </div>
      </section>

      <div className="app-cards">
        {DEMOS.map((d) => (
          <Link key={d.href} href={d.href} className="app-card">
            <div className="app-card-head">
              <span className="app-card-icon">
                <CodeGlyph />
              </span>
              <h3>{d.title}</h3>
            </div>
            <p className="app-card-desc">{d.body}</p>
            <div className="app-card-foot">
              <code>{d.call}</code>
              <span className="launch">Launch →</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
