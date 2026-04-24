# Phase 23 — Transparency Controls: UI-SPEC Lock + Opportunistic Implementation (Plan 078)

**Milestone:** v1.3
**Est:** 4–6 hrs if spec-only; more if implementation proves doable
**Repos:** `app/` (SME Mart only, UI-only this phase)
**Origin:** Plan 078, partially started. Brian 2026-03-27 direction. Red-box markups already done.

## Goal

Lock the Transparency Controls UI-SPEC (UI-SPEC.md in GSD format), starting from Clark's existing red-box markups. Research what's implemented server-side. If the spec locks AND backend deliverables exist to code against, deliver code. If not, ship the spec for a future implementation phase.

## Architecture

### Starting state

- HTML UI concept sketches exist: `.claude/sketches/transparency-center-ui-concepts.html` (5 views)
- UI-SPEC draft-prep exists: `.claude/ui-specs/078-transparency-controls-UI-SPEC.md` — GSD format, target view integration mapping, component inventory, copywriting contract, 8 open questions for wireframe session
- Red-box markups on Engagement/Project screens done (Clark, per backlog update 2026-04-15)
- Screenshots uploaded to Clark's Miro board

### Deliverables

1. **Wireframes** — low-fidelity wireframes synthesizing red-box markups + sketches + draft UI-SPEC
2. **Locked UI-SPEC.md** — resolve the 8 open questions in the draft, finalize component inventory, copywriting contract, and integration points into existing Engagement/Project views
3. **Research pass** — check what backend deliverables Transparency Controls depend on. Key question: does CE4 (N-party task entanglement via req↔sat task pairs) have any usable surface yet, or is this pure UI-ahead-of-platform? Kevin confirmed TC is a FUNCTION not a place — may map to existing surfaces we can wire up.
4. **Opportunistic code** — IF the UI-SPEC can be implemented against existing marketplace entities (e.g., RfpInvitation transparency gates, engagement-level controls), add an implementation plan. Otherwise, close the phase with locked spec + mark the implementation phase as a v1.4 candidate.

## Requirements

- **TC-01:** UI-SPEC.md for Transparency Controls is locked — no open questions remaining
- **TC-02:** Low-fi wireframes produced for all 5 concept views from the sketches
- **TC-03:** Research report documents which backend capabilities TC depends on and which exist today
- **TC-04:** If implementation is doable this phase, at least one Transparency Control surface ships on an existing view (e.g., Engagement detail or Project detail)
- **TC-05:** Backlog entry added (or 078 updated) with the implementation plan if deferred

## Dependencies

- Brian's design input (already captured — 2026-03-27 direction + Kevin's TC-as-function clarification)
- Red-box markups (done)
- Sketches (done)
- Draft UI-SPEC (done)
- CE4 task entanglement backend progress (research deliverable will tell us if this is blocked)

## Verification

- UI-SPEC.md reviewed against GSD format checklist
- All 8 draft open questions have resolved answers
- Wireframes walked through with user
- If code ships: UAT demo of a Transparency Control surface on Engagement or Project detail

## Out of scope

- Full CE4 / N-party entanglement implementation (platform-dependent)
- Publish-to-Shared pipeline (CE6 territory)
- Anonymity toggle (CE6 territory)
- Cybersecurity SLA template (CE8 — separate future plan)

## References

- `.claude/sketches/transparency-center-ui-concepts.html`
- `.claude/ui-specs/078-transparency-controls-UI-SPEC.md`
- BACKLOG.md "078" entry (full context)
- Kevin 2026-04-15: "TC is a FUNCTION (not a place)" — integrate into existing views, don't build new nav
- CE4 backlog entry — task entanglement model (platform dependency)
