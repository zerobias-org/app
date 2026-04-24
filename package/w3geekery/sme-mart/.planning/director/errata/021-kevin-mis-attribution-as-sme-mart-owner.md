---
id: "021"
severity: medium
phase: "*"
found: 2026-04-22
status: open
---

# Director and 3P plan place Kevin in operational-owner seat for SME Mart questions; correct posture is W3Geekery-as-3P-developer with platform-task communication

The 3P plan's stakeholder table lists Kevin as owner for "Platform / Hub infrastructure, pipeline health on UAT, ZB signup embed viability, `engagementTag` collisions" — and the director's 2026-04-22 structural proposal repeated that framing, marking phases as "blocked-on-Kevin" with a recommendation to Slack him directly.

Clark clarified 2026-04-22:
1. SME Mart is NOT Kevin's responsibility. He is CIO of ZeroBias (platform). SME Mart is a POC MVP being built **as a 3rd-party developer (W3Geekery) on top of platform SDK/client.**
2. Although Clark is also a ZeroBias employee reporting to Kevin, for SME Mart purposes the W3Geekery posture is what governs — no direct Kevin escalation.
3. Communication between W3Geekery and ZeroBias must go through **ZB platform tasks** (the Engagement→Project→Task channel that the 3P plan itself creates).
4. Clark personally requires a W3Geekery↔ZeroBias Engagement+Project so the dogfood loop is real.

**Root cause:** Plan and director state were drafted from the implicit "ZeroBias internal team building SME Mart" frame. The 3rd-party-developer posture wasn't first-classed.

**Impact:**
- Mis-attribution in stakeholder tables and dependency maps (Kevin marked as owner of SME Mart-side concerns he doesn't own)
- Wrong communication channel choice (Slack-Kevin-direct vs file-task-in-engagement) — and the latter doesn't exist yet, creating a bootstrap problem
- Director's "ask at next meeting" framing implicitly assumes meeting access we shouldn't be relying on for SME Mart matters

**Fix:**
- Recast all "ask Kevin" items in the milestone planning:
  - **Pipeline health on UAT:** ours to verify (run a small Pipeline.receive smoke test from a CLI). Only escalate via task if it fails.
  - **`engagementTag` collisions:** ours to grep against existing UAT data; only file a task if conflict found.
  - **ZB signup mechanics:** removed (errata 019).
- Director state: stakeholder tables list Kevin as "platform owner; communication channel = ZB platform task in W3Geekery↔ZB engagement (bootstrap caveat: that engagement is the very thing we're building, see errata 022)."
- Brian retains direct-meeting access (he's the SME Mart business sponsor; CEO; meetings are the established channel for product direction). That's a Brian-specific exception, not the default.
- Update `.planning/director/SESSION-STATE.md` and the proposal's dependency map accordingly.

Filed by: Director Parks
