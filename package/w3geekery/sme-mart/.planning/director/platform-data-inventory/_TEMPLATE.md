---
source: <SDK_method_or_GQL_query_or_hydra_method>
surface: SDK | GQL | hydra | portal-curl
verified: YYYY-MM-DD
uat_tested: true|false
---

## Signature

<exact method signature, return type, required params, optional params>

## Sample Response (W3Geekery, real values)

<actual API response (JSON or markdown table), truncate if >500 lines with note + line count>

## Field List

| Field | Type | Always Populated? | Org-Scoped? | Notes |
|-------|------|-------------------|-------------|-------|
| <fieldName> | <type> | yes/no/sometimes | yes/no/conditional | <reason if sparse or conditional> |

## Pre-fill Map Contributions

Which Phase 28 form fields source from this call:
- `field_name` ← `Source.path` (fully pre-fillable | partial | no)

## Known Gaps / Edge Cases

- What's missing, what's null, what's conditional
- Org-scoping behavior
- Latency / pagination notes

## Write-Path Target (D-12)

Which Platform class + field or SDK setter does Phase 28 write to?
- e.g., `Pipeline.receive` for Engagement.class / `name` field
