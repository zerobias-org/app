---
id: "022"
severity: high
phase: "*"
found: 2026-04-22
status: open
---

# 3P plan missing the W3Geekery-as-first-customer dogfood phase; production smoke test ambiguous

Clark clarified 2026-04-22: he (W3Geekery) needs his own Engagement and Project with ZeroBias as the seller — the very flow the 3P plan creates. This is not an after-the-fact demo seeder concern; it's the **production smoke test, the first real customer, and the operational channel that all future W3Geekery↔ZB SME Mart communication will run through** (per errata 021).

The current 3P plan ends at Phase 6 (Demo seeder + UAT validation) with an ACME Corp synthetic flow. There is no acknowledgement that:
- W3Geekery itself is the canonical first 3PO and should be the first real onboarding
- The engagement created by W3Geekery's onboarding becomes the **infrastructure** for filing future ZB platform tasks against ZB SDK / Hub / pipeline issues
- Brian's directive ("everyone comes in the front door") implies the dogfood case isn't optional

**Root cause:** Plan treated demo data and real-customer onboarding as separable concerns. The bootstrap recursion (the channel for filing ZB tasks IS the channel created by the very onboarding flow) was not surfaced.

**Impact:**
- v1.4 risks shipping without anyone actually running the flow end-to-end as a real customer
- W3Geekery↔ZB communication channel remains informal indefinitely (Slack to Kevin, email to Brian) — never moves to the dogfood path Brian directed
- Demo seeder (synthetic ACME) becomes the only flow that actually exercises the system, leaving real-data edge cases uncovered

**Fix:**
- Add a phase to v1.4: **W3Geekery as first customer + production smoke test** (likely Phase 31 in the proposed numbering, between default-project-board and demo-seeder)
- Phase scope: real Engagement record (W3Geekery as buyer, ZeroBias as provider, `engagementTag="default-project"`) created in production; real Project board live; first real ZB task filed from that engagement (e.g., the pipeline-health verification from errata 021)
- Demo seeder phase (Phase 32 / formerly Phase 6) becomes secondary — covers ACME-style synthetic flows for sales narrative, not for production verification
- Bootstrap caveat documented: until this phase ships, there's a temporary direct-Kevin-via-Slack channel for blockers ON THIS MILESTONE ONLY. After ship, all SME Mart W3Geekery↔ZB communication runs through the engagement.

Filed by: Director Parks
