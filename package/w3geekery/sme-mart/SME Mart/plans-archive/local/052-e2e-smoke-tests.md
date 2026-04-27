# Plan 052: Playwright E2E Smoke Tests

**Status:** STUB
**Created:** 2026-03-13
**Source:** Marketplace meeting 2026-03-13 (Brian + Clark)
**Supersedes:** Plan 044 (Playwright E2E Smoke Tests — backlog item)

## Summary

Full end-to-end smoke test paths using Playwright for buyer and seller flows. Browser fills in all forms and validates results. Builds on existing Chrome DevTools MCP smoke tests in `.claude/smoke-tests/` and the unit testing strategy from Plan 049.

## Goals

- Unattended CI-capable regression testing
- Full buyer flow: browse marketplace → create RFP → review bids → accept → engagement
- Full seller flow: browse RFPs → submit bid → engagement execution → task completion
- Validate against new UAT environment

## Dependencies

- Plan 049 (Unit testing strategy — complete, provides test infrastructure patterns)
- UAT environment stability (Chris/Nick/Andrey)

## Open Questions

- Run against UAT or local dev server?
- Auth strategy for tests (service account? mock auth?)
- Which flows are highest priority for first spec?

## Phases

TBD — use `/plan` agent to flesh out.
