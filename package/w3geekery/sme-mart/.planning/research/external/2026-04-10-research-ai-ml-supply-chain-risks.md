# AI/ML Supply Chain Risks & Mitigations — Deep Dive

**URL:** https://www.cyber.gov.au/sites/default/files/2026-03/Artificial%20intelligence%20and%20machine%20learning%20-%20Supply%20chain%20risks%20and%20mitigations.pdf
**Channel:** #ai-supply-chain
**Scanner item ID:** 8
**Analyzed:** 2026-04-10
**Relevance score:** 0.80
**Category:** research
**Action type:** reference
**Linked plan(s):** None (Plan 041 completed)
**Integration cost:** free
**Defer until:** N/A

## What It Is

Joint international guidance from cybersecurity agencies of eight nations (Australia ASD/ACSC, USA NSA, UK NCSC-GCHQ, Canada CSE, New Zealand NCSC, Singapore CSA, Japan NCO, South Korea NIS). Covers supply chain risks unique to AI/ML systems across six domains: training data, models, software, infrastructure, hardware, and third-party services. Maps to NIST Adversarial Machine Learning (AML) taxonomy and MITRE ATLAS.

This is the most authoritative cross-government framework for AI supply chain security available — 5-eyes-aligned with Asia-Pacific co-signers.

## SME Mart Intersection

**Plan 041 (Supply-Side Vendor Profile)** was the primary match, but it shipped in v1.1 (completed 2026-04-02). The vendor profile's 6-section structure (company info, certifications, insurance, D&B, banking, service offerings) is already live.

This document remains valuable as a **reference framework** for future iterations of vendor vetting — specifically if SME Mart adds AI/ML-specific attestation criteria beyond the current general-purpose vetting flow. The six supply chain domains map cleanly to vendor attestation categories:

| Supply Chain Domain | Vendor Profile Application |
|---|---|
| Training data | Data lineage attestation for AI vendors |
| ML models | Model provenance and audit trail |
| AI software | Software bill of materials (SBOM) |
| Infrastructure | Hosting/compute security posture |
| Hardware | GPU/NPU supply chain integrity (less relevant) |
| Third-party services | Sub-processor and API dependency disclosure |

## Pattern vs Tool

**Pure pattern/reference.** This is a guidance document, not software. Value is in the framework structure and the cross-government authority it carries. When we eventually add AI-specific vendor vetting criteria, this document provides the authoritative category taxonomy.

## Cost & Friction

- **Hardware:** none
- **Subscription:** free (public government publication)
- **Dev time to integrate:** none directly; hours if extracting attestation criteria into a template
- **Ops burden:** none
- **Dependency risk:** low — government publications are stable and vendor-neutral

## Concrete SME Mart Application

### Pattern: AI Vendor Attestation Checklist

If SME Mart adds AI-specific vetting beyond Plan 041's general framework, this document provides the category structure:

```markdown
## AI/ML Vendor Attestation (derived from Joint Intl. Guidance)

### Data Practices
- [ ] Training data sourcing documented
- [ ] Data lineage and provenance records maintained
- [ ] PII handling compliant with applicable regulations

### Model Governance
- [ ] Model versioning and audit trail
- [ ] Bias testing methodology documented
- [ ] Model card or equivalent published

### Software Supply Chain
- [ ] SBOM (Software Bill of Materials) available
- [ ] Dependency vulnerability scanning in CI/CD
- [ ] Open-source license compliance verified

### Infrastructure Security
- [ ] Compute environment isolation documented
- [ ] Access controls for training infrastructure
- [ ] Incident response plan for ML pipeline compromise

### Third-Party Services
- [ ] Sub-processor list disclosed
- [ ] API dependency inventory maintained
- [ ] Data residency and jurisdiction documented
```

### Credibility Signal

Citing "aligned with Joint International Guidance on AI/ML Supply Chain Security (ASD, NSA, NCSC, CSE, et al.)" in marketplace materials gives SME Mart's vetting framework credibility that no single-vendor certification can match. This is a marketing/trust-building asset as much as a technical one.

## Recommendation

**reference** — Plan 041 is complete. This document is a pattern library entry for future AI-specific vendor vetting iterations. No active plan to cross-reference, no spike needed. The framework taxonomy and authority signal are the lasting value.

## Discussion Questions

No active phase to inform. If a future milestone adds AI-specific vendor attestation, these questions would apply:

1. **AI-specific vetting depth** — Should SME Mart's vendor profile include AI/ML-specific attestation fields (data lineage, model provenance, SBOM), or is the current general-purpose vetting sufficient for v1.x?
   - **Option A:** Add AI-specific fields now — differentiator for AI-focused marketplace positioning
   - **Option B:** Defer until customer demand signals the need — avoid over-engineering vetting for v1.x
   - **Default if not decided:** Defer (Plan 041 is shipped and stable)
   - **Relevant plans:** 041 (completed), future AI vetting plan TBD

## Links

- **Original:** https://www.cyber.gov.au/sites/default/files/2026-03/Artificial%20intelligence%20and%20machine%20learning%20-%20Supply%20chain%20risks%20and%20mitigations.pdf
- **Scanner analysis (scan-mode):** ~/.claude/slack-scanner/analysis/aus-cyber-ai-supply-chain.md
- **Related drops:** [tool-promptql](2026-04-10-tool-promptql.md)
- **Related plans:** Plan 041 (completed v1.1)
- **Related standards:** NIST AML taxonomy, MITRE ATLAS, OWASP Top 10 for LLM
