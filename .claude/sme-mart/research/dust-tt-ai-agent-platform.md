# Dust.tt — AI Agent Platform Research

**Researched:** 2026-03-27
**URL:** https://dust.tt
**Category:** Enterprise AI agent platform (no-code)

---

## What It Is

Enterprise platform for deploying, orchestrating, and governing AI agents connected to company knowledge and tools. No-code builder for non-technical users. Multi-model support (GPT-5, Claude, Gemini, Mistral).

## Pricing

| Plan | Cost | Min Users | Storage | Key Features |
|------|------|-----------|---------|-------------|
| **Pro** | €29/user/month (~$32) | 1 | 1GB/user | Multi-model, custom agents, integrations, SOC 2, unlimited messages |
| **Enterprise** | Custom | 100+ | Expanded | SSO (Okta/Entra/JumpCloud), SCIM, US/EU hosting, Salesforce, priority support |

14-day free trial on Pro.

## Key Features

- **Multi-model flexibility** — choose GPT-5, Claude, Gemini, Mistral per agent
- **200+ write actions via MCP** — Salesforce, GitHub, Zendesk (not just read-only like ChatGPT Enterprise)
- **Multi-agent orchestration** — sequential, parallel, conditional logic
- **No-code agent builder** — natural language instructions, no dev required
- **Integrations** — Slack, Google Drive, Notion, Confluence, GitHub, Zendesk, HubSpot, Chrome Extension
- **Security** — SOC 2 Type II, GDPR, HIPAA compliant, zero data retention on LLM providers
- **Browser Extension** — Chrome extension with MCP tool access, click/keystroke interaction

## Engineering Use Cases

- Code debugging (surfaces context, docs, recent issues in IDE)
- Incident handling (searches runbooks, auto-generates reports — "2hrs saved per incident")
- Code review automation
- Code-to-doc generation
- Claimed: 20% faster project completion at Alan

## Developer Capabilities

- REST API for programmatic agent interaction (conversation API)
- MCP server support (Notion, Gmail, GitHub, Google Drive, HubSpot, etc.)
- File generation across connected platforms
- Webhook triggers
- Chrome extension APIs

## Competitors

| Platform | Differentiator |
|----------|---------------|
| **ChatGPT Enterprise** | Dust has deeper integrations, multi-model, write actions |
| **Relevance AI** | Low-code alternative, more marketing-focused |
| **Dify** | Open-source, self-hosted option, visual workflow editor |
| **AirOps** | More content/SEO focused |
| **Metaflow AI** | Claims faster ROI, competing on price |

## Relevance to SME Mart / W3Geekery

### Potential Use Cases

1. **RFP Response Automation** — Agent drafts responses from knowledge bases (engagement history, compliance templates, past bids). Overlaps with Plan 076 (Ollama) but managed platform.
2. **Compliance Knowledge Agent** — Knows HIPAA, SOC 2, NIST; answers questions during vetting (Plan 063). Could suggest conditional requirements.
3. **Internal Ops** — Meeting prep, standup summaries, invoice tracking in Slack.
4. **Customer-Facing Concierge** — Marketplace assistant helping buyers find providers, draft RFP requirements, compare bids. Product differentiator.

### Concerns

- **Cost** — €29/user/month adds up; ROI questionable for 1-person engineering team
- **Overlap** — Claude Code + MCP already provides deep agentic workflows
- **Vendor lock-in** — agents live in Dust's platform, not in codebase
- **Not open-source** — can't self-host or deeply customize

### Verdict

**Not recommended for immediate adoption.** Best suited for non-technical teams needing no-code agents. W3Geekery already has Claude Code deeply integrated — Dust adds cost without clear incremental value.

**Where it could make sense later:**
- Customer-facing AI assistant as a product feature (embeddable agents)
- Team growth beyond Clark where non-technical people need agent access

**Better current alternatives:**
- Plan 076 (Ollama) — self-hosted, free, integrates into Angular app
- Claude API directly — already have SDK, build targeted features without middleman

## Sources

- [Dust Homepage](https://dust.tt/home)
- [Dust Pricing](https://dust.tt/home/pricing)
- [Dust for Engineering](https://dust.tt/solutions/engineering)
- [Dust Documentation](https://docs.dust.tt)
- [Dust AI Review — CyberNews](https://cybernews.com/ai-tools/dust-ai-review/)
- [Dust Reviews 2026 — SlashDot](https://slashdot.org/software/p/Dust.tt/)
