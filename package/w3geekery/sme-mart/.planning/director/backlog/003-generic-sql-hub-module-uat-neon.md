---
id: "003"
priority: medium
scope: sme-mart
effort: medium
found: 2026-04-21
status: open
promoted_to: null
---

# Stand up Generic SQL Hub Module on UAT — drive Neon through it

Today `dbMode: 'neon'` in every environment points SME Mart directly at Neon over the HTTP driver, with the connection string embedded in `environment.vercel.ts` (and regenerated into `environment.neon.ts` locally). The long-term plan is `dbMode: 'hub'` — the app talks to the ZeroBias Hub, which proxies to Neon through the Generic SQL module connector. This backlog item is to finally wire that up on UAT now that UAT is live.

## Why now

- UAT publish pipeline is stable (2026-04-21).
- `environment.vercel.ts` currently contains a live Neon password — pre-existing, but worth retiring along with direct DB access.
- Removes the need to regenerate `environment.neon.ts` on every dev machine.
- Unblocks the `smeMartConnectionId: ''` TODO in `environment.uat.ts`.

## Scope (rough)

1. Provision a Generic SQL module connection on UAT against the `SME Marketplace DEV` Neon instance.
2. Record the `smeMartConnectionId` UUID — populate in `environment.uat.ts`.
3. Smoke-test `SmeMartDbService` with `dbMode: 'hub'` against UAT — verify parity with current Neon-direct results (engagements list, provider search, task queries).
4. Once green, flip `dbMode: 'hub'` in `environment.uat.ts` and rip out the Neon-HTTP code path from UAT builds.
5. Roll the same module onto the `poc/sme-mart` Vercel deployment — then remove the embedded Neon password from `environment.vercel.ts`.

## Open questions

- Does Generic SQL module support all the queries `SmeMartDbService` emits (views-only reads, individual-table writes)? Likely yes per the architecture rule, but confirm with a smoke test before cutover.
- Auth flow for hub-mode calls in a static SPA deployed to Vercel (no API key on the client). Probably answered by the existing ZB client lifecycle, but worth verifying.
- Performance delta: direct Neon HTTP vs Hub proxy. Measure list/detail screens before + after.

## Prerequisite / dependency

- Kevin confirms the SME Mart receiver pipeline is healthy on UAT (already migrated, may already be green — verify before layering Generic SQL on top).
- UAT Neon boundary (`c15fb2dc-...`) is the right target — confirmed post-cutover.

## Acceptance

- `environment.uat.ts` has a real `smeMartConnectionId` and `dbMode: 'hub'`.
- `environment.vercel.ts` has no embedded Neon credentials.
- All read/write paths that work on direct-Neon also work on Hub-Neon.
