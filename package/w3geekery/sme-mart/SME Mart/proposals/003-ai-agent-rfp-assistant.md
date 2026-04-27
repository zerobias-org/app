# Proposal 003: AI Agent-Assisted RFP Creation & Bid Evaluation

**Date:** 2026-03-13
**Author:** Clark (W3Geekery) + Claude
**For:** Brian (CEO) — product direction
**Status:** Idea / Early Exploration

---

## Summary

Use the **Claude Agent SDK** to provide SME Mart users (particularly non-technical executives on the buyer/demand side) with an AI-powered assistant for creating RFPs and evaluating vendor bids — without requiring them to understand or configure any AI tooling.

The agent would be embedded in SME Mart as a guided conversational interface, handling the complexity of structured RFP creation and bid comparison while the user focuses on business requirements.

---

## Problem

The RFP-to-Engagement flow (BIG-PICTURE.md, steps 1-3) requires buyers to:

1. Define project scope, deliverables, timeline, success criteria, compliance requirements, and budget
2. Review vendor bids with proposed task breakdowns, timelines, and pricing
3. Accept, reject, or negotiate — potentially across multiple vendors

For compliance/cybersecurity executives who are the target buyers, this is domain-familiar work but structurally tedious. They know *what* they need but may struggle with *how* to express it in a structured marketplace format. This is exactly the kind of task where an AI agent adds value — translating business intent into structured marketplace artifacts.

---

## Proposed Solution

### Architecture

```
┌─────────────────────────────────────────────────┐
│  SME Mart Frontend (Angular)                    │
│  ┌───────────────────────────────────────────┐  │
│  │  Chat/Guided UI Component                 │  │
│  │  (conversational RFP builder)             │  │
│  └──────────────┬────────────────────────────┘  │
└─────────────────┼───────────────────────────────┘
                  │ WebSocket / SSE
                  ▼
┌─────────────────────────────────────────────────┐
│  Agent Service (Node.js)                        │
│  ┌───────────────────────────────────────────┐  │
│  │  Claude Agent SDK                         │  │
│  │  - systemPrompt: RFP domain expert        │  │
│  │  - tools: SME Mart MCP                    │  │
│  │  - maxBudgetUsd: per-session cap          │  │
│  │  - permissionMode: controlled             │  │
│  └──────────────┬────────────────────────────┘  │
│                 │                                │
│  ┌──────────────▼────────────────────────────┐  │
│  │  SME Mart MCP Server                      │  │
│  │  - Query supplier/provider catalog        │  │
│  │  - Read past RFPs & bid history           │  │
│  │  - Read category taxonomy                 │  │
│  │  - Create draft RFP                       │  │
│  │  - Score bids against criteria            │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### Two Agent Personas

#### 1. RFP Creation Agent

**User:** Buyer/demand-side executive
**Trigger:** "Create new RFP" button or `/rfp` command in SME Mart

The agent conducts a guided conversation:

- "What service are you looking to procure?" → maps to SME Mart categories
- "What are the key deliverables?" → structures into scope items
- "Any compliance requirements?" → pulls from known frameworks (SOC 2, ISO 27001, etc.)
- "What's your timeline and budget range?" → validates against marketplace norms
- Pulls similar past RFPs as templates when available
- Generates a properly structured RFP document (DOCX/PDF via code execution)
- Submits draft to SME Mart for buyer review before publishing

#### 2. Bid Evaluation Agent

**User:** Buyer reviewing vendor responses
**Trigger:** "Evaluate bids" action on an RFP with submitted proposals

The agent:

- Ingests all vendor proposals for an RFP
- Scores each against the RFP's stated criteria (compliance, timeline, pricing, qualifications)
- Produces a comparison matrix (table or visual)
- Highlights risks, gaps, and standout qualifications
- Recommends shortlist with reasoning
- Buyer makes final decision — agent advises, never auto-accepts

### Key Design Principles

| Principle | Implementation |
|-----------|---------------|
| Zero AI setup for user | Agent is embedded in the platform, no API keys or config |
| Human-in-the-loop | Agent drafts, human approves — never auto-publishes |
| Budget controls | `maxBudgetUsd` per session prevents runaway costs |
| Permission boundaries | Agent can read catalog and create drafts, cannot publish or accept bids |
| Domain expertise | System prompt loaded with compliance/cybersecurity procurement context |
| Audit trail | All agent interactions logged (aligns with Phase 3 observability goals) |

---

## Relationship to Existing Plan

| Plan Item | Connection |
|-----------|-----------|
| **SM-18: RFP creation flow** | Agent provides the UX layer for this — wizard becomes conversational |
| **SM-19: Vendor proposal flow** | Bid evaluation agent helps buyers process vendor responses |
| **SM-20: Proposal review loop** | Agent assists with the accept/reject/negotiate decision |
| **Tier 6: Agentic commerce** | This is the first concrete implementation of that vision |
| **Open Q: Automated vs. manual task creation from RFP?** | Agent can propose task breakdowns, buyer confirms |

---

## Technology Stack

| Component | Technology |
|-----------|-----------|
| Agent runtime | `@anthropic-ai/claude-agent-sdk` (TypeScript) |
| Model | Claude Opus 4.6 (or Sonnet 4.6 for cost-sensitive flows) |
| MCP server | Custom SME Mart MCP (catalog, RFPs, bids, taxonomy) |
| Document generation | Agent SDK code execution (python-docx, matplotlib for charts) |
| Frontend | Angular component with streaming chat UI |
| Transport | SSE from agent service to Angular frontend |

---

## Open Questions

| Question | Who Decides |
|----------|-------------|
| Should the agent be available to all buyers or gated (premium tier)? | Brian |
| Per-session or per-org budget caps for AI usage? | Brian |
| Should the agent have access to provider profiles / credentials? | Brian (privacy implications) |
| Should agent interactions count toward the observability/audit trail? | Brian/Kevin |
| Host the agent service on ZB infrastructure or separate? | Kevin |

---

## Phase Recommendation

This is a **Phase 2+ feature** — it enhances the RFP flow (Phase 1) but isn't a prerequisite. Recommended sequencing:

1. **Phase 1:** Build the standard RFP creation wizard (SM-18) and bid review flow (SM-19, SM-20)
2. **Phase 1.5:** Build the SME Mart MCP server (reads catalog, taxonomy, RFP data)
3. **Phase 2:** Layer the AI agent on top as an alternative creation path
4. **Future:** Extend to vendor-side agents (auto-draft proposals from provider capability profiles)

The MCP server (Phase 1.5) is valuable independently — it enables both the AI agent and any future automation/integration work.

---

## Cost Estimate (Per Interaction)

| Action | Estimated Tokens | Estimated Cost |
|--------|-----------------|----------------|
| RFP creation session (5-10 turns) | ~15K input + ~5K output | ~$0.20 |
| Bid evaluation (3 proposals) | ~30K input + ~10K output | ~$0.40 |
| Document generation (code execution) | ~$0.05/session | ~$0.05 |

Per-RFP total: **~$0.65** — negligible relative to engagement value.

---

## Next Steps

1. Present to Brian for directional feedback
2. If greenlit, prototype the SME Mart MCP server (useful regardless)
3. Build a minimal RFP creation agent as proof-of-concept
4. Demo to Brian with a real compliance procurement scenario
