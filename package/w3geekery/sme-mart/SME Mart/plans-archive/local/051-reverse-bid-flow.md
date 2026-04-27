# Plan 051: Reverse Bid Flow (Supply-Originated Proposals)

**Status:** STUB
**Created:** 2026-03-13
**Source:** Marketplace meeting 2026-03-13 (Brian + Clark)

## Summary

Suppliers can propose projects to the demand side within existing engagements. This is the inverse of the standard RFP flow (demand→supply). The current RFP flow (Plans 032/033) only covers demand-originated work. This plan covers supply-originated proposals with their own UI, rules, and approval workflow.

## Key Rules

- **Must have existing engagement** — no unsolicited proposals (relationship must exist)
- Supply side creates a project proposal with scope, timeline, pricing
- Demand side reviews and accepts/rejects (similar to bid review but roles reversed)
- Can originate from external suppliers OR internal teams (ties to Plan 050)
- Brian's term: "reverse bid"

## Use Cases

1. **External supplier** with existing engagement spots an opportunity and proposes new project
2. **Internal team** proposes a new initiative to leadership (internal marketplace)
3. Supplier identifies additional work needed during current engagement execution

## Dependencies

- SM-17 (Activity layer)
- Plan 032 (RFP creation — reuse wizard components)
- Plan 033 (Bid response — reuse bid model, reverse the roles)

## Open Questions

- Does a reverse bid create a new engagement or a new project within existing engagement?
- Same approval workflow as standard bids, or simplified?
- Notification flow — how is demand side alerted to incoming proposals?

## Phases

TBD — use `/plan` agent to flesh out.
