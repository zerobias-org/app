# Resume Import Feature

**Status:** Idea / Proposal
**Created:** 2026-02-04
**Author:** Clark

---

## Summary

Help users populate their SME Mart profile by analyzing their resume/CV and matching against ZeroBias catalog data. A hybrid approach using:

1. **LLM Prompt Template** - Users can use any LLM to analyze their resume and output structured JSON
2. **SME Mart Import Feature** - A UI to paste/upload the JSON, preview matches, and import selected items

---

## Problem Statement

Setting up a complete provider profile requires selecting from multiple catalogs:
- **Roles** (95 NICE Work Roles)
- **Skills** (556 NICE Skills)
- **Frameworks** (12+ compliance frameworks)
- **Products** (663+ vendor products)
- **Industry Segments** (128 segments)
- **Service Categories** (9 professional service types)

Manually finding and selecting items from these large catalogs is tedious. Users often have this information already documented in their resume/CV.

---

## Solution: Two-Part Approach

### Part 1: LLM Prompt Template

A reusable prompt that users can copy into any LLM (ChatGPT, Claude, etc.) along with their resume text. The LLM analyzes the resume and outputs structured JSON matching SME Mart's import schema.

**Why external LLM?**
- No need to store/process sensitive resume data on our servers
- User controls which LLM they use
- No API costs for SME Mart
- Works offline (for local LLMs)
- User can review/edit output before importing

### Part 2: SME Mart Import Feature

A UI in the My Profile page where users can:
1. Paste JSON output or upload a JSON file
2. Preview matched items with confidence scores
3. Select which items to import
4. Bulk-add selected items to their profile

---

## Import JSON Schema

```typescript
interface ProfileImport {
  version: "1.0";
  source: {
    type: "resume" | "linkedin" | "manual";
    analyzedAt: string; // ISO date
    llmModel?: string;  // e.g., "gpt-4", "claude-3"
  };

  profile?: {
    headline?: string;
    about?: string;
    hourlyRate?: number;
  };

  roles?: Array<{
    name: string;           // Exact or fuzzy match to NICE role
    niceRoleId?: string;    // If known
    confidence: number;     // 0-1
    evidence?: string;      // Quote from resume
  }>;

  skills?: Array<{
    name: string;           // Exact or fuzzy match to NICE skill
    niceSkillId?: string;   // S#### format if known
    proficiency?: "beginner" | "intermediate" | "expert";
    yearsExperience?: number;
    confidence: number;
    evidence?: string;
  }>;

  frameworks?: Array<{
    name: string;           // Framework name (e.g., "SOC 2", "ISO 27001")
    zerobiasId?: string;
    experienceLevel?: "familiar" | "certified" | "implemented" | "audited";
    confidence: number;
    evidence?: string;
  }>;

  products?: Array<{
    name: string;           // Product name (e.g., "AWS", "Splunk")
    vendor?: string;
    zerobiasId?: string;
    experienceLevel?: "user" | "administrator" | "implementer" | "architect";
    confidence: number;
    evidence?: string;
  }>;

  segments?: Array<{
    name: string;           // Industry segment
    zerobiasId?: string;
    confidence: number;
    evidence?: string;
  }>;

  serviceCategories?: Array<{
    name: string;           // Service category (e.g., "SOC", "Compliance")
    code?: string;          // Tag code if known
    confidence: number;
    evidence?: string;
  }>;
}
```

---

## LLM Prompt Template

Users copy this prompt into their preferred LLM along with their resume text.

````markdown
# Resume to SME Mart Profile Analyzer

You are a profile data extraction assistant for SME Mart, a compliance talent marketplace.

## Your Task

Analyze the provided resume and extract information that matches the ZeroBias platform catalogs. Output valid JSON matching the schema below.

## Important Guidelines

1. **Be conservative** - Only include items you're confident about (>0.7 confidence)
2. **Use exact names** - Match catalog names as closely as possible
3. **Include evidence** - Quote the relevant resume text supporting each match
4. **Don't guess IDs** - Leave `zerobiasId` blank unless explicitly mentioned

## ZeroBias Catalog Reference

### NICE Work Roles (95 roles in 7 categories)
Categories: Securely Provision (SP), Operate and Maintain (OM), Oversee and Govern (OV), Protect and Defend (PD), Analyze (AN), Collect and Operate (CO), Investigate (IN)

Common roles: Security Architect, Security Analyst, Incident Responder, Compliance Manager, Risk Analyst, Penetration Tester, Security Engineer, CISO, Privacy Officer, etc.

### NICE Skills (556 skills, S#### format)
Examples: S0001 (Knowledge of cybersecurity principles), S0027 (Skill in implementing security controls), etc.

### Compliance Frameworks
- NIST 800-53
- ISO 27001
- SOC 2 (Type I, Type II)
- NIST CSF
- FedRAMP
- CMMC
- CIS Controls
- GDPR
- HIPAA
- PCI DSS

### Product Categories
- Cloud Platforms: AWS, Azure, GCP
- SIEM: Splunk, Microsoft Sentinel, QRadar, Elastic
- EDR/XDR: CrowdStrike, SentinelOne, Carbon Black
- Identity: Okta, Azure AD, Ping
- GRC: ServiceNow, Archer, OneTrust
- Vulnerability: Tenable, Qualys, Rapid7
- Code Security: Snyk, Checkmarx, SonarQube

### Industry Segments
SIEM, EDR, CSPM, IAM, SAST, SCA, CI/CD, API Security, Cloud Security, Identity Management, etc.

### Service Categories (Professional Services)
- soc: Security Monitoring / Operations Center
- pentesting: Penetration Testing / Red Team
- compliance: Compliance Assessment / Audit Support
- risk: Risk Assessment / Management
- training: Security Awareness / Compliance Training
- bdr: Backup / Disaster Recovery
- comms: Security Communications / Reporting
- it: IT Security Support
- noc: Network Operations Center

## Output Schema

```json
{
  "version": "1.0",
  "source": {
    "type": "resume",
    "analyzedAt": "<ISO date>",
    "llmModel": "<your model name>"
  },
  "profile": {
    "headline": "<suggested professional headline>",
    "about": "<suggested about/summary text>"
  },
  "roles": [
    {
      "name": "<NICE role name>",
      "confidence": 0.0-1.0,
      "evidence": "<quote from resume>"
    }
  ],
  "skills": [
    {
      "name": "<skill name>",
      "proficiency": "beginner|intermediate|expert",
      "yearsExperience": <number>,
      "confidence": 0.0-1.0,
      "evidence": "<quote from resume>"
    }
  ],
  "frameworks": [
    {
      "name": "<framework name>",
      "experienceLevel": "familiar|certified|implemented|audited",
      "confidence": 0.0-1.0,
      "evidence": "<quote from resume>"
    }
  ],
  "products": [
    {
      "name": "<product name>",
      "vendor": "<vendor name>",
      "experienceLevel": "user|administrator|implementer|architect",
      "confidence": 0.0-1.0,
      "evidence": "<quote from resume>"
    }
  ],
  "segments": [
    {
      "name": "<segment name>",
      "confidence": 0.0-1.0,
      "evidence": "<quote from resume>"
    }
  ],
  "serviceCategories": [
    {
      "name": "<category display name>",
      "code": "<category code>",
      "confidence": 0.0-1.0,
      "evidence": "<quote from resume>"
    }
  ]
}
```

## Resume to Analyze

<paste resume text here>
````

---

## UI Implementation

### Import Flow

1. **Entry Point**: Button on My Profile page - "Import from Resume"
2. **Import Dialog**:
   - Tab 1: Instructions with prompt template (copyable)
   - Tab 2: JSON input (paste or file upload)
3. **Preview Screen**:
   - Grouped by category (roles, skills, frameworks, etc.)
   - Each item shows: name, confidence badge, evidence snippet
   - Checkbox to include/exclude each item
   - Fuzzy match indicator if name doesn't exactly match catalog
4. **Confirmation**:
   - Summary of items to be added
   - Warning for potential duplicates
   - Confirm button

### Components Needed

```
/components/profile/
├── ResumeImportButton.tsx      # Entry point button
├── ResumeImportDialog.tsx      # Main dialog container
├── ImportInstructions.tsx      # Tab 1: Prompt template + instructions
├── ImportJsonInput.tsx         # Tab 2: Paste/upload JSON
├── ImportPreview.tsx           # Preview matched items
├── ImportPreviewItem.tsx       # Individual item with checkbox
└── ImportConfirmation.tsx      # Final confirmation
```

### API Endpoints

```typescript
// POST /api/profile/import/preview
// Validates JSON, matches against catalogs, returns preview
Request: { json: ProfileImport }
Response: {
  valid: boolean;
  errors?: string[];
  preview: {
    roles: Array<{ input: RoleInput; match?: CatalogRole; confidence: number }>;
    skills: Array<{ input: SkillInput; match?: CatalogSkill; confidence: number }>;
    // ... etc
  }
}

// POST /api/profile/import
// Bulk-adds selected items to profile
Request: {
  roles: string[];       // Selected role IDs
  skills: string[];      // Selected skill IDs
  frameworks: string[];  // Selected framework IDs
  products: string[];    // Selected product IDs
  segments: string[];    // Selected segment IDs
  serviceCategories: string[]; // Selected service category IDs
}
Response: { success: boolean; added: { roles: number; skills: number; ... } }
```

---

## Matching Strategy

### Exact Match
Item name matches catalog entry exactly (case-insensitive).

### Fuzzy Match
Use string similarity (Levenshtein distance, Jaccard similarity) to find close matches:
- Threshold: >0.8 similarity
- Show as "suggested match" in UI
- User confirms before adding

### Alias Mapping
Maintain common aliases for popular items:
```typescript
const frameworkAliases = {
  "soc 2": "SOC2",
  "soc2 type 2": "SOC2",
  "iso27001": "ISO-27001",
  "nist 800-53": "NIST-800-53",
  // ...
};
```

---

## Future Enhancements

1. **LinkedIn Import** - Parse LinkedIn profile export (JSON/PDF)
2. **PDF Resume Parser** - Direct PDF upload with server-side text extraction
3. **ZeroBias MCP Integration** - Add resume analysis as ZeroBias MCP tool
4. **Bulk User Onboarding** - Admin feature to import multiple users from CSV
5. **Profile Completeness Score** - Gamify profile completion with suggestions

---

## Implementation Priority

**Phase 1 (MVP):**
- LLM prompt template (documentation only)
- JSON paste import
- Basic exact-match preview
- Bulk add to existing profile panels

**Phase 2:**
- File upload (JSON)
- Fuzzy matching with suggestions
- Alias mappings for common variations
- Duplicate detection

**Phase 3:**
- Direct PDF resume parsing
- LinkedIn profile import
- MCP tool integration

---

## Dependencies

- Existing profile panel infrastructure (roles, skills, frameworks, products, segments, service categories)
- ZeroBias catalog APIs for validation
- TanStack Query for catalog data caching

---

## References

- [Master Plan](../plans/public/000-MASTER-PLAN.md) - Project roadmap
- [ZeroBias Catalog Data](../plans/public/000-MASTER-PLAN.md#zerobias-catalog-data-as-of-2026-02-03) - Available catalogs

---

**Last Updated:** 2026-02-04
