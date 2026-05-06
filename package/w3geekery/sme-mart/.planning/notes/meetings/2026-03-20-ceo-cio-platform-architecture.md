## Meeting Summary

**Date:** 2026-03-20
**Time:** 10:30 AM – 11:15 AM PT
**Duration:** ~47 minutes
**Participants:** Brian Hierholzer (CEO), Kevin McCarthy (CIO), Clark Stacer (Frontend Dev)
**Meeting Type:** Architecture Alignment — Platform Core Features & Task/Boundary Integration

### Topics Discussed

- **Three-Partition Model** — Brian presented the core construct: demand side (requirements), supply side (fulfillment), and transparency center (shared validation). All commerce is programmatic, explicit, and mechanized — "Helen Keller Commerce" where parties interact only through structured digital interfaces.

- **Boundary as Promise Management** — Kevin reframed the boundary as a "promise keeping function" — not just a security gate but the system that proves you're fulfilling all your obligations (compliance, operational, SDLC, contractual). Auto-discharges requirements when the boundary already has the evidence. Without it, every requirement becomes a manual task.

- **Task System + Boundary Integration** — Brian and Kevin agreed these are inseparable. Tasks are the gating mechanism (demand/supply requirements), boundaries provide the auto-satisfaction engine. Tasks can contain access rules and boundary configuration recipes but don't evaluate them directly — they're "permission slips" that get picked up by the boundary provisioning system.

- **Document Decomposition Pipeline** — Kevin proposed: (1) convert PDFs/docs to markdown, (2) reference specific sections (Section 3, paragraph 2), (3) turn referenced requirements into tasks, (4) auto-close tasks from boundary evidence, (5) generate proposed responses. LLM-powered throughout.

- **Project as Wrapper** — Projects wrap entangled task pairs through transparency. Projects sit on top of boundaries (don't own them). Projects own files, timelines, schedules. Engagements are the corporate-level wrapper (MSA, banking, background checks) containing multiple projects across boundaries.

- **Developer-First, Headless Platform** — Brian: "Our customer is programmatically capable. Throw the old world out." The UI is for demos and internal use — the real interface is headless MCP/API. Customers bring their own LLM (Claude) to interact with the platform.

- **Boundary Feature Gap** — Kevin flagged: no boundary feature work in over a year. Platform team focused on tasks, third-party enablement, STF cleanup — not the core boundary promise-management features this architecture requires. Current prototyping (Dan, Clark) creates demand but isn't platform code.

- **Access Request Tasks** — Tasks that contain boundary access recipes: ARN, bucket names, IAM roles, query limits, time-boxed access (24h, 30 days, per-run). These are "permission slips" provisioned by the boundary system.

- **Multi-Party Engagements** — Extended model to include assessors/auditors as third parties. Same construct: owner invites parties, each gets entangled tasks through transparency. Auditor inspects supplier's boundary. N-party is structurally the same as 2-party.

### Key Decisions

1. **Task system and boundary are inseparable** — can't ship one without the other. Brian agreed to spec boundary requirements before continuing task system work.
2. **Developer-first platform** — customers must be "programmatically capable." UI fades to headless MCP/API interface over time.
3. **Document decomposition via LLM** — PDF → markdown → referenced elements → tasks → auto-close from boundary → generate response. Core workflow.
4. **Kevin and Clark to break down platform feature requirements** and send to Brian for review.
5. **Prototyping budget acknowledged** — Brian and Kevin aligned that Clark/Dan work is prototyping that creates demand, with understanding that platform core (boundary features) needs investment.

### Action Items

| # | Action | Owner | Priority |
|---|--------|-------|----------|
| 1 | Break down boundary feature requirements for platform team | Kevin + Clark | High |
| 2 | Spec the three-partition model (demand/supply/transparency) visually in Miro | Brian | High |
| 3 | Define access request task schema (ARN, IAM, time-boxed access patterns) | Kevin | Medium |
| 4 | Document the document decomposition pipeline (PDF → markdown → tasks) | Clark | Medium |
| 5 | Evaluate LLM cost model for procurement workflows | Kevin | Medium |
