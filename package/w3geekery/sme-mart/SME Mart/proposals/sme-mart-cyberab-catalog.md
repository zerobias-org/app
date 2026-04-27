# SME Mart — Compliance Roles & Certifications Catalog

**Purpose:** Catalog every role and certification that a **Buyer** in SME Mart might want a **Seller** to hold. Started from [cyberab.org](https://cyberab.org) (CMMC/SCF/SCA ecosystems) and expanded to adjacent compliance frameworks (FedRAMP, HITRUST, PCI, SOC 2, CSA STAR, IAPP, ISO 27001) plus cross-framework individual credentials (ISACA, (ISC)², CompTIA, GIAC, Offensive Security, EC-Council, IAPP, CSA, CREST, Mile2, FITSI).

**Status:** Research / data-gathering only. No schema decisions, no SME Mart code changes in this document. See _Data Model Options_ at the end for proposals to discuss.

**Sources:**
- **Primary:** Local mirror of cyberab.org (all pages under `/CMMC-Ecosystem/`, `/SCF-Ecosystem/`, `/SCA-Ecosystem/`, `/Accreditation/`, `/Resources/Terminology`) scraped 2026-04-23 via `scripts/scrape-cyberab.sh`.
- **Hop 1:** `isaca.org/cmmc` — CAICO-designated training provider for CMMC credentials.
- **Hops across adjacent ecosystems** (2026-04-23, via WebFetch): PCI SSC, HITRUST, IAPP, CSA STAR, ISACA, (ISC)², CompTIA, GIAC, CREST, Offensive Security.
- **Could NOT reach:** `public.cyber.mil/dcwf-work-role/security-control-assessor/` — CAC/SAML-gated. Authoritative DoD 8140.3 Career Pathway 612 cert list is only directly retrievable via CAC. The cyberab.org snapshot (September 2025) remains our best source; treat it as stale after ~90 days and flag in UI.

**Scripts:**
- `scripts/scrape-cyberab.sh` — mirror cyberab.org to `/tmp/cyberab-mirror/`
- `scripts/extract-cyberab.py` — extract headings/tables/lists from the mirror to JSON

---

## 1. Ecosystem Landscape

The Cyber AB hosts **three distinct ecosystems**, each with its own role set and authority chain:

| Ecosystem | What it certifies | Governing body (individuals) | Governing body (orgs) |
|---|---|---|---|
| **CMMC** (Cybersecurity Maturity Model Certification) | DoD contractor cybersecurity maturity (Levels 1-3) | CAICO | Cyber AB |
| **SCF** (Secure Controls Framework) | Multi-regulatory cybersecurity baselines (NIST CSF, HIPAA, DORA, NIS2, etc.) | SCF Council + Cyber AB | Cyber AB |
| **SCA** (Secure Code Alliance) | Secure software development practices | SAICO | Cyber AB |

All three share two fundamental role archetypes:

- **Consulting / Implementation** — prepares the client for certification (e.g. RP, RPO)
- **Assessing / Certification** — performs the third-party assessment (e.g. C3PAO, CCA)

Some ecosystems add a third archetype:
- **Training / Instruction** (CMMC) — teaches and certifies assessors (ATP, CCI, APP)
- **Servicing / Platform** (SCF) — embeds the framework in GRC platforms (APO, APP)

> "SCF APP" (Authorized Platform **Partner**) and CMMC "APP" (Approved Publishing **Partner**) are **different roles that share an acronym.** Namespace carefully in the data model.

---

## 2. Roles Catalog

### 2.1 CMMC Roles

Source: `CMMC-Ecosystem/Ecosystem-Roles.html`, `.../Assessing-and-Certification.html`, `.../Consulting-and-Implementation.html`, `.../Training-and-Instruction.html`, `.../DIB-Companies-OSCs.html`

| ID | Role | Scope | Description | Fee / Renewal |
|---|---|---|---|---|
| `CMMC.RPO` | Registered Practitioner Organization | **Org** | Consultative organization / MSP that delivers non-certified advisory services via RPs. Does NOT conduct certified assessments. | $6,000 application / $5,000 annual renewal |
| `CMMC.RP` | Registered Practitioner | **Individual** | Base-level practitioner — CMMC implementation consultant. Works for an RPO or independent contractor. | $600 application+training+test / $500 annual renewal |
| `CMMC.RPA` | Registered Practitioner Advanced | **Individual** | Advanced-level practitioner (requires active RP). | $1,000 application+training+test / $750 annual renewal |
| `CMMC.C3PAO` | CMMC Third-Party Assessment Organization | **Org** | Authorized to conduct Level 2 assessments. Employs CCPs/CCAs. | $6,000 application + $15,000 authorization / included in agreement |
| `CMMC.CCP` | Certified CMMC Professional | **Individual** | Entry-level assessor. Can participate in Level 2 assessments but only to verify Level 1 practices; cannot make final determinations. | $200 registration + $275 exam / $250 annual renewal |
| `CMMC.CCA` | Certified CMMC Assessor | **Individual** | Full Level 2 assessor. Can make final assessment determinations. Requires active CCP. | $50 registration + $350 exam / $500 annual renewal |
| `CMMC.LCCA` | Lead CMMC Certified Assessor | **Individual** | Senior assessor. Leads assessment teams. Requires enhanced DoD experience. | $100 registration / $100 annual renewal |
| `CMMC.CCI` | CMMC Certified Instructor | **Individual** | Instructs CMMC courses for ATPs. Currently rolling out from "Provisional Instructor" (PI). | $2,500 application+training+test / annual renewal |
| `CMMC.ATP` | Approved Training Provider | **Org** | Vetted by CAICO to deliver CMMC training courses. Formerly "Licensed Training Provider (LTP)". | _(separate registration; see LTP-Registration page)_ |
| `CMMC.APP` | Approved Publishing Partner | **Org** | Vetted by CAICO to create training curriculum. _**Currently NOT accepting applications.**_ | $6,000 application / $5,000 annual renewal |
| `CMMC.OSC` | Organization Seeking Certification | **Org** | The DIB company pursuing CMMC certification — i.e. the Buyer-of-services in most SME Mart flows. | _(no fee — this is the customer side)_ |
| `CMMC.CQAP` | CMMC Quality Assurance Professional | **Individual** | Cyber AB–trained role ensuring assessment documentation completeness. | _(not in requirements grid — referenced in Terminology page only)_ |

**Notes:**
- **Tier 3 background check** is required for all CCP/CCA/LCCA/CCI. DMCA-conducted or DoD-equivalent.
- **US Citizenship** required for CCA to participate on assessment teams.
- CCP -> CCA -> LCCA is a strict progression; each requires the prior credential.
- RP/RPA are for _consulting_; CCP/CCA/LCCA are for _assessing_; the same person CAN hold both but may NOT assess a company they previously consulted for.

### 2.2 SCF Roles

Source: `SCF-Ecosystem/Ecosystem-Roles.html`, `.../SCF-Certifications.html`, `.../What-is-SCF.html`

| ID | Role | Scope | Description | Fee / Renewal |
|---|---|---|---|---|
| `SCF.RPO` | SCF Registered Provider Organization | **Org** | Consulting on SCF requirements and readiness; implements SCF frameworks. | $6,000 application / $5,000 annual |
| `SCF.3PAO` | SCF Third-Party Assessment Organization | **Org** | Conducts SCF conformity assessments; issues certifications; uploads results to SCF Connect. | $5,000 application / $5,000 authorization (annual included) |
| `SCF.APP` | SCF Authorized Platform Partner | **Org** | Integrates SCF framework into GRC platforms. | $10,000 application / $10,000 annual |
| `SCF.APO` | SCF Authorized Platform Organization | **Org** | Provides cloud platform environments for SCF implementation (CSPs, cloud RM tools). | $6,000 application / $5,000 annual |
| `SCF.Practitioner` | SCF Practitioner | **Individual** | Individual credential — staff minimum for SCF RPO. | _(not listed in requirements grid — managed by SCF Council)_ |
| `SCF.Architect` | SCF Architect | **Individual** | Senior individual credential — staff minimum for APO/APP. | _(not listed in requirements grid)_ |
| `SCF.Assessor` | SCF Assessor | **Individual** | Individual credential — minimum 2 required for SCF 3PAO. | _(not listed in requirements grid)_ |
| `SCF.OSA` | Organization Seeking Assessment | **Org** | The client pursuing SCF certification. | _(customer side)_ |

### 2.3 SCA (Secure Code Alliance) Roles

Source: `SCA-Ecosystem/What-is-SCA.html`

| ID | Role | Scope | Description |
|---|---|---|---|
| `SCA.3PAO` | SCA Third-Party Assessment Organization | **Org** | Conducts SCA assessments (reusing SCF 3PAO accreditation). |
| `SCA.SDO` | Secure Development Organization | **Org** | Client-side — orgs pursuing CODE 1/2/3 certification. |
| `SCA.Practitioner` | SCA Practitioner | **Individual** | Individual credential for secure coding/threat modeling (managed by SAICO). |
| `SCA.Architect` | SCA Architect | **Individual** | Senior individual credential for secure software architecture (managed by SAICO). |

### 2.4 Role Relationship Diagram (CMMC — canonical example)

```
  Client side                Consulting                Assessing                Training
  ───────────                ──────────                ─────────                ────────

  OSC ◄── engages ──── RPO ◄── employs ── RP / RPA        C3PAO ◄── employs ── CCP / CCA / LCCA      ATP ◄── employs ── CCI
  (DIB)                 (org)              (individuals)     (org)                 (individuals)           (org)      (individual)
                                                                                                        APP
                                                                                                        (org — curriculum)
```

The same Seller organization may hold **multiple** roles (e.g. an RPO that is also a C3PAO), but per Cyber AB conflict-of-interest rules, the same legal entity cannot consult AND assess the same OSC.

---

## 3. Certifications Catalog

There are **two classes** of certifications:

1. **Cyber AB / CAICO / SAICO-issued credentials** — the roles themselves (CCP, CCA, CCI, etc.) — already enumerated in Section 2.
2. **Baseline industry certifications** — prerequisites accepted for the CCA role, sourced from the DoD Manual 8140.3 Cyberspace Workforce Qualification & Management Program, Career Pathway **612 (Security Control Assessor)**.

### 3.1 DoD 8140.3 Career Pathway 612 Baseline Certifications

Source: `CMMC-Ecosystem/Ecosystem-Roles/Assessing-and-Certification.html` — table "8140.3 – 612 Certifications" (as of September 2025).

A **CCA candidate must hold at least one** of these at the Intermediate OR Advanced proficiency level.

| ID | Issuer | Certification | Proficiency |
|---|---|---|---|
| `8140-612.CASP+` | CompTIA | SecurityX / CASP+ | Intermediate |
| `8140-612.CGRC` | (ISC)² | CGRC / CAP | Intermediate |
| `8140-612.CISSO` | Mile2 (United American Technologies, LLC) | CISSO | Intermediate |
| `8140-612.Cloud+` | CompTIA | Cloud+ | Intermediate |
| `8140-612.FITSP-A` | Federal IT Security Institute | FITSP-A | Intermediate |
| `8140-612.GCSA` | GIAC | GCSA | Intermediate |
| `8140-612.GSEC` | GIAC | GSEC | Intermediate |
| `8140-612.PenTest+` | CompTIA | PenTest+ | Intermediate |
| `8140-612.Security+` | CompTIA | Security+ | Intermediate |
| `8140-612.CCISO` | EC-Council | CCISO | Advanced |
| `8140-612.CISA` | ISACA | CISA | Advanced |
| `8140-612.CISM` | ISACA | CISM | Advanced |
| `8140-612.CISSP` | (ISC)² | CISSP | Advanced |
| `8140-612.CISSP-ISSEP` | (ISC)² | CISSP-ISSEP | Advanced |
| `8140-612.CySA+` | CompTIA | CySA+ | Advanced |
| `8140-612.GSLC` | GIAC | GSLC | Advanced |
| `8140-612.GSNA` | GIAC | GSNA | Advanced |

_DoD may update this list; the authoritative source is `public.cyber.mil/dcwf-work-role/security-control-assessor/`._

### 3.2 CMMC Pre-Training Prerequisites (CCP)

Source: `CMMC-Ecosystem/Ecosystem-Roles/Assessing-and-Certification.html` — "Certification Requirements for CCP"

Recommended **before** CCP enrollment:
- College degree in cyber/IT, **or** 2+ years related experience/education, **or** 2 years equivalent (including military)
- **CompTIA A+** (or equivalent knowledge/experience)
- DoD Mandatory CUI Awareness Training

### 3.3 SCF-Issued Certifications (Organizational Baselines)

Source: `SCF-Ecosystem/SCF-Certifications.html`

The SCF Council (via Cyber AB accreditation) issues **organizational certifications** mapped to specific regulatory frameworks. A Seller's SCF 3PAO role gives them the authority to issue these; a Seller with a consulting role may help a client _prepare_ for them.

**Currently Available:**
- SCF CORE Fundamentals
- NIST Cybersecurity Framework 2.0 (NIST CSF 2.0)
- NIST SP 800-161 R1 (C-SCRM baseline)
- HIPAA Security Rule (NIST SP 800-66 R2)
- NY DFS 23 NYCRR500 — 2023 Amendment 2
- New Zealand Health Information Security Framework 2022
- DHS CISA Secure Software Development Attestation Form
- NIST SP 800-171 R3 (non-CMMC)
- Federal Acquisition Regulation (FAR) 52.204.21 (CMMC Level 1)

**Planned for 2026:**
- SCF CORE External Service Provider (ESP)
- Australia Essential Eight
- EU Digital Operational Resilience Act (DORA)
- ENISA NIS2 (Directive (EU) 2022/2555)
- Gramm-Leach-Bliley Act (GLBA) — 16 CFR Part 314

**Planned later (Q3/Q4 2025 in the doc — may have shipped):**
- DHS Zero Trust Capability Framework (ZTCF)
- CMMC 2.0 Level 2 → NIST CSF 2.0 Mapping
- NIST SP 800-218 v1.1 (CODE 2 for SCA)

### 3.4 SCA CODE Certifications (Organizational)

Source: `SCA-Ecosystem/What-is-SCA.html`

| ID | Certification | Maps to |
|---|---|---|
| `SCA.CODE1` | Certified Organization for Development Excellence — Level 1 | CISA Secure Software Development Attestation Form (SSDAF) — EO 14028 |
| `SCA.CODE2` | CODE Level 2 | NIST SP 800-218 (Secure Software Development Framework) |
| `SCA.CODE3` | CODE Level 3 | Custom — contract/industry/mission-specific |

Assessment outcomes: **Strictly Conforms, Conforms, Significant Deficiency, Material Weakness**.

### 3.5 Accreditation Standards (ISO/IEC)

Source: `Accreditation/*.html`

These apply to the **Cyber AB itself**, but are relevant context for Buyers vetting the chain of trust:

| Standard | What it accredits |
|---|---|
| ISO/IEC 17011 | Accreditation bodies (applied to Cyber AB) |
| ISO/IEC 17020 | Inspection bodies (applied to C3PAOs / 3PAOs) |
| ISO/IEC 17024 | Certification bodies for persons (applied to CAICO / SAICO) |

---

## 4. Role ↔ Certification Mapping

This is the join table that makes Buyer-side filtering work. For each role, what certs does it **require** vs **recommend** vs **confer**?

### 4.1 CMMC

| Role | Requires (prerequisite) | Confers (is itself a credential) |
|---|---|---|
| `CMMC.CCP` | _Prerequisite:_ CompTIA A+ (or equivalent); DoD CUI Awareness Training; Tier 3 background | `CMMC.CCP` credential |
| `CMMC.CCA` | Active `CMMC.CCP`; 3+ years cybersecurity; 1+ year assessment/audit; **one of** `8140-612.*` (Intermediate OR Advanced); Tier 3 | `CMMC.CCA` credential |
| `CMMC.LCCA` | Active `CMMC.CCA`; enhanced DoD experience | `CMMC.LCCA` credential |
| `CMMC.RP` / `CMMC.RPA` | _(no 8140.3 prerequisite — own training+exam)_ | `CMMC.RP` / `CMMC.RPA` |
| `CMMC.CCI` | Meets assessor requirements at the level they'll instruct | `CMMC.CCI` credential |
| `CMMC.C3PAO` (org) | Experian financial review; DCSA FOCI review; CMMC Level 2 assessment by DCMA DIBCAC; employs CCP/CCA | _(authorization, not a cert)_ |
| `CMMC.RPO` (org) | Background check | _(registration, not a cert)_ |

### 4.2 SCF

| Role | Requires | Confers |
|---|---|---|
| `SCF.RPO` (org) | Background check; min. (1) `SCF.Practitioner` OR (1) `SCF.Architect` on staff | Registration |
| `SCF.APO` (org) | Background check; completed SCF Platform Assessment; min. (1) `SCF.Architect` on staff | Registration |
| `SCF.APP` (org) | Background check; integrated SCF into platform; min. (1) `SCF.Architect` on staff | Registration |
| `SCF.3PAO` (org) | Commercial background check; procedural assessment; min. (2) `SCF.Assessor` on staff | Authority to issue SCF cert baselines from §3.3 |

### 4.3 SCA

| Role | Requires | Confers |
|---|---|---|
| `SCA.3PAO` (org) | Cyber AB accreditation (typically via SCF 3PAO status) | Authority to issue `SCA.CODE1/2/3` |
| `SCA.SDO` (org) | Audit; Report on Conformity | Receives `SCA.CODE1/2/3` |
| `SCA.Practitioner` | _(SAICO-managed; details on SAICO site)_ | `SCA.Practitioner` |
| `SCA.Architect` | _(SAICO-managed)_ | `SCA.Architect` |

---

## 5. Data Model Options

Now we have the concrete catalog, here's what storing it looks like under each option.

### Option A — Platform Tags

Use the existing platform `tag` / `tagType` infrastructure. One tag per cert (e.g. `cmmc-ccp`, `iso-17020`, `8140-612-cissp`).

| Pros | Cons |
|---|---|
| Zero schema work — re-uses existing ZB tag + RBAC + search | Flat namespace — no structured relationships (role requires cert, cert confers authority) |
| Immediate cross-app reuse (Seller profile, Service listings, etc.) | No per-cert metadata (issuer, fee, renewal cadence, proficiency level, source URL, last-verified date) |
| Search/filter already works | Buyer UX is weaker — can't show "requires Tier 3 + one of: [CASP+, CGRC, CISSO…]" |
| | No way to express the **Org-vs-Individual** distinction cleanly |
| | No versioning of cert definitions (DoD updates the 8140.3 list — how do we track that?) |

**Verdict:** Fastest to ship, weakest representation. Fine for v1 if we accept a flat taxonomy.

### Option B — New GQL / Neon Entities

Dedicated entities:

```
Role {
  id, code (e.g. "CMMC.CCA"), name, description,
  ecosystem (CMMC|SCF|SCA), scope (org|individual),
  governing_body, fee_initial, fee_renewal,
  source_url, source_snapshot_date
}

Certification {
  id, code (e.g. "8140-612.CISSP"), name, issuer,
  proficiency (intermediate|advanced|null),
  standard_ref (URL to DoD/NIST/ISO),
  source_url, source_snapshot_date
}

RoleRequirement {
  role_id, cert_id, requirement_type (prerequisite|confers|staffing_min),
  notes
}

SellerCredential {
  seller_id, role_id|cert_id,
  issued_date, expires_date, verified, verification_source
}
```

| Pros | Cons |
|---|---|
| Captures issuer, level, fees, renewal, source URL, snapshot date | Schema + SDK + migration work |
| Clean many-to-many role<->cert | Needs a data-seed pipeline |
| Supports **proof of holding** (cert expires, needs re-verification) | Seller profile UI needs new components |
| Buyer can filter "Sellers who hold ≥1 CISM-accepted CCA" with structured query | |
| Future: Cyber AB API integration to auto-verify Seller claims | |

**Verdict:** Correct representation, most work. Right choice if we foresee cert-verification features (auto-pull from Cyber AB marketplace, expiry tracking, etc.).

### Option C — Hybrid (Recommended)

**Structured entities for the catalog + auto-derived tags for search.**

- `Role` and `Certification` live as proper entities with full metadata.
- Seller profile stores `SellerCredential[]` (structured — with dates, verification, etc.).
- A **background job** mirrors each `SellerCredential` as a tag on the Seller resource so existing tag-based search/RBAC/filters keep working without rewrites.

| Pros | Cons |
|---|---|
| Rich metadata for UI (Buyer sees "CCA — ISACA CISA (Advanced), valid through 2027-03") | Two places to keep in sync (cheap if it's a DB trigger / service hook) |
| Existing search keeps working via the tag mirror | Slight duplication |
| Can grow features (verification, expiry alerts) without migration churn | |
| Seller profile edits stay simple (multi-select picker backed by `Certification` table) | |

**My lean:** Hybrid. The dataset is ~30-50 entries, structured, has real metadata that tags flatten away, and the cert<->role relationship matters for the Buyer UI. But derive tags for the search layer so we don't rewrite anything that already filters by tag.

---

## 6. Seeding & Refresh

- `scripts/scrape-cyberab.sh` mirrors cyberab.org (polite wget, ~10 min). Re-run any time.
- `scripts/extract-cyberab.py` outputs structured JSON from the mirror. Re-run any time.
- **Manual curation step:** convert the JSON into seed rows for whatever storage we pick. This document IS the curated dataset — treat it as v0 seed.
- **Refresh cadence suggestion:** quarterly, OR triggered when Cyber AB publicly updates the 8140.3 cert list. Diff the newly-scraped pages against the committed catalog; human reviews additions before merging.

---

## 7. Open Questions / Next Steps

1. **Phase boundary** — this doc is _research_. Next phase: audit the SME Mart Seller profile (UI + schema) to see where `SellerCredential[]` fits, before committing to Option A/B/C.
2. **Individual-vs-Org scope.** A Seller in SME Mart — are they always a company, or do we support individual consultants? If both, the UI needs separate pickers for org-level vs individual-level credentials.
3. **Verification.** Cyber AB operates a Marketplace listing of registered orgs. Do we want to auto-verify Seller claims against that list at registration time? That would push us toward Option B/C.
4. **Historical tracking.** Do we need to track when a Seller first obtained a credential, or only current-state? (Affects `SellerCredential` schema.)
5. **Out-of-ecosystem credentials.** Should Sellers be able to claim certs that aren't in the Cyber AB ecosystem (e.g. AWS Certified Security, Google Cloud CISSP)? If yes, the Certification entity needs an `ecosystem` enum with `other` + free-form option.
6. **Referenced external sites** — worth a second-hop scrape?
   - `public.cyber.mil/dcwf-work-role/security-control-assessor/` — authoritative 8140.3 list. **Recommend hopping here** before freezing the cert catalog, since cyberab's copy is explicitly a snapshot as of September 2025.
   - `isaca.org/cmmc` — CAICO has outsourced CCP/CCA/LCCA/CCI training to ISACA. Might have more current cert details.
   - SCF Council site (scf.org) — authoritative SCF certification list.
   - SAICO — no direct URL found on cyberab; needs separate search.

**If you want any of the above hops, say the word and I'll extend the scrape script.**

---

## 8. ISACA / CAICO Updates (Hop 1)

Source: `isaca.org/cmmc` (WebFetched 2026-04-23). ISACA is the CAICO-designated administrator for all four CMMC individual credentials.

- **Formal CMMC implementation began:** 2025-11-10.
- **Pricing change effective:** 2026-04-01. Three-year total cost of ownership dropped from **$3,175 to $2,105** (with ISACA membership). Anyone renewing before 2026-03-31 uses old pricing.
- **CCI (CMMC Credentialed Instructor):** "Coming early 2026." Formal requirements still pending.
- **CCA baseline cert confirmation:** ISACA confirms CISA **or** CISM (from its own catalog) satisfies the 8140.3 / Work Role 612 requirement. Full accepted list links back to cyberab.org.
- **Exam format:** both in-person and remote proctoring available.

> **Catalog implication:** We need a `renewal_pricing_snapshot` field per cert if we want to show Sellers what their renewal will cost (or we point them at ISACA's live page). Prices drift.

---

## 9. Adjacent Compliance Ecosystems

These are additional certification ecosystems where a Seller might hold credentials that a Buyer values. Each is a distinct **authority chain** with its own roles. Use the same Role/Certification/RoleRequirement shape as §5's Option B/C.

### 9.1 FedRAMP (Federal Risk and Authorization Management Program)

Source: `fedramp.gov` (partial — full program docs under `/docs/` were not reachable via unauthenticated WebFetch).

| ID | Role | Scope | Description |
|---|---|---|---|
| `FedRAMP.3PAO` | FedRAMP Third-Party Assessment Organization | **Org** | Accredited to perform assessments on Cloud Service Offerings (CSOs). Accreditation by **A2LA** (American Association for Laboratory Accreditation) per ISO/IEC 17020. |
| `FedRAMP.Agency` | Agency Authorizing Official | **Individual** | Federal agency-side ATO approver — not a Seller credential but important context. |
| `FedRAMP.CSO` | Cloud Service Offering (authorized product) | **Product** | "Authorized" vs "In Process" status on FedRAMP Marketplace. Seller would link their product. |

**Notes:**
- FedRAMP has no named individual assessor credential — 3PAO orgs employ staff who typically hold CISSP/CISA/CCSP plus the 3PAO org's internal quals.
- "FedRAMP 20x" (2024-2025 modernization) and "Rev 5" are the active program phases.
- StateRAMP is the state-government analogue with similar 3PAO structure.

### 9.2 HITRUST (Health Information Trust Alliance)

Source: `hitrustalliance.net/assessors/` (partial — full requirements pages behind login).

| ID | Role | Scope | Description |
|---|---|---|---|
| `HITRUST.AEAO` | Authorized External Assessor Organization | **Org** | Must hold active HITRUST license. Performs external consulting, readiness, or assessment using HITRUST Framework / MyCSF. |
| `HITRUST.CCSFP` | Certified CSF Practitioner | **Individual** | Offered via HITRUST Academy. Required for individuals performing HITRUST assessments. |
| `HITRUST.CHQP` | Certified HITRUST Quality Professional | **Individual** | Senior credential for internal QA of HITRUST assessments. |

HITRUST offers three assessment types: **e1** (foundational), **i1** (implemented-1-year), **r2** (risk-based 2-year). Assessor orgs typically list which types they perform.

### 9.3 PCI SSC (Payment Card Industry Security Standards Council)

Source: `pcisecuritystandards.org/assessors_and_solutions/`

**Organization-level programs:**

| ID | Role | Description |
|---|---|---|
| `PCI.QSA` | Qualified Security Assessor | Conducts PCI DSS assessments. |
| `PCI.ASV` | Approved Scanning Vendor | Authorized to perform external vulnerability scans. |
| `PCI.ISA` | Internal Security Assessor (sponsor company) | Org sponsoring in-house PCI staff. |
| `PCI.PA-QSA` | Payment Application QSA | Assesses payment apps (PA-DSS successor scope). |
| `PCI.P2PE-Assessor` | Point-to-Point Encryption Assessor | Assesses P2PE solutions. |
| `PCI.QPA` | Qualified PIN Assessor | PIN transaction security assessments. |
| `PCI.CPSA` | Card Production Security Assessor | Physical/logical card production assessments. |
| `PCI.3DS-Assessor` | 3-D Secure Assessor | Assesses 3DS components. |
| `PCI.Secure-Software-Assessor` | Secure Software Assessor | Assesses software against Secure Software Standard. |
| `PCI.Secure-SLC-Assessor` | Secure SLC Assessor | Assesses the Software Lifecycle. |
| `PCI.QIR` | Qualified Integrator and Reseller | Installs/configures POS systems per PCI DSS. |

**Individual credentials:**

| ID | Role | Description |
|---|---|---|
| `PCI.PFI` | PCI Forensic Investigator | Must work for a QSA company. Investigates card-data breaches. |
| `PCI.PCIP` | PCI Professional | Individual PCI DSS competency credential. |
| `PCI.ISA-Individual` | Internal Security Assessor (individual) | Employee of ISA sponsor company. |

**Note:** PA-DSS is retired (replaced by Secure Software Standard). Do not list as active.

### 9.4 AICPA SOC Reports

There is **no SOC-specific auditor credential**. SOC 2 examinations must be performed by a **licensed CPA firm** (state-licensed, AICPA member, peer-reviewed). Individual auditors typically hold **CPA + CISA** (ISACA).

| ID | Role | Scope |
|---|---|---|
| `AICPA.CPA-Firm` | Licensed CPA Firm (state) | **Org** — authority to sign SOC 2 opinion. |
| `AICPA.CPA-Individual` | Certified Public Accountant | **Individual** — state license. |
| `ISACA.CISA` | Certified Information Systems Auditor | **Individual** — de-facto SOC 2 technical competency cert (see §10). |

> **Implication:** For SOC 2-oriented Buyers, filtering on CPA-firm status + CISA-holding staff is the practical query. Neither is a Cyber AB credential.

### 9.5 CSA STAR (Cloud Security Alliance)

Source: `cloudsecurityalliance.org/star/`

**Organization-level (STAR Registry):**

| ID | Role | Scope |
|---|---|---|
| `CSA.STAR-L1-Self` | STAR Level 1 Self-Assessment | CAIQ submission; annual updates. |
| `CSA.STAR-L1-ValidAIted` | STAR Level 1 Valid-AI-ted | $595 AI-validated CAIQ (free for CSA Corporate members). |
| `CSA.STAR-L2-Attestation` | STAR Attestation (SOC 2) | 1-year validity. Combines SOC 2 + CCM. |
| `CSA.STAR-L2-Certification` | STAR Certification (ISO/IEC 27001) | 3-year validity. Combines ISO 27001 + CCM. |
| `CSA.C-STAR` | C-STAR (Greater China) | 3-year validity. GB/T 22080 + CCM. |
| `CSA.STAR-AI-L1` | STAR for AI Level 1 | AI-CAIQ self-assessment. |
| `CSA.STAR-AI-L2` | STAR for AI Level 2 | AI-CAIQ + ISO/IEC 42001. |

**Individual credentials:**

| ID | Role |
|---|---|
| `CSA.CCSK` | Certificate of Cloud Security Knowledge (v5) |
| `CSA.CCAK` | Certificate of Cloud Auditing Knowledge (joint with ISACA) |
| `CSA.CCZT` | Certificate of Competence in Zero Trust |

### 9.6 IAPP (International Association of Privacy Professionals)

Source: `iapp.org/certify/programs/`

All hold **ISO/IEC 17024:2012 accreditation via ANSI** (relevant for chain-of-trust filtering).

| ID | Role | Scope |
|---|---|---|
| `IAPP.CIPP/E` | Certified Information Privacy Professional / Europe | GDPR/Europe |
| `IAPP.CIPP/US` | CIPP / United States | US privacy law |
| `IAPP.CIPP/C` | CIPP / Canada | PIPEDA/provincial |
| `IAPP.CIPP/A` | CIPP / Asia | APEC/Asia privacy |
| `IAPP.CIPP/China` | CIPP / China | PIPL |
| `IAPP.CIPM` | Certified Information Privacy Manager | Program management |
| `IAPP.CIPT` | Certified Information Privacy Technologist | Privacy-by-design / engineering |
| `IAPP.AIGP` | AI Governance Professional | AI systems governance (new, 2024) |
| `IAPP.PLS` | Privacy Law Specialist | Advanced legal credential |
| `IAPP.FIP` | Fellow of Information Privacy | Designation requiring CIPP + (CIPM or CIPT) |

### 9.7 ISO/IEC Management System Standards (Lead Auditor Certs)

Sellers conducting ISO audits typically hold a **Lead Auditor credential** issued by an IRCA/ANSI-National-Accreditation-Board-accredited training body (BSI, Bureau Veritas, DNV, TÜV, SGS, etc.). These are courses+exam, not unified certifications.

| ID | Role | Standard |
|---|---|---|
| `ISO.27001-LA` | ISO/IEC 27001 Lead Auditor | Information Security Management |
| `ISO.27001-LI` | ISO/IEC 27001 Lead Implementer | Information Security Management |
| `ISO.27701-LA` | ISO/IEC 27701 Lead Auditor | Privacy Information Management |
| `ISO.22301-LA` | ISO 22301 Lead Auditor | Business Continuity |
| `ISO.9001-LA` | ISO 9001 Lead Auditor | Quality Management |
| `ISO.42001-LA` | ISO/IEC 42001 Lead Auditor | AI Management |

For these, track **issuing-body + cert** as a pair (e.g. `ISO.27001-LA.BSI`, `ISO.27001-LA.PECB`) — Buyers filter on the ISO standard, not the training body, so consider `standard_id` as the primary filter with `issuer` as metadata.

### 9.8 CREST (Cyber assurance, UK/global)

Source: `crest-approved.org/membership/` (partial)

**Organization programs:**
- CREST Pathway / Pathway+ (member tiers)
- CREST Approved across **7 service domains**: Cyber Assurance, Incident Management, Red Teaming, Secure Design, SOC, Security Testing, Threat Intelligence
- Government schemes: CHECK (UK Gov), CBEST (BoE), ASSURE, GBEST, **TIBER-EU**, iCAST, CIE

**Individual credentials** (referenced via external pages; commonly known):
- CPSA — CREST Practitioner Security Analyst
- CRT — CREST Registered Penetration Tester
- CCT (INF/APP/SAS) — CREST Certified Tester (Infrastructure/Application/Simulated Attack)
- CRIA — CREST Registered Intrusion Analyst
- CRIS — CREST Registered Intrusion Specialist

### 9.9 Other Adjacent Frameworks (Not Yet Hopped)

If we want to extend further (ask before each):
- **NERC CIP** — Critical Infrastructure Protection (electric utility). Regional Entity authority — no unified "NERC CIP assessor" cert, but CIP-specific consulting firms exist.
- **IRAP** (Australia) — Infosec Registered Assessors Program (individual + firm).
- **ISMAP** (Japan) — Japanese cloud security assessment program.
- **C5** (Germany BSI) — cloud compliance.
- **Cyber Essentials / Cyber Essentials Plus** (UK, NCSC) — per-org certification with accredited Certification Bodies.
- **StateRAMP** — state-gov FedRAMP analogue.
- **CJIS** — Criminal Justice Information Services (FBI) — specific training/background required.
- **CMS ARS** — Medicare/Medicaid systems (HHS variant).
- **NIST NICE Framework** — all 52+ work roles (super-set of DoD DCWF 612).

---

## 10. Cross-Framework Individual Credentials

These are **issuer-neutral** cybersecurity credentials that a Seller might hold regardless of which framework(s) they assess/implement. Many appear on the DoD 8140.3 list (§3.1) — that table is a **subset** of these.

### 10.1 (ISC)²

Source: `isc2.org/certifications`

| ID | Cert | Experience Req | Focus |
|---|---|---|---|
| `ISC2.CC` | Certified in Cybersecurity | None (entry) | Foundational |
| `ISC2.SSCP` | Systems Security Certified Practitioner | 1 yr | Security admin |
| `ISC2.CISSP` | Certified Information Systems Security Professional | 5+ yrs | General cyber |
| `ISC2.CCSP` | Certified Cloud Security Professional | 5+ yrs | Cloud |
| `ISC2.CGRC` | Governance, Risk & Compliance (formerly CAP) | 2 yrs | GRC |
| `ISC2.CSSLP` | Certified Secure Software Lifecycle Professional | 4 yrs | Secure SDLC |
| `ISC2.CISSP-ISSAP` | Information Systems Security Architecture Pro | CISSP + 2 yrs | Architecture |
| `ISC2.CISSP-ISSEP` | Information Systems Security Engineering Pro | CISSP + 2 yrs | Engineering |
| `ISC2.CISSP-ISSMP` | Information Systems Security Management Pro | CISSP + 2 yrs | Management |
| `ISC2.HCISPP` | Healthcare Information Security & Privacy Pro | _(legacy — confirm still active)_ | Healthcare |

### 10.2 ISACA

Source: `isaca.org/credentialing`

| ID | Cert | Focus |
|---|---|---|
| `ISACA.CISA` | Certified Information Systems Auditor | IT audit |
| `ISACA.CISM` | Certified Information Security Manager | Security management |
| `ISACA.CRISC` | Certified in Risk and Information Systems Control | Risk |
| `ISACA.CGEIT` | Certified in the Governance of Enterprise IT | IT governance |
| `ISACA.CDPSE` | Certified Data Privacy Solutions Engineer | Privacy engineering |
| `ISACA.CCOA` | Certified Cybersecurity Operations Analyst | SOC operations |
| `ISACA.AAIA` | Advanced in AI Audit | AI audit |
| `ISACA.AAIR` | Advanced in AI Risk | AI risk |
| `ISACA.AAISM` | Advanced in AI Security Management | AI security |
| `ISACA.CCAK` | Certificate of Cloud Auditing Knowledge (joint with CSA) | Cloud audit |

Retired (omit from active picklist): CSX-P, CET, ITCA.

### 10.3 CompTIA

Source: `comptia.org/certifications`

| ID | Cert | Level |
|---|---|---|
| `CompTIA.A+` | A+ | Foundational IT |
| `CompTIA.Network+` | Network+ | Foundational network |
| `CompTIA.Security+` | Security+ | Entry cyber |
| `CompTIA.CySA+` | Cybersecurity Analyst+ | Intermediate blue team |
| `CompTIA.PenTest+` | PenTest+ | Intermediate red team |
| `CompTIA.SecurityX` | SecurityX (formerly CASP+) | Advanced |
| `CompTIA.Cloud+` | Cloud+ | Cloud ops/security |
| `CompTIA.Server+` | Server+ | Server admin |
| `CompTIA.Linux+` | Linux+ | Linux admin |

CEU-based renewal across the stack; crossover credits between certs.

### 10.4 GIAC (SANS)

Source: `giac.org/certifications` (62 total; 12 visible in WebFetch response)

**Observation:** GIAC catalog is too large for a static picklist. Suggested approach: enumerate the GIAC catalog from a definitive PDF in a future refresh, OR allow free-form entry with GIAC prefix validation (all IDs start with `G`).

Confirmed present from WebFetch:

| ID | Cert | Focus |
|---|---|---|
| `GIAC.GSEC` | Security Essentials | General cyber |
| `GIAC.GCIH` | Certified Incident Handler | DFIR |
| `GIAC.GPEN` | Certified Penetration Tester | Offensive |
| `GIAC.GWAPT` | Web App Pen Tester | Offensive |
| `GIAC.GCFA` | Certified Forensic Analyst | Forensics |
| `GIAC.GSLC` | Security Leadership | Mgmt |
| `GIAC.GSNA` | Systems & Network Auditor | Audit |
| `GIAC.GCSA` | Cloud Security Automation | Cloud |
| `GIAC.GSOA` | Strategic OSINT Analyst | OSINT |
| `GIAC.GMLE` | Machine Learning Engineer | AI |
| `GIAC.GRTP` | Red Team Professional | Offensive |
| `GIAC.GLIR` | Linux Incident Responder | DFIR |

All GIAC certs renew every 4 years with CPEs.

### 10.5 EC-Council

Common credentials (not WebFetched — widely known):

| ID | Cert |
|---|---|
| `ECC.CEH` | Certified Ethical Hacker |
| `ECC.CCISO` | Certified CISO (on DoD 8140 list) |
| `ECC.CHFI` | Computer Hacking Forensic Investigator |
| `ECC.CND` | Certified Network Defender |
| `ECC.CASE` | Certified Application Security Engineer |
| `ECC.LPT` | Licensed Penetration Tester |

### 10.6 Offensive Security (OffSec)

Common certs (URL redirected — full catalog pending manual hop):

| ID | Cert |
|---|---|
| `OffSec.OSCP` | Offensive Security Certified Professional |
| `OffSec.OSEP` | Experienced Penetration Tester |
| `OffSec.OSWE` | Web Expert |
| `OffSec.OSED` | Exploit Developer |
| `OffSec.OSEE` | Exploitation Expert |
| `OffSec.OSWA` | Web Assessor |
| `OffSec.OSMR` | macOS Researcher |
| `OffSec.OSDA` | Defense Analyst |
| `OffSec.OSCE3` | Certified Expert — triple cert (OSEP+OSWE+OSED) |

### 10.7 Mile2

Already on DoD 8140 list: `Mile2.CISSO`, `Mile2.CPTE`. Full catalog also includes CDFE, CIS, CPTC, CDRE, CIHE, CVE, CSLO.

### 10.8 FITSI (Federal IT Security Institute)

Already on DoD 8140 list: `FITSI.FITSP-A` (Auditor). Also: `FITSI.FITSP-M` (Manager), `FITSP-D` (Designer), `FITSP-O` (Operator).

---

## 11. Revised Data Model Implications

With this expanded catalog (~130 distinct credentials across ~20 issuers), a few things change from the original §5 analysis:

1. **Flat tag namespace is no longer viable.** With 130+ certs, Buyers need hierarchical filters: `(Ecosystem) -> (Framework) -> (Certification)`. Option A (pure tags) is too flat. **Option C (hybrid) stays recommended**, but the `Certification` entity now needs:
   - `issuer_id` (foreign key) — separate `Issuer` table (CAICO, ISACA, (ISC)², AICPA, etc.)
   - `ecosystem` tag (CMMC, SCF, SCA, FedRAMP, HITRUST, PCI, CSA, ISO, privacy, general)
   - `scope` enum (org | individual | product)
   - `dod_8140_role` nullable array (for certs that satisfy DoD work roles — future-proof for NICE Framework)
2. **"Issuer" becomes a first-class entity.** Buyers may filter on issuer reputation (e.g. "ANSI-accredited certs only" filters to IAPP + ISC² + others).
3. **Cross-cert mappings matter.** E.g. an `ISC2.CISSP` holder satisfies `DoD-8140.612-Advanced`, `(ISC)²-base-for-CISSP-concentrations`, and is commonly listed in many frameworks as "acceptable." A `Certification.satisfies` many-to-many self-reference captures this.
4. **GIAC catalog is too large** for a static picklist. Either (a) enumerate all 62 from GIAC's definitive catalog in a future refresh, or (b) free-form + prefix validation (`G` + 3-4 chars).
5. **Legal/CPA credentials** (AICPA CPA, state bar for PLS) aren't tech certs but are **required gating** for SOC 2 / privacy legal work. The data model needs to accommodate non-cybersecurity credentials as first-class Certifications, not special cases.

---

## 12. Refresh Strategy (Updated)

Not every source updates at the same cadence:

| Source | Update cadence | Auto-scrape? |
|---|---|---|
| cyberab.org (CMMC/SCF/SCA) | Quarterly (SCF rollout) | Yes — `scrape-cyberab.sh` |
| isaca.org/cmmc | Annually (pricing) | Maybe — simple WebFetch script |
| DoD DCWF 612 | As DoD 8140 updates | **No** — CAC-gated. Requires manual review via authorized contact |
| PCI SSC assessor programs | Stable (years) | Low-priority refresh |
| HITRUST, FedRAMP, CSA | Annually | Medium-priority |
| Individual cert catalogs (ISACA, ISC², CompTIA, GIAC) | Annual additions | Low priority — additions only |

Recommend a single `scripts/refresh-compliance-catalog.sh` that chains the various scrapes and produces a diff report against the committed JSON seed.

---

## 13. Not Hopped (Ask Before)

Per agreed rule of ~1 hop with approval for deeper: I did not follow to any of the below. Say the word on any that matter.

- `a2la.org` (FedRAMP 3PAO accreditor) — confirm 3PAO accredited orgs list.
- `sans.org` / full GIAC catalog PDF — the remaining 50 of 62 GIAC certs.
- `eccouncil.org` — full EC-Council catalog.
- `offsec.com/courses` (after redirect) — full OffSec catalog.
- `aicpa.org` or state CPA boards — SOC 2 assessor eligibility details.
- `bsigroup.com`, `pecb.com` — ISO Lead Auditor training body details.
- Per-state CJIS boards.
- `nerc.com` / regional entities — CIP auditor credentials.
- Japanese ISMAP portal, German BSI C5 portal, Australian IRAP portal.

**Biggest open gap:** the DoD 8140.3 authoritative list. Options: (a) use the cyberab.org Sept-2025 snapshot with an explicit "snapshot date" field in the UI, (b) manually pull from DCWF with a Clark-side CAC session quarterly, or (c) integrate the `nice.nist.gov` NICE Framework catalog (superset, publicly accessible).
