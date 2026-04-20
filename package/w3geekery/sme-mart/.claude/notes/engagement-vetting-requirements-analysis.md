# Engagement Vetting Requirements Analysis

**Created:** 2026-03-25
**Sources:** CDPH HBEDS RFP, Vancouver Clinic Enterprise Imaging RFP, AAH Policies & Standards, RFP Reference Super-Summary
**Purpose:** Define the corp-to-corp vetting checklist that must be satisfied before project work begins under an Engagement.

---

## Three Tiers

### Always Required (every engagement)

| Category | Requirement | Evidence Type |
|----------|-------------|---------------|
| **Corporate Identity** | Corporate registration (articles, business license) | Document |
| | Certificate of Good Standing | Document |
| | Tax ID (EIN/TIN) verification | Document |
| | Authorization to conduct business in state(s) | Document |
| **Insurance** | Commercial General Liability ($1M per/$2M aggregate) | COI |
| | Workers' Compensation (statutory + $1M employer's liability) | COI |
| | Carrier: AM Best A- or better, Category VI+ | COI |
| **Anti-Corruption** | Debarment certification (not suspended/debarred) | Attestation |
| | No convictions in past 3 years | Attestation |
| **Financial** | Audited financial statements (most recent FY) | Document |
| | D&B report or credit check | Document |
| | Corporate stability statement | Attestation |
| **Contacts** | Primary, Executive, Technical, Legal contacts | Form |
| **Non-Discrimination** | Non-discrimination affidavit | Attestation |

### Conditional (depends on engagement type/industry/value)

| Trigger | Requirements |
|---------|-------------|
| **Healthcare / PHI** | HIPAA BAA, HITRUST/SOC 2 Type II cert, FDA 21 CFR Part 11, workforce background checks, signed confidentiality statements |
| **Government / Federal $** | Federal funding audit (2 CFR 200 if >$750K), Clean Air/Water Act compliance, Small Business/DVBE plan, lobbying certification |
| **High Value (>$500K)** | Bid bond (5-10%), performance bond (50-100%), bank letter of credit |
| **Data Protection** | Penetration test authorization, annual security training docs, breach notification plan, data retention/destruction policy |
| **Subcontracting** | Subcontractor disclosure & approval, pass-through compliance clauses, 3 competitive bids for sub selection |

### Nice to Have (not blocking)

- Framework certifications (CISSP, CISM, HITRUST CCSFP, PCI-QSA)
- Client references / case studies
- Published security policy documentation
- Change management / incident response plans

---

## Timeline by Engagement Type

| Type | Always Items | Conditional Items | Expected Duration |
|------|-------------|-------------------|-------------------|
| Government SaaS (CDPH model) | Corporate ID, Insurance, Debarment, Financials | Federal audit, workforce clearance, state licensing | 10-14 business days |
| Healthcare System (Vancouver model) | All "always" | HIPAA BAA, HITRUST, SOC 2, references | 14-21 business days |
| Compliance Consulting (AAH model) | Corporate ID, Insurance, D&B | Framework certs, portfolio, references | 7-10 business days |
| High-Value Strategic (>$500K) | All "always" | Bonds, audit financials, exec interviews | 21-30 business days |

---

## Proposed Data Model

```typescript
type VettingCategory = 'always' | 'conditional' | 'nice_to_have';
type VettingType = 'corporate_identity' | 'insurance' | 'compliance' | 'financial' |
                   'legal' | 'reference' | 'certification' | 'documentation';
type VettingStatus = 'not_started' | 'submitted' | 'under_review' | 'verified' |
                     'rejected' | 'expired' | 'waived';
type EvidenceType = 'document' | 'form' | 'certification' | 'attestation' | 'reference';

interface EngagementVettingItem {
  id: string;
  engagementId: string;

  // Classification
  category: VettingCategory;
  type: VettingType;
  name: string;
  description: string;

  // Conditions (when conditional)
  conditionTrigger?: string;      // "Healthcare engagement", "Federal $ >$750K"
  industry?: string;              // healthcare, government, financial
  frameworks?: string[];          // HIPAA, NIST, PCI-DSS
  minEngagementValue?: number;    // threshold in cents

  // Evidence
  evidenceType: EvidenceType;
  documentIds?: string[];         // linked SmeMartDocument IDs

  // Workflow
  status: VettingStatus;
  submittedAt?: string;
  verifiedAt?: string;
  verifiedBy?: string;            // ZB user ID
  expiresAt?: string;             // for time-limited items (insurance COI)
  rejectionReason?: string;

  // Bidirectional — buyer can also have requirements from provider
  direction: 'buyer_requires' | 'provider_requires' | 'both_require';
}
```

## UI Implications (Plan 063)

**Buyer view:** Vetting checklist with progress bar — "8/12 items verified"
**Vendor view:** Required documents — "6 submitted, 2 pending review"
**Both:** Automated reminders when documents expire (insurance COI renewal)
**Gate:** Project stays `pending_engagement` until required items reach `verified` or `waived` status

## Open Questions

1. Are "always required" items truly universal, or should they be configurable per org? (Some orgs may not need D&B for small engagements.)
2. Who defines the conditional triggers — the buyer org, the platform, or both?
3. Should waived items require justification/approval?

These are captured in [open-questions-for-brian-kevin.md](open-questions-for-brian-kevin.md) questions 1-5.
