# Billing App — Feature Requirements (Living Doc)

**Status:** Collecting requirements as SME Mart develops
**Owner:** Clark — hand off to whoever builds the ZB Billing app
**Context:** Brian confirmed Billing is a separate ZB platform app, not SME Mart. SME Mart consumes billing data. This doc captures what SME Mart needs from it.

---

## Requirements

### BR-001: Project-Level Budget Tracking

**Source:** Bob Cheek (PMO consultant), Brian (CEO)
**Priority:** High

Money flows at the Project level. The billing app needs to track total budget per project and actual spend against it.

- Total budget set per Project
- Actual spend accumulated from tasks/engagements
- Budget remaining (calculated)
- Budget burn rate

---

### BR-002: Budget Threshold Alerts

**Source:** Bob Cheek
**Priority:** Medium

Flag when spend deviates from plan — don't surface budget daily, only when it matters.

- Configurable threshold per project (e.g., 10%, 20% off budget)
- Alert types: over-spend, under-spend, burn rate too high
- Surfaced on executive dashboard, not buried in detail views

---

### BR-003: Spend Per PM / Per Program

**Source:** Bob Cheek
**Priority:** Medium

PMO needs to see total spend by PM assignment, with drill-down to program level.

- Aggregate spend by PM (Board owner / Task assignee)
- Drill-down: PM → Programs → Projects → Tasks
- Comparative view across PMs

---

### BR-004: Department-Level Spend Rollup

**Source:** Bob Cheek
**Priority:** Medium

Filterable by department: R&D, Manufacturing, Operations, Supply Chain, etc.

- Department as a dimension on Projects (tag or metadata)
- Rollup spend by department
- Cross-department views at exec level

---

### BR-005: Engagement Payment Status

**Source:** Brian (Transparency Center vision)
**Priority:** High

$ is one of the four things surfaced in the Transparency Center (alongside compliance, functional deliverables, legal adherence).

- Payment status per engagement (Boundary)
- Visible in shared transparency view (buyer + provider)
- Invoice history / payment timeline

---

### BR-006: Marketplace Transaction Support

**Source:** Brian (Stripe/Privy directive)
**Priority:** Future

Stripe Connect or Privy wallet integration for marketplace payments between buyers and providers.

- Escrow / milestone-based payments
- Stablecoin support (Privy wallets)
- Cross-border payouts (Bridge)
- Provider payout tracking

---

## SME Mart Integration Points

The billing app should expose APIs that SME Mart can consume:

| Data SME Mart Needs | Where It Shows Up |
|---------------------|-------------------|
| Project total budget & spend | Executive dashboard, Project detail |
| Budget alerts (over/under) | Dashboard notifications, flags |
| Spend per PM | PMO management view |
| Payment status per engagement | Transparency Center shared view |
| Invoice history | Engagement detail |
| Department spend rollup | Executive summary filters |

## Open Questions

1. Does the billing app own invoice generation, or just track payments?
2. Does it integrate with external accounting (QuickBooks, Xero, SAP)?
3. Who handles payment processing — billing app directly or via Stripe Connect?
4. How does the billing app get spend data — from Tasks (time tracked) or from invoices submitted?

---

*Update this document as new billing requirements surface. Hand off to the billing app team when development starts.*
