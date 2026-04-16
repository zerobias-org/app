# Director Session State
**Last updated:** 2026-04-16T10:40:00-07:00
**Session name:** `Director Parks`
**Milestone:** v1.3 (Dev Experience, Hardening & Transparency) — **Phase 18 in UAT review, Phases 19–23 briefed + not started**

## Mental Model

v1.3 design complete, 6 phase briefs at `.planning/director/phase-{18..23}-brief.md` committed. GSD picked up the milestone, ROADMAP locked, 35 requirements mapped across 6 phases.

Phase 18 (Org Switcher) has had 4 plans ship and UAT is STILL not clean:
- 18-01: initial impl — shipped with silent defect (empty list, buried placement) because tests mocked the SDK wrong (errata 013)
- 18-02: hotfix — swapped `app.getOrgs()` for `clientApi.danaClient.getMeApi().listMyOrgs()` + moved trigger above "My Organizations"
- 18-03: second hotfix — dropped all filters (including `!org.hidden` which wiped the whole list because UAT has `hidden:true` on ALL orgs — errata 014) + removed explicit `matMenuTriggerIcon` that was rendering a duplicate chevron
- 18-04: avatar enhancement matching zb/ui portal pattern (plain `<img>` + `imgDefault` directive + unknown-company.svg fallback)

As of last Clark screenshot (2026-04-16 10:33 AM), submenu opens EMPTY again. Third open-submenu defect on this phase. Working theory: impersonation state side-effect — Clark was impersonating "Pinnacle Corp (Buyer)" when screenshot taken. Service constructor likely fired at app boot before auth was warm; `loadOrgs()` failed silently; impersonation reload doesn't re-trigger. Suggested next test: stop impersonating + refresh. If orgs reappear, need an explicit reload on impersonation start/stop.

**Errata 015 landed this session** — `src/environments/environment.neon.ts` was committed with a live Neon password in Feb 2026 (commit `68abe4d`) despite its own DO-NOT-COMMIT header. Phase 18 Plan 18-01 executor (ac8e994) wiped the URL because its shell had no `.env.local`. That broke impersonation silently from 2026-04-15 until this morning. Fixed: `.env.local` created (gitignored) with Neon URL, file removed from git (`git rm --cached`), gitignored, `prebuild*` hooks added so every build regenerates from env. Credential rotation still needed — `npg_NjsYRTy2U6re` was on origin for ~7 weeks.

Also worth noting: eza theming was a side quest today — user wanted theme.yml support which isn't in any released eza build. Worked around with hand-ported one_dark palette in `EZA_COLORS` env var in `~/.zshrc`. Gruvbox-dark version sits commented as alternate. One Dark is active.

## Open Items

### Phase 18 close gate (blocking)
- **UAT empty submenu (third occurrence).** Clark screenshot shows submenu opens with zero rows while impersonated as Pilot demo user "Pinnacle Corp (Buyer)". Diagnose via:
  1. DevTools console for `[OrgSwitcherService] Failed to load orgs:` error
  2. DevTools Elements panel — are DOM buttons rendered and hidden (CSS regression from 18-04), or zero DOM nodes (data empty)?
  3. Stop impersonating + refresh — if orgs return, file errata on impersonation-vs-org-switcher interaction
- **ROADMAP checkbox on Phase 18 stays `[ ]`** until Director reviews a clean UAT screenshot.
- **No new 18-0X hotfix plan yet** — waiting on Clark's diagnosis output.

### Active errata (7 open)
- 006 — UAT vendor/buyer accounts (v1.2 carry; blocks Phase 16 UAT tests 5–8)
- 010 — gsd-executor MCP allowlist gap (v1.2 carry; harness-level)
- 011 — fire-and-forget `pushEntity` audit — Phase 20 covers this
- 012 — pipeline→hydra Resource FK gap (Kevin escalation)
- 013 — Phase 18 empty list + placement — marked resolved (but 014 superseded it)
- 014 — hidden filter + double chevron — resolved by Plan 18-03
- 015 — environment.neon.ts credential leak — remediated locally, credential rotation pending

### Backlog updates this session
- Plan 088 research-complete addendum added (form builder WYSIWYG + grouping, research doc at `.planning/research/internal/2026-04-15-form-builder-refactor-research.md`)

### Phases 19–23 status
All briefed, none started. Order per plan: 18 → 19 (zbb stacks) → 20 (fire-and-forget) → 21 (org docs) → 22 (form templates) → 23 (transparency UI-SPEC).

## Recent Decisions (details in DECISIONS.md)

- **2026-04-15**: Org List Filtering Rules changed to "no filter" — admin-mode exposure acceptable, platform `hidden:true` flag unusable until Kevin/Chris clarify semantics. DECISIONS.md addendum added.
- **2026-04-15**: Plan 18-04 (avatar enhancement) approved as non-gap-closure enhancement — follows zb/ui portal pattern exactly (plain img + imgDefault directive).
- **2026-04-16**: `environment.neon.ts` removed from git tracking + gitignored + `prebuild*` hooks added so every build regenerates from `.env.local`. Errata 015 documents the history.
- **2026-04-15**: Form Builder redesign (088) confirmed as v1.4 scope, not v1.3. Research complete; Discuss phase can skip research step when v1.4 kicks off.

## What to Do on Resume

1. **Read Clark's response to the empty-submenu diagnosis.** Expected: either `[OrgSwitcherService] Failed to load orgs:` console error (→ file errata 016, plan 18-05 hotfix), OR a "stop impersonating made it work" confirmation (→ file errata 016 on impersonation-lifecycle issue specifically, fix is to re-trigger loadOrgs on impersonation start/stop).
2. **Director UAT review + screenshot.** Once submenu is populated (avatars + bold current + single chevron + alphabetical), green-light ROADMAP checkbox flip via handoff to gsd-execute.
3. **Phase 18 close → hand off Phase 19.** Next command: `/gsd:plan-phase 19` in gsd-plan pane (zbb Local Dev Stacks).
4. **Credential rotation reminder.** When Clark gets time, rotate the Neon password `npg_NjsYRTy2U6re` (errata 015 remediation). Not urgent since it's a dev DB but good hygiene.
5. **If this is a NEW session after clear:** read the required_reading list (SESSION-STATE, WATCH-LIST, DECISIONS, errata/, backlog/, RETROSPECTIVE, REQUIREMENTS, ROADMAP, STATE, PROJECT, CLAUDE.md). Don't skip like we did in errata 009.
