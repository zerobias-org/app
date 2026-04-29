# Work Worlds + SME Mart Integration Reference

**Source:** Joe Llamas docs (2026-02-25) — `Work_Worlds_ZB_Summary.docx` + `Work_Worlds_SME_Mart_Integration.pdf`

---

## Three-Layer Architecture

```
External Systems (Stellar Cyber, Mend, Palo Alto)
        ↓ findings
ZeroBias (ZB) — Truth Layer
  Tasks, Findings, Boundaries, Compliance, Audit Graph, Auth, Orgs, Catalog, Tags
        ↓ normalized tasks
        ├──────────────────────────────┐
        ↓                              ↓
Work Worlds — Execution Layer    SME Mart — Marketplace Layer
  Missions, AI agents,             Provider discovery, RFPs,
  scoring, proof of work           contracting, reviews
```

- **ZB** = system of record. Normalizes findings into tasks. Governance, auth, boundaries.
- **Work Worlds** = execution and performance layer. Transforms tasks into missions, assigns work, tracks execution, produces verified outcomes.
- **SME Mart** = marketplace layer. Provider discovery, RFPs/proposals, contracting, marketplace UX.

## Responsibilities Split

### Work Worlds Owns

- **Matchmaking** (execution fit — skill + performance matching)
- **Adaptive assessments** (quiz/testing for provider capability)
- **Credential verification** (Credly badges, certifications)
- **Performance scoring** (speed, quality, completion, accuracy)
- **Execution tracking** (mission progress, audit logs)
- **Proof of work** (logs + video highlights via Fal.ai)
- **Mission layer** (CaseTask → Mission, ranking, reward, execution context)
- **AI agents** (Claude CISSP agent for analysis and remediation)

### SME Mart Owns

- **Provider discovery** (profiles, search, catalog filters)
- **RFPs and proposals** (buyer posts RFP, providers submit proposals)
- **Contracting** (engagement lifecycle, work requests)
- **Marketplace UX** (the storefront experience)
- **Reviews** (subjective feedback from buyers)

### Non-Negotiable Principle

> Scoring, performance validation, and assessments must exist in a single system (Work Worlds / Zero Bias layer) to preserve trust and avoid duplication.

SME Mart **consumes** scoring/assessment/credential data from WW APIs. SME Mart does **not** compute or store authoritative scores.

## Integration APIs (WW → SME Mart)

SME Mart will consume these APIs from Work Worlds:

| API | What SME Mart Gets | Where It Shows |
|-----|-------------------|----------------|
| **Scoring** | Provider performance scores (speed, quality, completion, accuracy) | Provider cards, profile badges |
| **Credentials** | Verified Credly badges, certifications | Provider profiles, search filters |
| **Matchmaker** | Skill-based provider recommendations for RFPs | RFP matching, "suggested providers" |
| **Assessments** | Assessment pass/fail status, scores | Provider readiness indicators |
| **Engagement performance** | Mission completion data, proof of work | Engagement detail, timeline events |
| **Mission events** | Mission Started, Completed, Assessment Passed, Score Updated | Timeline feed (read-only entries) |

## What's Built in Work Worlds

- Electron desktop app (React 19 + Vite + Three.js + Zustand)
- Auth0 PKCE + API key auth with encrypted storage
- Stellar Cyber ingestion (alerts/cases via collector)
- ZB integration for findings and tasks
- Unified CaseTask model (SC + ZB)
- Mission layer for ranking, reward, execution context
- Claude AI (CISSP agent) for analysis and remediation
- Execution system with audit logs
- Video generation via Fal.ai
- IPC bridge (Electron ↔ renderer)

### ZB Starter Kit Packages

| Package | Purpose |
|---------|---------|
| `core` | EventBus, config, plugins |
| `zb-client` | Mock APIs (future HTTP provider) |
| `task-engine` | Task lifecycle management |
| `matchmaker` | Skill-based assignment |
| `payments` | Mock provider (future Stripe) |
| `skill-runner` | AI execution framework |

## SME Mart Build Spec (from Joe's docs)

- **Angular modules:** marketplace, profiles, RFPs, proposals, engagements, reviews, admin
- **Neon tables:** provider_profiles, service_offerings, work_requests, proposals, engagements, reviews
- **UX flows:** onboarding, RFP lifecycle, execution via Work Worlds, performance feedback
- **Phased build:** MVP marketplace → integrate matchmaker → performance + proof

## Build Strategy

> Prototype in Work Worlds for speed, then migrate stable and validated components into Zero Bias for permanence. This allows rapid iteration while building a long-term scalable platform.

This means some WW features may eventually become ZB platform apps (e.g., scoring, billing). Brian's directive that "scoring and billing are ZB apps" aligns with this migration path — they start in WW and graduate to ZB.

---

*Reference document — update as WW APIs become available for integration.*
