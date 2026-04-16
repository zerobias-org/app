# Director Session State
**Last updated:** 2026-04-16T12:00:00-07:00
**Session name:** `Director Parks`
**Milestone:** v1.3 — **Phase 18 CLOSED. Phase 19 next.**

## FIRST — Read This on Resume

**Skill drift warning:** prior-session me (pre-clear) was running the director role from context accumulated at the top of the session, not re-reading the skill file on each mode invocation. Clark caught this. On resume, before doing ANYTHING else:

1. **Re-invoke `/meta:director`** (or let the skill auto-resume). Read the actual skill text at `~/.claude/commands/meta/director.md`, don't rely on what "feels right" from this file.
2. **Execute `required_reading` fully** — the 13-item list (SESSION-STATE, WATCH-LIST, DECISIONS, all errata, all backlog, RETROSPECTIVE, REQUIREMENTS, ROADMAP, STATE, PROJECT, canonical specs, referenced memory files, target CLAUDE.md files). Full pass, not a skim. This is how errata 009 happened.
3. **Declare mode explicitly** when one is invoked. Prior session slid between review / checkpoint / design without explicit mode entry. Skill expects per-mode posture.
4. **Use `Tell gsd-X:` handoff blocks** — copy-pastable, no quotes, no wrapping. Per memory `feedback_checkpoint_handoff_format.md`. Clark called me out earlier today for skipping this.

## Mental Model

v1.3 design complete. 6 phase briefs at `.planning/director/phase-{18..23}-brief.md`. GSD roadmap locked, 35 requirements mapped.

**Phase 18 (Org Switcher) — CLOSED 2026-04-16** after a rough 5-plan / 3-errata ride:
- 18-01 ✓ shipped broken (wrong SDK method `getOrgs` vs `listMyOrgs`; errata 013)
- 18-02 ✓ hotfix (SDK method + placement)
- 18-03 ✓ dropped all filters (universal `hidden:true` on UAT made filter useless; errata 014) + removed duplicate chevron
- 18-04 ✓ avatar enhancement (inadvertently regressed submenu; errata 016 — markup used `zb-ui-resource-image.s20` CSS from wrong library)
- 18-05 ✓ ported `zb-ui-resource-image` CSS from zb-ui-lib `components.scss` into SME Mart's `styles.scss`. Matches target architecture — when SME Mart merges into zb/ui the port drops out seamlessly.

Director UAT 2026-04-16 confirmed populated org list (W3Geekery, Roughnecks, etc.), single chevron, small avatars, current-org bold, expected AuditgraphDB failures on org switch (indirect proof switch worked). ROADMAP checkbox flipped. Closeout commit `917d452`.

**Phase 19 (zbb Local Dev Stacks) is next.** Brief at `.planning/director/phase-19-brief.md` unchanged. Two sub-phases — SPA+Hub Module stack (19.1), Login stack (19.2) — sharing a custom `cloudfront-sim` nginx stack. Kevin confirmed feasibility 2026-04-13 Slack. Wait for `/gsd:plan-phase 19` in gsd-plan pane, then run review mode here.

**Errata 015 infrastructure fix landed this session.** `environment.neon.ts` was committed with a live Neon password in Feb 2026 (`68abe4d`), got wiped by Phase 18 Plan 18-01 executor (`ac8e994`) running `predev` without `.env.local`, broke impersonation silently for ~18 hours. Fixed: `.env.local` created (gitignored) with Neon URL, file untracked via `git rm --cached`, added to `.gitignore`, `prebuild` hooks added. Credential `npg_NjsYRTy2U6re` was on origin ~7 weeks — **rotation still owed**, platform-side task for Clark when he has time.

## Open Items

### Active errata (4 open)
- **006** — UAT vendor/buyer accounts (v1.2 carry; blocks Phase 16 UAT tests 5–8)
- **010** — gsd-executor MCP allowlist gap (v1.2 carry; harness-level)
- **011** — fire-and-forget `pushEntity` audit (v1.2 carry — this IS Phase 20)
- **012** — pipeline→hydra Resource FK gap (Kevin escalation)
- **015** — environment.neon.ts credential leak — remediated in code, **credential rotation pending** (not phase-blocking)

### Resolved this session
- 013 — empty list + placement (18-02 + 18-03)
- 014 — hidden filter + double chevron (18-03)
- 016 — image sizing regression (18-05)

### Backlog updates this session
- Plan 088 research-complete addendum (Form Builder WYSIWYG + grouping, research doc at `.planning/research/internal/2026-04-15-form-builder-refactor-research.md`)

### Minor tooling note (not errata-worthy)
- `/gsd:progress` init report lists Phase 14 + 15 as `in_progress` despite both shipping in v1.2. Filename mismatch with what the tool expects. Non-blocking. If Clark wants to file a GSD tooling cleanup backlog item, fine; otherwise ignore.

### Phases 19–23 status
All briefed, none started. Order: 18 ✓ → 19 (zbb stacks) → 20 (fire-and-forget) → 21 (org docs) → 22 (form templates) → 23 (transparency UI-SPEC).

## Recent Decisions (details in DECISIONS.md)

- **2026-04-15**: Org List Filtering Rules changed to "no filter" — admin exposure acceptable, platform `hidden:true` universal. Chris Slack thread pending.
- **2026-04-15**: Plan 18-04 avatar enhancement approved as non-gap-closure enhancement — WRONG CALL. Caused errata 016. Lesson: verify CSS infrastructure exists in target app before cargo-culting markup from a reference app in a different library.
- **2026-04-16**: `environment.neon.ts` removed from git tracking + gitignored + `prebuild*` hooks added. Errata 015 documents.
- **2026-04-16**: Plan 18-05 — port `zb-ui-resource-image` CSS from zb-ui-lib instead of swapping to `zb-avatar-label`. Matches target-architecture (future SME Mart merge into zb/ui).
- **2026-04-15**: Form Builder 088 confirmed as v1.4 scope. Research complete; Discuss phase can skip research step.

## Failure Patterns New This Session (WATCH-LIST candidates for v1.3 retro)

1. **Tests verify code, not feature.** Phase 18 shipped four defects across 20+ unit + 5 E2E tests. Mocks returned ideal data every time; real UAT data (universal `hidden:true`, 14687×1558 px logos) was never exercised. Director's visual UAT screenshot is the only check that catches this.
2. **Cross-library markup assumptions.** Plan 18-04 copied `<img class="zb-ui-resource-image s20">` from zb/ui portal. That app uses `zb-ui-lib`; SME Mart uses `@zerobias-org/ngx-library`. Different libraries, different CSS surfaces. Markup ported fine, CSS didn't come with it.
3. **Plan UAT self-certification.** Executors flipped errata to `resolved` multiple times before Director screenshot review. WATCH-LIST: executor cannot mark errata resolved; only Director does that.
4. **Executor stages auto-generated files.** STATE.md phase counts drifted repeatedly. `environment.neon.ts` had live credentials wiped. Both via executor's atomic-commit pattern sweeping in files it shouldn't touch.

## What to Do on Resume

1. **Skill refresh pass** (see FIRST section above).
2. **Check if `/gsd:plan-phase 19` has produced artifacts** at `.planning/phases/19-*/`. If yes → `/meta:director review 19`. If no → park.
3. **Verify working tree is clean** — `git status` should show no uncommitted session work. If dirty, investigate before starting new review.
4. **Remind Clark about the Neon credential rotation** (errata 015 remediation) if it's come up — not urgent but non-zero exposure since credential was on origin for ~7 weeks.

## Session housekeeping (non-director context)

- **eza one_dark palette** active in `~/.zshrc` via hand-ported `EZA_COLORS` (gruvbox-dark alternate commented below). ngx `theme.yml` support doesn't exist in any eza release; cargo-installed eza removed. Non-project matter.
- **cargo installed eza** earlier this session — `cargo uninstall eza` if you want to clean up; Homebrew version is sufficient.
- **`.env.local` now exists** at project root with `NEON_DATABASE_URL` only. If other env vars (ZB API keys) are needed locally, they're being supplied via shell exports or not needed for proxy-mode auth — don't add them unless something breaks.
