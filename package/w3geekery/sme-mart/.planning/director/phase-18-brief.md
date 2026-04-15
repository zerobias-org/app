# Phase 18 — Org Switcher

**Milestone:** v1.3
**Est:** 4–8 hrs
**Repos:** `app/` (SME Mart only)

## Goal

Replace the "edit sessionStorage + cookies via DevTools" workflow with a first-class user-menu dropdown that switches the active ZB org and updates Dana cookie + sessionStorage via the SDK.

## Architecture

- **Reference (not literal copy):** `~/Projects/zb/ui/` portal user-menu component. Read the component, understand its inputs/outputs/side effects, then build an SME Mart version. The SME Mart auth surface and menu layout may differ — don't copy blindly.
- **SDK call:** `app.selectOrg(org)` writes the Dana cookie AND sessionStorage entry (`zb-current-dana-org-id`) via the SDK path. Do NOT touch sessionStorage directly.
- **Fallback fix:** ZB SDK `selectDefaultOrg` fallback (`~/Projects/zb/clients/packages/zerobias-client-app/src/zerobias-client-app.ts` around line 177) picks `orgs.at(-1)` when no cached org is present — this causes the "dropped into last-in-list org" bug. The org-switcher doesn't fix the SDK; it gives users a way to recover without DevTools.
- **UI placement:** top-right user menu (existing SME Mart header). Dropdown shows all orgs the user belongs to, filtered per the existing Org List Filtering Rules (hidden orgs, System Org all-zeros UUID, ops orgs excluded).
- **Current-org indicator:** selected org highlighted with a checkmark or "current" pill.
- **Post-switch behavior:** page reload OR router-nav-refresh (whichever matches zb/ui pattern); confirm during research.

## Requirements

- **OS-01:** User menu in SME Mart header surfaces an "Organization" section listing all orgs the user can switch to.
- **OS-02:** Clicking an org in the list calls `app.selectOrg(org)`, which updates Dana cookie + `zb-current-dana-org-id` sessionStorage via the SDK.
- **OS-03:** Current org is visually distinguished in the dropdown.
- **OS-04:** Orgs are filtered per existing rules (hide `hidden: true`, System Org `00000000-...`, ops orgs).
- **OS-05:** Switch triggers a UI refresh sufficient to pick up the new org context (page reload or router-level refresh — match zb/ui behavior).

## Dependencies

None. No platform or schema work. Existing `ZerobiasAppService` already exposes `app.selectOrg()`.

## Verification

- UAT: sign in, open user menu, switch from Auditmation Dev → another org, verify Dana cookie + sessionStorage updated, verify subsequent API calls use new `dana-org-id` header.
- Confirm no longer need to edit sessionStorage via DevTools to switch.

## Out of scope

- Project switcher (deferred — needs UX design work, see DECISIONS.md 2026-04-01).
- Org list pagination (small orgs count; flat list is fine).
- Org creation or deletion.

## References

- `~/Projects/zb/ui/` portal user-menu component (read first)
- `~/Projects/zb/clients/packages/zerobias-client-app/src/zerobias-client-app.ts:177` (selectDefaultOrg fallback)
- MEMORY.md "ZeroBias SDK — Org Selection & `dana-org-id`"
- DECISIONS.md "Org Switching is Placeholder Until Platform Auth" (2026-03-30) — now unblocked
