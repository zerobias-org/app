# Plan 068: Project Financials View

**Status:** Stub
**Phase:** 5 (Engagements & Admin)
**Created:** 2026-03-24
**Depends on:** Plan 022 (Project UI)
**Source:** Clark UI design 2026-03-24, Brian CEO — "Project is where money flows" (2026-02-25)

---

## Purpose

Build a Financials view under SmeMartProject showing billing history, invoices, token usage, budget tracking, and milestone-based payment status. Also surfaces at Engagement level as a dashboard widget (Plan 066).

## Sections

### Budget Overview

- Allocated budget (from Bid acceptance / contract)
- Spent to date
- Burn rate ($ per week/month)
- Projected completion cost
- Over/under budget indicator with alerts

### Billing History

- Table of billing events: invoices, payments, adjustments
- Status per line: pending, submitted, approved, paid, disputed
- Link to invoice documents

### Milestone Payments

- Payment schedule tied to PlanMilestones (e.g., 0-80-20 split)
- Status per milestone: not_due, pending_approval, approved, paid
- Sign-off workflow: vendor completes → buyer reviews → approve/reject
- Acceptance period tracking

### Token Usage (if applicable)

- AI agent token consumption (Claude, GPT, etc.)
- Per-task or per-session breakdowns
- Cost attribution to specific work items

### Invoice Generation

- Auto-generate invoice from approved milestones
- Line items per task/subtask or per milestone
- Export as PDF / send to buyer

## Data Model Considerations

Financials may live in:
- AuditgraphDB (new GQL entities: `SmeMartInvoice`, `SmeMartPayment`, `SmeMartBudget`)
- Or the ZB Billing App (Brian mentioned a separate billing app)
- Or a hybrid: SME Mart tracks project-level budget/milestones, billing app handles actual invoicing

Decision depends on Brian's billing app direction. Start with lightweight tracking in AuditgraphDB, migrate to billing app when available.

## Engagement Rollup

Engagement Dashboard (Plan 066) aggregates financials across all projects:
- Total budget across projects
- Total spend
- Projects over budget (alert widget)
- Payment schedule overview

## Related Gaps

- **E5:** Payment milestone tracking (0-80-20, sign-off workflow) — covered here
- **E6:** Multi-year contract management — future extension

## Effort Estimate

10-14 hours (budget tracking + billing history + milestone payments + invoice generation)

---

*Session: `claude --resume poc/sme-mart`*
