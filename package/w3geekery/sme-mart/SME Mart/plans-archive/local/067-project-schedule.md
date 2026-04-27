# Plan 067: Project Schedule View (Gantt / Calendar)

**Status:** Stub
**Phase:** 5 (Engagements & Admin)
**Created:** 2026-03-24
**Depends on:** Plan 022 (Project UI), Plan 057 (milestones, tasks with dates)
**Source:** Clark UI design 2026-03-24, Kevin Project spec (timelines as project children)

---

## Purpose

Build a Schedule view under SmeMartProject showing milestones, task due dates, and dependencies in a Gantt chart or calendar format.

## Data Sources

- `PlanMilestone` — target dates, status, dependencies
- `SmeMartTask` — due dates, start dates, duration
- `SmeMartBoard` — group by board (buyer/provider/shared)

## View Options

### Gantt View (primary)

- Horizontal timeline with task bars
- Milestone diamonds
- Dependency arrows between tasks
- Color-coded by board partition (buyer/provider/shared)
- Zoom: week / month / quarter
- Today line indicator
- Critical path highlighting (optional)

### Calendar View (secondary)

- Month view with milestone/deadline dots
- Click to see tasks due on that date
- Lighter weight than Gantt

## Library Options

- `ngx-gantt` — Angular-native Gantt component
- `frappe-gantt` — lightweight, no framework dependency
- Custom with CSS Grid + SVG for dependency arrows
- Material CDK drag for interactive rescheduling

## Effort Estimate

8-12 hours (Gantt view + milestone display + dependency visualization)

---

*Session: `claude --resume poc/sme-mart`*
