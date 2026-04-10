# Skills Over MCP — Deep Dive

**URL:** https://thenewstack.io/skills-vs-mcp-agent-architecture/
**Channel:** #ai-agent-skills
**Scanner item ID:** 80
**Analyzed:** 2026-04-09
**Relevance score:** 0.85
**Category:** pattern
**Action type:** active
**Linked plan(s):** Plan 033 P5, Plan 074
**Integration cost:** free
**Defer until:** N/A

## What It Is

An architectural pattern article arguing that production AI agents should split into two layers: **knowledge lives in Markdown skill files**, **execution lives in MCP servers**. The author shows a 100x context reduction (50K tokens → 200 tokens for the GitHub example) when a SKILL.md file replaces a bloated MCP server that was really just encoding workflow knowledge.

## SME Mart Intersection

**Plan 033 P5: LLM-Assisted Bid Generation** (BACKLOG.md line 31) — ACTIVE, unblocked, ~8 hrs remaining. Current scope is "Claude Agent SDK packaging, bundled ZB MCP tools, cost model (~$0.56/interaction). Phases 1–4 of Plan 033 complete."

This article **directly informs how Plan 033 P5 should be scoped**. The current phrasing ("bundled ZB MCP tools") suggests we're leaning MCP-heavy. The article's thesis argues that the *knowledge* portions of bid generation (bidding strategy, RFP scoring rubrics, vendor vetting criteria, compliance framework mappings, tone calibration) should live in skills — not MCP servers.

**Secondary intersection — Plan 074: Dual-Party GSD / SDD Toolkit** (BACKLOG.md line 68, Deferred — Platform Project App). When this unblocks, it will also depend on Claude Agent SDK. The same architectural decision applies: what's knowledge (workflow templates, decision trees) vs what's execution (GQL calls, file writes)?

**Tertiary — Plan 065: Message Center** already shows precedent for the research-drop pattern (see the "Investigate PromptQL" note on BACKLOG.md line 29). This deep-dive follows the same inspiration-gathering model.

## Pattern vs Tool

**100% pattern.** Nothing to install, nothing to integrate. The insight is where to draw the knowledge/execution line when designing agent systems. Adoption cost is zero; the only "cost" is re-thinking the Plan 033 P5 approach to ensure knowledge isn't accidentally encoded into MCP tool schemas.

## Cost & Friction

- **Hardware:** none
- **Subscription:** free (pattern, not a tool)
- **Dev time to integrate:** 0-2 hrs (just re-read the current Plan 033 P5 scoping with this lens, adjust before coding)
- **Ops burden:** none
- **Dependency risk:** none

## Concrete SME Mart Application

### Plan 033 P5 recomposition (before vs after)

**Before (current BACKLOG.md phrasing):**
> "Claude Agent SDK packaging, bundled ZB MCP tools"

Implies: build ZB-specific MCP servers that the Claude Agent SDK calls to generate bids. All the workflow logic lives in the MCP server.

**After (skills-over-MCP lens):**

```
sme-mart/
├── .claude/skills/                                    # ← knowledge layer
│   ├── bid-generation/
│   │   ├── SKILL.md                                   # overall dispatcher
│   │   ├── rfp-requirements-extraction.md             # how to parse an RFP
│   │   ├── compliance-framework-mapping.md            # SOC 2 / ISO / HIPAA patterns
│   │   ├── sme-capability-matching.md                 # SME → requirement scoring
│   │   ├── pricing-strategy.md                        # bid pricing logic
│   │   └── bid-composition.md                         # tone, structure, narrative
│   └── rfp-scoring/
│       └── SKILL.md
└── src/mcp-servers/                                   # ← execution layer (thin)
    ├── zb-gql-mcp/                                    # just the DB calls
    └── sme-mart-mcp/                                  # just the actions (create bid, etc)
```

Under this architecture:
- A senior bid writer can update `compliance-framework-mapping.md` via a PR — no redeployment, no code review on complex MCP server code
- Testing is simpler — each skill file can be validated independently by reading it and asking "does this teach Claude the right way to think about this?"
- Agent context is small and focused — 200-500 tokens per active skill instead of 20K+ of MCP tool schemas
- New SMEs/workflows can be added without touching any server code

### Example savings

The article's headline example: GitHub MCP server loads 50,000 tokens of tool schemas. A SKILL.md saying "use the `gh` CLI, prefer squash merges, run tests before push" achieves the same at ~200 tokens — 100x less context burn.

For SME Mart, the equivalent is the **ZB GQL schema**. If Plan 033 P5's MCP server tries to expose every GQL mutation as a typed tool, the agent will burn thousands of tokens per invocation on schema understanding. A skill file saying "use the zerobias-ts-client, here are the relevant entity types, here's how to construct a bid object" could be 500 tokens and faster.

### Standalone mode test

The article's design rule: every skill should produce useful output even without MCP connected. For SME Mart bid generation, this would mean:
- `bid-composition.md` alone → should produce a reviewable draft from pasted RFP text
- + MCP → draft becomes a committed Bid entity in the DB

If the skill can't produce a draft without MCP, the knowledge layer isn't cleanly separated.

## Recommendation

**Active** — Plan 033 P5 is actively being built. This article should inform the scoping conversation before any Phase 5 code lands.

### Which plan this should inform and how

**Plan 033 P5** — insert this pattern as a design constraint:
- Add a "Knowledge vs Execution" decision log to the phase context
- For every proposed MCP tool, ask: "is this encoding knowledge or performing an action?"
- Knowledge → skill file. Action → MCP tool. If both, the skill references the tool.
- Goal: keep the Phase 5 MCP server under 2000 tokens of tool schema. Push everything else into skills.

**Plan 074** — when it eventually unblocks, same lens applies. The "dual-party GSD toolkit" will have lots of workflow knowledge that belongs in skills, not MCP servers.

## Discussion Questions

Questions for `/gsd:discuss-phase` when Plan 033 P5 enters active planning:

1. **Agent knowledge location** — Where should bid-generation expertise (scoring rubrics, compliance frameworks, pricing logic, tone calibration) live?
   - **Option A:** Encoded into ZB MCP server tool schemas. Fewer moving parts, but tool schemas bloat fast and non-engineers can't update them.
   - **Option B:** Skill files in `.claude/skills/bid-generation/`. Version-controlled, PR-reviewable, editable by senior bid writers without touching server code. Agent context is smaller.
   - **Default if not decided:** Option B (aligns with industry pattern shift in 2026, smaller context, more maintainable by non-engineers).
   - **Relevant plans:** 033 P5, 074.

2. **Standalone mode for bid skills** — Should each bid-generation skill produce useful output when the ZB MCP server is disconnected?
   - **Option A:** Yes — skills must work in "draft mode" without live DB. Validates clean knowledge/execution separation. Enables local review and testing.
   - **Option B:** No — skills always assume MCP availability, tighter coupling, faster to build initially.
   - **Default if not decided:** Option A (article's design rule; enables offline review workflows).
   - **Relevant plans:** 033 P5.

3. **Who owns the skill content?** — Who is the expected editor of bid-generation skill files?
   - **Option A:** Engineers only (treated as code). Predictable, but changes require dev cycles.
   - **Option B:** Senior bid writers / compliance SMEs can PR skill updates directly. Enables rapid iteration on bid patterns as market shifts.
   - **Option C:** Hybrid — engineers own structural skills, SMEs propose content via Issues.
   - **Default if not decided:** Option C (gradual trust ladder).
   - **Relevant plans:** 033 P5, 056 (Engagement Roles).

## Links

- **Original:** https://thenewstack.io/skills-vs-mcp-agent-architecture/
- **Related drops:** `2026-04-09-pattern-anthropic-skills-guide.md` (when written — companion, the official Anthropic skills reference)
- **Related plans:** Plan 033 P5 (LLM-Assisted Bid Generation), Plan 074 (Dual-Party GSD Toolkit)
