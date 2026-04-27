# PMO Perspective — Bob Cheek (PM Consultant)

**Date:** 2026-02-26
**Source:** Bob Cheek (Robert Cheek), PM consultant

---

## Executive Dashboard

- Executive-level summary **not needed daily** — only surface when there's an issue
- **Budget threshold flags** — alert at 10% or 20% off budget (over/under spend)
- Critical path blockers per program on the main dashboard
- Programs listed with stakeholder list on PMO dashboard

## Project Organization

- Everything tied to a **project name or project number**
- Filterable by **department**: R&D, Manufacturing, Operations, Supply Chain, etc.
- Work Breakdown Structure (WBS) that scales from executive-level reports down to per-program/project detail

### WBS Deep Dive (Bob's Notes)

- Great for **program inception** — start with a standard template, then add/subtract workflows
- WBS should be **tempered by regulatory standards** — the regulatory body dictates required deliverables and submission requirements
- Examples of regulatory standards that shape WBS:
  - **10 CFR 20** — NRC radiation protection standards (nuclear)
  - **IEEE 1309** — reliability/availability standards
  - **Medical device regulations** (FDA 510(k), etc.)
  - **Emissions standards** (EPA, CARB)
  - **FCC** regulatory body submission requirements
- "Your QA and regulations teams should know" — domain experts define the required WBS elements
- The WBS template becomes the **skeleton**, regulatory requirements fill in the **mandatory work packages**

## Milestones & Deliverables

- **Major milestones** as the primary tracking unit
- Hardware big-ticket items: 1st prototype delivered, 2nd prototype delivered
- Software big-ticket items: first build, test cycles
- Milestones should be visible at both executive rollup and program detail levels

## PMO Management Views

- **PM assignments** — which PMs are assigned to which programs
- **Overall program status** — on target, plus/minus, ahead/behind
- **Total spend per PM** — with ability to drill down into program-level spend
- Executive-level summary of all **critical path blockers** per program

## Process Improvement / Lessons Learned

- **Separate list of process improvement opportunities** tracked through the whole program
- Any stakeholder or owner can submit improvement suggestions
- Bob regularly pings contributors: "how can we do this better?"
- Seeing the full list at **program close** would be "gold" — retrospective value
- This is a living log, not a one-time retro — captured throughout the engagement

## V-Team Meeting Minutes (Example: E2011 Program)

Bob shared a real V-Team weekly meeting minutes template (Jan 2022, hardware rack program). Key patterns:

**Meeting Structure:**
- Program links at top (ADO board, internal/external Teams channels)
- Document links (SOW, BOP deck, Schedule)
- Agenda by functional area, each lead reports status
- Tasks with **named assignees** and checkbox completion status
- Open Work Items table: ID, Title, Assigned To, State, Area Path, Status

**Functional Roles (each with bullet updates):**
Planning, Hardware/Technical Lead, Mechanical Engineering, Mechanical Validation, Manufacturing Engineering/Packaging, Reliability, System Engineering/System Validation, Serviceability, Sourcing

**Patterns That Map to SME Mart:**

| Meeting Minutes Pattern | SME Mart Equivalent |
|---|---|
| Per-person task assignments with checkboxes | Tasks assigned to users within a Board |
| Open Work Items table (ID, title, assignee, state) | Board view — filtered task list |
| Functional area rollup (each lead reports) | Board organized by team/workstream |
| Links to ADO board + Teams channels | Boundary resources (links to external tools) |
| Document links (SOW, BOP, Schedule) | Task attachments / Board-level documents |
| Issue tracking with IDs (814132, 806888) | Tasks with external system references (schedule sync) |
| Budget section (unit cost, NRE costs) | Billing app integration point |
| "Store docs on ADO board" reminder | Centralization value prop — replace spreadsheet dumps |

**Takeaway:** Bob's PMO world runs on weekly V-Team meetings where each functional lead gives status, tasks are assigned with checkboxes, and open issues are tracked in a table. SME Mart's Board → Task model maps directly to this workflow. Meeting minutes themselves could be a Board-level timeline event or a dedicated note type.

---

## Data Centralization

- The big value is **centralizing data** — replacing the "large stated table" (spreadsheet dump)
- **Jira** is great for task-driven work (software and hardware)
- **SAP** can track all active items, but **missing total budget** visibility
- SME Mart opportunity: bridge the gap between task tools (Jira) and ERP (SAP) by providing the budget/spend overlay and unified PMO view

---

## Implications for SME Mart

| Bob's Need | Maps To | Status |
|------------|---------|--------|
| Budget threshold alerts | Board/Project-level spend tracking + notification rules | Future (needs Billing app integration) |
| Department filtering | Project tags or Boundary metadata | Feasible now via tags |
| Major milestones | `engagement_milestones` table (Proposal 001/002) | Proposed |
| PM assignments | Board-level user permissions + owner field | Aligns with Board model |
| Program status (on/off target) | Readiness rollup: SubTask → Task → Board → Boundary → Project | Planned (Transparency Center) |
| Spend per PM drill-down | Project-level $ tracking with PM as dimension | Future (needs Billing app) |
| Critical path blockers | Task dependencies + blocked status surfaced at exec level | Feasible with ZB Tasks |
| WBS scaling (exec → program) | Hierarchy: Project → Boundary → Board → Task → SubTask | Current architecture |
| Jira/SAP bridge | Schedule Sync (Proposal 002) + budget overlay | Proposed |
| Process improvements log | Living list per Board/Project, any stakeholder can submit | New idea — lightweight (could be a Task type or timeline event) |
| Lessons learned at close | Aggregate improvement log surfaced at program completion | New idea — ties into engagement lifecycle close event |
| Regulatory WBS templates | Board templates pre-loaded with required work packages per regulatory standard (10 CFR 20, IEEE 1309, FDA, FCC) | Future — needs template system for Boards |

*Bob's feedback validates the hierarchy model — Project/Board/Task maps cleanly to his PMO expectations. The main gaps are budget/spend tracking (depends on ZB Billing app) and Jira/SAP data centralization (Proposal 002 schedule sync is the starting point).*
