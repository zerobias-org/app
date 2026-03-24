# RFP Import Prompt — ZeroBias MCP

Use this prompt with Claude Code (or any MCP-capable LLM) that has the **ZeroBias MCP server** connected. The MCP server can read files directly and optionally upload the result.

## How to Use

1. Make sure the ZeroBias MCP server is connected (`/mcp` to check)
2. Copy the **prompt** below
3. Provide the RFP file path (PDF, DOCX, or text)
4. Claude reads the file, produces the JSON, and saves it locally
5. Open the JSON file, copy the contents
6. In the SME Mart RFP Wizard → Step 3 (Requirements) → click **Import from JSON** → paste

---

## Prompt

```
Read the RFP document at the path I provide and extract all requirements into the SME Mart RFP Import JSON format. Save the output as a JSON file next to the source document.

SCHEMA (v1.0):

{
  "schemaVersion": "1.0",
  "source": {
    "filename": "<basename of the file>",
    "documentType": "RFP|RFQ|SOW",
    "organization": "<issuing org>",
    "dateExtracted": "<today YYYY-MM-DD>",
    "parserTier": "llm-prompt"
  },
  "basics": {
    "title": "string — short RFP title, max ~120 chars",
    "description": "string — scope summary paragraph",
    "category": "Cybersecurity|Compliance|IT Audit|<other>",
    "budgetType": "fixed|hourly|negotiable",
    "budgetMin": "number (USD, omit if not stated)",
    "budgetMax": "number (USD, omit if not stated)",
    "timeline": "string — e.g. '90 days', 'Q3 2026'"
  },
  "taskGroups": [
    {
      "taskType": "SECURITY|COMPLIANCE|LEGAL|FUNCTIONAL|FINANCIAL|SOW",
      "displayName": "Human-readable group name",
      "requirements": [
        {
          "title": "REQUIRED — concise, max ~200 chars",
          "description": "Detailed description, markdown OK",
          "standardReference": "e.g. NIST SP800-53 AC-2, SOC 2 CC6.1",
          "evidenceType": "document|certification|attestation|demo|na",
          "priority": "critical|high|normal|low"
        }
      ]
    }
  ]
}

TASK TYPE GUIDE:
- SECURITY — vuln assessments, pen testing, access control, encryption, incident response
- COMPLIANCE — regulatory (HIPAA, SOC 2, PCI-DSS, FedRAMP, CMMC, NIST)
- LEGAL — contract terms, liability, indemnification, insurance, NDA
- FUNCTIONAL — technical capabilities, integrations, deliverables, reporting
- FINANCIAL — pricing, payment terms, cost breakdowns
- SOW — milestones, project management, statement of work deliverables

PRIORITY GUIDE:
- critical — mandatory with compliance/legal implications
- high — required or strongly expected
- normal — standard requirement (default)
- low — nice-to-have, optional, preferred

EVIDENCE TYPE GUIDE:
- document — written docs, reports, policies
- certification — industry cert (ISO 27001, SOC 2 report)
- attestation — signed statement or affidavit
- demo — live demonstration or POC
- na — informational, no evidence needed

RULES:
1. Only extract requirements explicitly stated or clearly implied. Never invent.
2. Make each requirement atomic — one testable item. Split compound requirements.
3. Include standard/control references when cited (NIST, HIPAA §, SOC 2 CC, etc.).
4. Only include budget numbers if the document states specific amounts.
5. Write titles that summarize the actual requirement, not just the section heading.
6. Descriptions should be self-contained — an SME should understand without the original doc.

OUTPUT:
- Save as `<source-filename>-import.json` in the same directory
- Print a summary: total task groups, total requirements, any items you were uncertain about
```

---

## Usage Examples

### Read a local PDF
```
Read the RFP at ~/Documents/CDPH-RFP-2026-001.pdf and extract requirements into SME Mart import format.

[paste the prompt above]
```

Claude will:
1. Read the PDF using the Read tool
2. Extract requirements into the JSON schema
3. Save to `~/Documents/CDPH-RFP-2026-001-import.json`
4. Print a summary

### Read from a URL (if the LLM supports WebFetch)
```
Fetch the RFP from https://example.gov/rfp/2026-001.pdf and extract requirements.

[paste the prompt above]
```

### Multiple documents
```
Read all PDFs in ~/Documents/RFPs/ and produce import JSONs for each one.

[paste the prompt above]
```

---

## Post-Import Steps

After importing the JSON into the wizard:

1. **Review all requirements** — the wizard shows them in editable cards grouped by task type
2. **Adjust priorities** — LLM extraction is a best guess; verify critical items
3. **Add standard references** — fill in any the LLM missed
4. **Set evidence types** — defaults to "document" if not specified
5. **Attach source documents** — Step 2 of the wizard for org document uploads
6. **Complete remaining wizard steps** — Terms, Evaluation Criteria, then Publish

## Validation

The import dialog validates:
- `schemaVersion` must be exactly `"1.0"`
- `taskGroups` must be a non-empty array
- Each task group must have `taskType`, `displayName`, and at least one requirement
- Each requirement must have a `title`
- Invalid `taskType` values are rejected (valid: SECURITY, COMPLIANCE, LEGAL, FUNCTIONAL, FINANCIAL, SOW)
