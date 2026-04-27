# Plan 074: Dual-Party GSD / SDD Toolkit

**Status:** Concept
**Phase:** Future (agentic)
**Created:** 2026-03-24
**Depends on:** Plan 071 (entangled task pairs), Plan 073 (agentic memory), Plan 065 (message center)
**Source:** Brian CEO meeting 2026-03-24 — common GSD serving both demand + supply parties

---

## Purpose

A shared GSD (Goal-Spec-Driven) / SDD (Spec-Driven Development) toolkit that listens to meetings, Slack conversations, and project activity, then auto-generates task proposals for BOTH parties — not just one side of the equation.

## Brian's Vision

> "Why would the spec driven development just satisfy one side? Why wouldn't it kind of potentially work for both?"

The GSD toolkit would:
1. Listen to meeting transcripts (like this very meeting)
2. Understand there are two (or more) parties with different roles
3. Generate requirement tasks for the demand side
4. Generate satisfaction/deliverable tasks for the supply side
5. Create entangled pairs (Plan 071) automatically
6. Present proposals for both parties to review before committing

## Conceptual Architecture

```
Meeting Transcript / Slack Thread / Document Upload
                    │
                    ▼
        ┌──────────────────────┐
        │  Dual-Party GSD AI   │
        │  (Claude Agent SDK)  │
        │                      │
        │  Understands:        │
        │  - Project context   │
        │  - Both parties      │
        │  - Existing tasks    │
        │  - Compliance reqs   │
        └──────────┬───────────┘
                   │
          ┌────────┴────────┐
          ▼                 ▼
   Demand Proposals    Supply Proposals
   ┌──────────────┐   ┌──────────────┐
   │ REQ-new-1    │↔──│ SAT-new-1    │
   │ REQ-new-2    │↔──│ SAT-new-2    │
   │ REQ-new-3    │   │ WORK-new-1   │
   └──────────────┘   └──────────────┘
          │                 │
          ▼                 ▼
   Buyer Review        Vendor Review
   (accept/edit/        (accept/edit/
    reject each)         reject each)
```

## Relationship to Existing Plans

- **Plan 042** (Project Plugin) — the MCP + templates + parsers concept. Dual-Party GSD extends this to serve both sides.
- **Plan 040** (Project Bloom) — AI decomposes documents into tasks. Dual-Party GSD extends this to ongoing project activity, not just initial decomposition.
- **Plan 033 Phase 5** (LLM-Assisted Bid Generation) — Claude Agent SDK packaging. Same infrastructure.

## Effort Estimate

Future — depends on Claude Agent SDK maturity, Plan 071 implementation, and Brian's GSD spec. 20-30 hours when ready.

---

*Session: `claude --resume poc/sme-mart`*
