# Plan 064: Project Members View

**Status:** Stub
**Phase:** 5 (Engagements & Admin)
**Created:** 2026-03-24
**Depends on:** Plan 022 (Engagement UI restructuring), Plan 057 (Project Bloom — boundary association)
**Source:** Kevin's Project spec (2026-03-17) — scoped roles, boundary-inherited permissions

---

## Purpose

Build the Members view under a SmeMartProject — showing team members, their roles, and group assignments, all derived from the project's boundary membership.

## What It Shows

- **People on this project** — pulled from boundary membership (users/groups/roles)
- **Scoped roles** — per Kevin: "I am the Lead for Project X" does not mean I lead all projects. Roles scoped to boundary/project.
- **Role categories:** Member, Leader, Owner, Tech Lead, Support Contact, Subject Matter Expert
- **Group assignments** — which groups each member belongs to
- **Buyer vs Provider party** — which org each member is from

## Data Source

All member data comes from the ZB Platform Boundary API:
- `boundaryClient.getUsersInBoundary(boundaryId)` — lists users
- `boundaryClient.getGroupsInBoundary(boundaryId)` — lists groups
- `boundaryClient.getRolesInBoundary(boundaryId)` — lists roles

Since a project can reference 1+ boundaries, the members view aggregates across all associated boundaries.

## Proposed UI

Table or card layout:

| Member | Org | Role | Groups | Status |
|--------|-----|------|--------|--------|
| Jane Smith | CDPH (buyer) | Project Lead | Admins, Reviewers | Active |
| Bob Chen | W3Geekery (provider) | Tech Lead | Engineering | Active |
| Sarah Kim | CDPH (buyer) | SME Contact | Compliance | Active |

With filters: by org (buyer/provider), by role, by group.

## Effort Estimate

3-4 hours (reads from existing Boundary API, display-only initially)

---

*Session: `claude --resume poc/sme-mart`*
