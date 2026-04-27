# RFP Import Prompt — Standard (No MCP)

Use this prompt with any LLM (ChatGPT, Claude, Gemini, etc.) to convert an RFP document into structured JSON for SME Mart import.

## How to Use

1. Copy the **entire prompt** below (between the `---` markers)
2. Open your preferred LLM chat
3. Paste the prompt
4. Paste the RFP document text after the prompt (or upload the PDF if the LLM supports it)
5. Copy the JSON output
6. In the SME Mart RFP Wizard → Step 3 (Requirements) → click **Import from JSON**
7. Paste the JSON and click Import

---

## Prompt

```
You are an RFP analysis assistant. Extract structured requirements from the following RFP document and produce a JSON object matching the schema below. Do NOT invent requirements — only extract what is explicitly stated or clearly implied in the document.

OUTPUT FORMAT: Return ONLY valid JSON (no markdown fences, no explanation). The JSON must match this TypeScript interface:

{
  "schemaVersion": "1.0",             // Always "1.0"
  "source": {                          // Optional metadata
    "filename": "string",              // Original filename if known
    "documentType": "string",          // "RFP", "RFQ", "SOW", etc.
    "organization": "string",          // Issuing organization
    "dateExtracted": "YYYY-MM-DD",     // Today's date
    "parserTier": "llm-prompt"         // Always "llm-prompt" for this workflow
  },
  "basics": {                          // Pre-fills wizard Step 1
    "title": "string",                 // Short title (max ~120 chars)
    "description": "string",           // Scope summary paragraph
    "category": "string",              // "Cybersecurity", "Compliance", "IT Audit", etc.
    "budgetType": "fixed|hourly|negotiable",
    "budgetMin": number,               // USD, omit if not stated
    "budgetMax": number,               // USD, omit if not stated
    "timeline": "string"               // e.g., "90 days", "Q3 2026"
  },
  "taskGroups": [                      // REQUIRED — at least one group
    {
      "taskType": "SECURITY|COMPLIANCE|LEGAL|FUNCTIONAL|FINANCIAL|SOW",
      "displayName": "string",         // e.g., "Security Requirements"
      "requirements": [
        {
          "title": "string",           // REQUIRED — concise title (max ~200 chars)
          "description": "string",     // Detailed description, markdown OK
          "standardReference": "string",// e.g., "NIST SP800-53 AC-2", "SOC 2 CC6.1"
          "evidenceType": "document|certification|attestation|demo|na",
          "priority": "critical|high|normal|low"
        }
      ]
    }
  ]
}

RULES:
1. Group requirements by type:
   - SECURITY — vulnerability assessments, pen testing, access control, encryption, incident response
   - COMPLIANCE — regulatory adherence (HIPAA, SOC 2, PCI-DSS, FedRAMP, CMMC, etc.)
   - LEGAL — contract terms, liability, indemnification, insurance, NDA
   - FUNCTIONAL — technical capabilities, integrations, deliverables, reporting
   - FINANCIAL — pricing structure, payment terms, cost breakdowns
   - SOW — statement of work items, milestones, project management deliverables

2. Each requirement should be atomic — one testable item per requirement. Split compound requirements.

3. Priority mapping:
   - critical — explicitly marked as mandatory/required with compliance implications
   - high — marked as required or strongly expected
   - normal — standard requirement (default if not specified)
   - low — nice-to-have, optional, or "preferred"

4. Evidence type mapping:
   - document — requires written documentation, reports, or policies
   - certification — requires an industry certification (ISO 27001, SOC 2 report, etc.)
   - attestation — requires a signed statement or affidavit
   - demo — requires a live demonstration or proof of concept
   - na — informational requirement, no evidence needed

5. Standard references: Include specific section/control numbers when the RFP cites them (e.g., "NIST SP800-53 AC-2", "HIPAA §164.312(a)(1)", "SOC 2 CC6.1"). Leave blank if no standard is referenced.

6. Budget: Only include budgetMin/budgetMax if the RFP states specific dollar amounts. Use budgetType "negotiable" if the RFP asks for pricing proposals without fixed ranges.

7. Title: Create a clear, descriptive title. Don't just repeat the section heading — summarize the actual requirement.

8. Description: Include enough detail that an SME can understand what's being asked without reading the original RFP. Use markdown for lists or formatting when helpful.

Now parse the following RFP document:
```

---

## Example Output

After pasting an RFP document, the LLM should produce something like:

```json
{
  "schemaVersion": "1.0",
  "source": {
    "filename": "CDPH-RFP-2026-001.pdf",
    "documentType": "RFP",
    "organization": "California Department of Public Health",
    "dateExtracted": "2026-03-10",
    "parserTier": "llm-prompt"
  },
  "basics": {
    "title": "CDPH Cybersecurity Assessment Services",
    "description": "Comprehensive security assessment of CDPH healthcare IT systems including vulnerability scanning, penetration testing, and compliance gap analysis against HIPAA and NIST frameworks.",
    "category": "Cybersecurity",
    "budgetType": "fixed",
    "budgetMin": 150000,
    "budgetMax": 300000,
    "timeline": "180 days"
  },
  "taskGroups": [
    {
      "taskType": "SECURITY",
      "displayName": "Security Requirements",
      "requirements": [
        {
          "title": "Vulnerability Assessment of External-Facing Systems",
          "description": "Conduct comprehensive vulnerability scanning of all internet-facing systems including web applications, APIs, and network infrastructure. Must use industry-standard tools (Nessus, Qualys, or equivalent).",
          "standardReference": "NIST SP800-53 RA-5",
          "evidenceType": "document",
          "priority": "critical"
        },
        {
          "title": "Penetration Testing — External and Internal",
          "description": "Perform authorized penetration testing of both external-facing and internal network segments. Deliverables include:\n- Executive summary\n- Detailed technical findings\n- Remediation roadmap with priority ranking",
          "standardReference": "NIST SP800-115",
          "evidenceType": "document",
          "priority": "high"
        }
      ]
    },
    {
      "taskType": "COMPLIANCE",
      "displayName": "Compliance Requirements",
      "requirements": [
        {
          "title": "HIPAA Security Rule Gap Analysis",
          "description": "Assess compliance with HIPAA Security Rule across all three safeguard categories: administrative, physical, and technical. Produce a gap analysis report with remediation recommendations.",
          "standardReference": "HIPAA §164.312",
          "evidenceType": "attestation",
          "priority": "critical"
        }
      ]
    },
    {
      "taskType": "FUNCTIONAL",
      "displayName": "Deliverables & Reporting",
      "requirements": [
        {
          "title": "Monthly Progress Reports",
          "description": "Provide monthly written status reports covering activities completed, findings to date, risks identified, and upcoming milestones.",
          "evidenceType": "document",
          "priority": "normal"
        }
      ]
    }
  ]
}
```

## Troubleshooting

- **LLM wraps output in markdown fences?** Remove the ` ```json ` and ` ``` ` markers before pasting.
- **Import fails with "Invalid schema version"?** Make sure `schemaVersion` is exactly `"1.0"` (string, not number).
- **Import fails with "No task groups found"?** The `taskGroups` array must have at least one entry with at least one requirement.
- **Requirements appear in wrong group?** Edit the `taskType` field. Valid values: `SECURITY`, `COMPLIANCE`, `LEGAL`, `FUNCTIONAL`, `FINANCIAL`, `SOW`.
