# Retroactive Demo-Tag Re-Push (pre-Phase-31 cleanup)

**Status:** OPEN — required before Phase 31 (W3Geekery production cutover).
**Origin:** Phase 24 Decision-Probe-1 outcome 2026-05-01 + Phase 24 re-spec (Option X). Pre-existing demo records seeded before the tagging convention have `tag: null` and remain visible to non-admin users post-Phase-24. This brief backfills the demo tag so Phase 24's filter catches them.
**Owner:** Director-led manual MCP walkthrough (no agent — same etiquette as bootstrap-w3geekery-engagement.md). Clark + Director step through together.
**Related:** `phase-24-brief.md`, `24-CONTEXT.md` Decision-Probe-1 RESULT, `cleanup-orphan-hydra-resources.md`, `phase-31-brief.md`.

---

## Why this exists

Phase 24's filter (Option X — client-side `applyVisibility<T>()`) gates records based on whether their `tag` array contains a demo UUID. Records with `tag: null` (no tag at all) PASS through the filter as visible. This is the documented Option X tradeoff.

For 22 of 25 records currently in the W3Geekery `SME Marketplace DEV` boundary on UAT, `tag` is `null`. These are demo seeder runs from before the tagging convention was adopted. They'll remain visible to non-admins after Phase 24 closes — meaning Brian, Clark, and W3Geekery's first customers (Phase 31) would see fictitious entities like "Pinnacle Corp", "FinTech Inc", "Startup XYZ", "Lakewood Health", "HealthTech Co", "SOC 2 Type I Fast-Track Assessment", "Penetration Testing for Healthcare Portal", "FedRAMP Readiness Assessment" as live marketplace activity.

That's bad for production cutover. This brief fills the gap.

## Approach

Pipeline.receive UPSERTs Object records by `id` (verified pattern, see W3Geekery remediation 2026-04-27 commits). Re-pushing a record with the same `id` and a populated `tag: [{value: <demoUUID>}]` field overwrites the existing record's tag. Phase 24's filter then automatically excludes it from non-admin views.

No schema changes. No migrations. No deletes. Pure idempotent re-ingest.

## Inventory (pinned 2026-05-01 from MCP probe)

Boundary: `c15fb2dc-4f8c-48b5-b27a-707bd516b005` (SME Marketplace DEV, W3Geekery org, profile `uat-clark@w3geekery`).

Records to re-push with demo tag:

### Engagements (5)

| ID | Name | Current tag |
|---|---|---|
| `eng-001-pinnacle` | Pinnacle Corp <-> W3Geekery | null |
| `eng-002-fintech` | FinTech Inc <-> W3Geekery | null |
| `eng-003-startup-xyz` | Startup XYZ <-> W3Geekery | null |
| `eng-004-lakewood` | Lakewood Health <-> W3Geekery | null |
| `eng-005-healthtech` | HealthTech Co <-> W3Geekery | null |

### SmeMartProjects (17)

| ID | Name | Current tag |
|---|---|---|
| `proj-001-crystal-harbor` | SOC 2 Type I Fast-Track Assessment | null |
| `proj-002-pinnacle-type2` | SOC 2 Type II Continuous Monitoring | null |
| `proj-003-velvet-summit` | NIST CSF Implementation Advisor | null |
| `proj-004-amber-circuit` | AI Agent for Compliance Evidence Collection | null |
| `proj-005-silver-bridge` | HIPAA Security Awareness Training | null |
| `proj-006-coral-meadow` | ISO 27001 Gap Assessment | null |
| `rfp-001-pentest` | Penetration Testing for Healthcare Portal | null |
| `rfp-002-cloud-security` | Cloud Security Posture Review | null |
| `rfp-003-ai-vuln-triage` | AI-Powered Vulnerability Triage Agent | null |
| `rfp-004-fedramp` | FedRAMP Readiness Assessment | null |
| `rfp-005-soc2-acme` | SOC 2 Type II Assessment Support | null |
| `rfp-006-hipaa-risk` | HIPAA Risk Assessment & Remediation Plan | null |
| `rfp-007-phi-monitoring` | Automated PHI Access Monitoring Agent | null |
| `rfp-008-soc-monitoring` | SOC Monitoring Setup for Healthcare Cloud | null |
| `rfp-009-security-training` | Security Training Program Development | null |
| `rfp-010-devsecops` | DevSecOps Pipeline Hardening | null |
| `rfp-011-evidence-prep` | Compliance Evidence Package Preparation | null |

### Bids (15)

`bid-001-gina-crystal` through `bid-015-carlos-soc`. Full inventory in DECISIONS.md once walkthrough captures.

### BidResponses (3)

`bidr-001-gina-crystal-req1`, `bidr-002-gina-crystal-req2`, `bidr-003-james-velvet-req1`.

### Notes (11)

5 named demo notes (`note-001` through `note-005`) + 6 UUID-keyed notes (`06f697a0-...`, `1fcea06a-...`, `60001db0-...`, `ae5255ff-...`, `c7907c01-...`, `df2bcdc8-...`).

**Total: 51 records to re-push.**

Other boundaries to audit before running (potentially containing demo records):
- `e3871f0b-56f0-4e5e-87c6-6ca196bf88c7` — SME Marketplace, profile `uat-zb` (ZeroBias org). Same 5 Engagements + 17 SmeMartProjects + 15 Bids + 3 BidResponses + 11 Notes inventory observed during probe.
- Production boundary (TBD — verify before cutover).

## Tag selection

**Use the global `marketplace`-typed `demo` tag:** `81053c14-a8e5-4939-b538-c122c7d0eb1a`.

NOT the legacy `w3geekery.sme-mart.demo-seed` tag (`d618b602-21cc-40a1-a9fa-534b7bc1672c`) — that one stays for transition-period record discovery only (per CONTEXT.md "Tag UUIDs (LOCKED)"). New tagging uses the global demo tag.

## Walkthrough recipe (Director-led)

Before any write: Director and Clark verify together that:
1. Phase 24 has CLOSED and the filter is live in the SME Mart UI.
2. Profile is set correctly (`uat-clark@w3geekery` for W3Geekery boundary; `uat-zb` for the marketplace-shared boundary).
3. Boundary ID is correct.
4. Tag UUID `81053c14-...` is correct (verify against CONTEXT.md).

For each record:

```
mcp__zerobias__zerobias_describe platform.Pipeline.receive
# (only on first iteration, to confirm payload shape)

mcp__zerobias__zerobias_execute platform.Pipeline.receive
  pipelineId: <pipelineId for this boundary>
  body: {
    receive: {
      records: [
        {
          id: "<existing record id>",
          className: "Engagement" | "SmeMartProject" | "Bid" | "BidResponse" | "Note",
          tag: [{ value: "81053c14-a8e5-4939-b538-c122c7d0eb1a" }],
          data: { ... existing payload, fetched via Object.getVersionByObjectIdOrVersionId ... }
        }
      ]
    }
  }
```

After each push: verify via `Object.getVersionByObjectIdOrVersionId(<recordId>)` that `tag` field returned populated.

After all records: re-run a positive-control GQL probe (`.eq.81053c14-...`) and confirm count matches the 51-record inventory.

**Pipeline UUIDs (from RESUME):**
- UAT receiver: `43f08afd-7ab9-4e99-a93c-619c46adaabe`
- Prod receiver: `091d5068-0527-4f45-9839-37f6d5c1669e`

## Failure modes to watch

- **Pipeline.receive payload-size limits:** if 51 records in one call exceeds the limit, batch in groups of 10–20.
- **Original payload data drift:** records may have been edited after seeding. Use `getVersionByObjectIdOrVersionId` to read current `data` field, not the seeder's static payload — overwriting with stale data would lose user edits.
- **Hub Resource cascade unknown:** per `cleanup-orphan-hydra-resources.md`, hydra Resource side-effects of re-push are not documented. Spot-check after first 5 re-pushes that hydra Resources still resolve via `hydra.Resource.getResource` for those IDs.
- **GQL caching / pagination:** Phase 24's filter may have stale results in browser sessions until refresh. Document in user-facing release note: "non-admin users may need to refresh the marketplace pages after the cleanup."

## Anti-patterns

- **Don't agent this.** Director's hard rule on MCP mutations: manual walkthrough only. Agents fabricate fields and hallucinate UUIDs.
- **Don't bulk-script this through Pipeline.receive without per-record verification.** A typo'd record ID inserts a NEW record at that ID — duplication risk.
- **Don't reuse the legacy tag.** Global demo tag is the policy.
- **Don't skip the inventory snapshot.** Without a known-good count, you can't verify the cleanup landed.

## Action items

| # | Action | Owner | Trigger |
|---|---|---|---|
| 1 | Phase 24 closes + Director checkpoint clears | gsd-execute / Director | Phase 24 verifier passes |
| 2 | Director re-runs inventory probe (the GQL queries from Decision-Probe-1) on both boundaries to confirm 51-record count is still accurate | Director | Pre-walkthrough |
| 3 | Director + Clark walk through re-push for first 5 records (one Engagement, one SmeMartProject, one Bid, one BidResponse, one Note) | Director + Clark | After step 2 |
| 4 | Spot-check hydra Resource integrity for those 5 records | Director | After step 3 |
| 5 | Bulk re-push remaining 46 records in batches of ~10 | Director + Clark | After step 4 passes |
| 6 | Final positive-control GQL probe to verify all 51 records carry the demo tag | Director | After step 5 |
| 7 | Capture walkthrough log + final counts in DECISIONS.md as "Retroactive Demo-Tag Re-Push Completed" | Director | After step 6 |
| 8 | Mark this brief CLOSED + remove from RESUME in-flight tracker | Director | After step 7 |

## Cross-references

- `.planning/phases/24-demo-data-visibility-gate/24-CONTEXT.md` — Decision-Probe-1 result + Option X tradeoff documentation.
- `.planning/director/bootstrap-w3geekery-engagement.md` — Pipeline.receive walkthrough recipe template (this brief borrows the same shape).
- `.planning/director/cleanup-orphan-hydra-resources.md` — paired cleanup brief; hydra side-effects of re-push relevant here.
- `.planning/director/DECISIONS.md` — entry to add: "Retroactive Demo-Tag Re-Push Completed" once walkthrough lands.
- `.planning/director/phase-31-brief.md` — Phase 31 production cutover; this brief is its prerequisite.

---

**Last updated:** 2026-05-01 (drafted)
