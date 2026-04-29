---
id: "019"
severity: high
phase: "*"
found: 2026-04-22
status: open
---

# 3P plan assumes external ZB-signup → return-URL flow that contradicts hard auth requirement

The 3P onboarding plan (`.planning/notes/plans/3p-org-signup-engagement-flow.md`) Phase 2 ("Auth routing + org detection") is built around a model where unauthed visitors land on `uat.zerobias.com/sme-mart`, get redirected to ZB signup, and return via a URL handoff. Open Kevin asks include "ZB signup auto-creates an org? Embed viable? Return URL mechanism?".

Clark clarified 2026-04-22: **no one uses SME Mart without legit ZB platform credentials. This is a hard requirement.** Authentication happens upstream of SME Mart entirely; the SPA only sees already-authenticated users.

**Root cause:** Plan was drafted before the auth-required posture was made explicit. The 3P signup question was left ambiguous and the plan defaulted to a "front-door for new ZB users" framing.

**Impact:**
- Phase 2 of the plan is much smaller than written — collapses to standard auth-gate + onboarding-state detection, no external integration work
- All "ask Kevin about ZB signup mechanics" items are removed from blockers
- Phase 1's pricing-tier question is independent of signup mechanism (still Brian)
- The router question becomes: "authenticated user with no `MarketplaceProfileItem(section=company_info)` → onboarding; with one → dashboard"

**Fix:**
- Director writes a Phase 27 brief (auth gate + onboarding routing) that reflects the auth-required model
- Update 3P plan's Phase 2 in place to match (or supersede with the brief)
- Drop the Kevin signup-mechanism asks from the milestone blocker list

Filed by: Director Parks
