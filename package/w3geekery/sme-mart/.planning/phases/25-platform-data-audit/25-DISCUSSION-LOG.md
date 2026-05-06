# Phase 25: Platform Data Audit - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-24
**Phase:** 25-platform-data-audit
**Areas discussed:** Anchor field set, Coverage strategy, Known-unknown classification, Pipeline health check scope, Research methodology, Inventory file structure, Sample data redaction, Pre-fill map row keys, Brian/Kevin escalation, Inventory staleness, Prior-art handling, Write-path catalog

---

## Round 1 — Initial gray-area selection

| Option | Description | Selected |
|--------|-------------|----------|
| Anchor field set for pre-fill map | Choose canonical field list to map against | ✓ |
| Coverage strategy (9 floor vs opportunistic) | Strict 9 vs expand opportunistically | ✓ |
| Known-unknown classification rule | What counts as a known-unknown | ✓ |
| Pipeline health check scope | Pure ping vs ping + config-drift audit | ✓ |

**User's choice:** All four selected.

---

## Anchor field set for pre-fill map

| Option | Description | Selected |
|--------|-------------|----------|
| Researcher proposes draft convention | Synthesize from Phase 28 brief + VendorProfileItem + live SDK; Phase 26 ratifies | ✓ |
| Phase 28 brief enumeration verbatim | Use phase-28-brief.md field list as-is | |
| Existing VendorProfileItem 6 sections | Use the 6-section corporate profile schema | |
| Hybrid: Phase 28 brief + VendorProfileItem cross-ref | Phase 28 primary + VendorProfileItem cross-reference | |

**User's choice:** Researcher proposes draft convention.
**Notes:** Avoids circular dep where Phase 26 needs Phase 25 + Phase 26's convention feeds Phase 28.

---

## Coverage strategy

| Option | Description | Selected |
|--------|-------------|----------|
| 9 minimum + bounded expansion | Add only when feeds Phase 28 or surfaces known-unknown | |
| Strict 9-only | Document only the 9; rest in appendix | |
| Aggressive expansion | 9 + everything researcher trips over | ✓ |

**User's choice:** Aggressive expansion.
**Notes:** First attempt at this question got "wtf does 9 floors mean?" — re-asked with explicit list of the 9 sources. Budget overshoot accepted.

---

## Known-unknown classification rule

| Option | Description | Selected |
|--------|-------------|----------|
| Flat list with a 'why' note per field | One entry per field, free-text reason | ✓ |
| Sub-categorized list (truly-missing / proxy-ambiguous / exists-but-null) | Three formal labels | |
| Just the bare list, no annotation | List only | |

**User's choice:** Flat list with 'why' note per field.
**Notes:** First framing ("four sub-categories") got "this also doesn't make sense" — re-asked with concrete examples (Logo URL = truly missing; Primary contact email = proxy exists, wrong scope; etc.).

---

## Pipeline health check scope

| Option | Description | Selected |
|--------|-------------|----------|
| Ping + config-drift audit | Ping + grep app code for pipelineId mismatches + document remediation | |
| Pure receive ping | Throwaway push, confirm 200, stop | |
| Ping + config-drift audit + actually fix the env file | Same as audit + apply the one-line env-file edit | ✓ |

**User's choice:** Ping + audit + fix env file.
**Notes:** Loosens "no app code" constraint for the one-line env-file fix. Documented in CONTEXT.md as a bounded carve-out.

---

## Round 2 — Second-tier gray-area selection

| Option | Description | Selected |
|--------|-------------|----------|
| Research methodology — how live? | Live re-run all vs spot-check vs hybrid | ✓ |
| Inventory file structure | Mega-doc vs index+sub-files vs single+samples folder | ✓ |
| Sample data + redaction policy | Real values vs hybrid vs full sentinels | ✓ |
| Pre-fill map row keys — which side leads? | Form-field-first vs platform-first vs both | ✓ |

**User's choice:** All four selected.

---

## Research methodology

| Option | Description | Selected |
|--------|-------------|----------|
| Live re-run every source | Full live MCP audit | ✓ |
| Live for unfamiliar, memory for known | Hybrid | |
| Brief minimum (spot-check 3 random) | Lean on memory, verify 3 | |

**User's choice:** Live re-run every source.

---

## Inventory file structure

| Option | Description | Selected |
|--------|-------------|----------|
| Index + per-source sub-files | `PLATFORM-DATA-INVENTORY.md` index + `platform-data-inventory/<source>.md` files | ✓ |
| Single mega-doc per brief | All-in-one file | |
| Single doc + appendix folder for raw responses | Markdown single + JSON samples in subfolder | |

**User's choice:** Index + per-source sub-files.

---

## Sample data + redaction policy

| Option | Description | Selected |
|--------|-------------|----------|
| Real values from W3Geekery test org | No redaction | ✓ |
| Hybrid — real UUIDs, redacted human strings | Defensive | |
| Fully redacted sentinels | Maximum redaction | |

**User's choice:** Real values from W3Geekery test org.

---

## Pre-fill map row keys

| Option | Description | Selected |
|--------|-------------|----------|
| Phase 28 form fields lead, platform paths in column | Form-first orientation | ✓ |
| Platform paths lead, form fields in column | Platform-first orientation | |
| Two tables (form-first AND platform-first) | Both views | |

**User's choice:** Phase 28 form fields lead, platform paths in column.

---

## Round 3 — Third-tier gray-area selection

| Option | Description | Selected |
|--------|-------------|----------|
| Brian/Kevin escalation policy when researcher hits a true gap | When/how to surface gaps externally | ✓ |
| Inventory staleness / versioning | Per-source date vs document-level vs none | ✓ |
| Integrate prior art | Pull as starting point vs reference vs ignore | ✓ |
| Phase-25 deliverable on what writes look like | Read-only vs read+write inventory | ✓ |

**User's choice:** All four selected.

---

## Brian/Kevin escalation policy

| Option | Description | Selected |
|--------|-------------|----------|
| Note in inventory; Phase 28 decides | Researcher just lists gaps; Phase 28 escalates | ✓ |
| File ZB-task for Kevin automatically | Proactive ZB-tasks in W3Geekery↔ZB engagement | |
| Threshold-based | Only escalate gaps blocking company_info convention | |

**User's choice:** Note in inventory; Phase 28 decides on escalation.

---

## Inventory staleness / versioning

| Option | Description | Selected |
|--------|-------------|----------|
| Per-source `Verified: YYYY-MM-DD` header | Top-of-file freshness markers | ✓ |
| Single document-level verified date | One date for the whole audit | |
| No staleness markers | Read-once artifact | |

**User's choice:** Per-source `Verified: YYYY-MM-DD` header.

---

## Prior-art handling

| Option | Description | Selected |
|--------|-------------|----------|
| Pull as starting point, verify each via live MCP | Seed from prior art, then verify | |
| Reference, don't seed | Cite in references, but discover via live MCP | ✓ |
| Ignore prior art entirely | Fresh audit | |

**User's choice:** Reference, don't seed.

---

## Write-path catalog

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — produce write-path map alongside read-path map | Save-target column added to pre-fill map | ✓ |
| No — reads only; Phase 28 figures out writes | Strict read inventory | |
| Yes for non-obvious writes only | Document only surprising writes | |

**User's choice:** Yes — Phase 25 produces write-path map alongside read-path map.

---

## Claude's Discretion (areas where user did not constrain)

- Per-source sub-file template specifics (exact frontmatter format, field-table layout)
- Sample-response truncation threshold
- Index-file table-of-contents ordering

## Deferred Ideas

- Per-org LLM-prompt generation brief (separate director artifact)
- ServiceOffering inventory (Brian-blocked, deferred to v1.5)
- MCP-server bulk shape capture tooling (future work)
- Documenting ZB platform internals (out of scope by definition)
