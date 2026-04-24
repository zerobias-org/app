# PromptQL — Deep Dive

**URL:** https://promptql.io/
**Channel:** #ai-prompting
**Scanner item ID:** 239
**Analyzed:** 2026-04-10
**Relevance score:** 0.85
**Category:** tool
**Action type:** spike
**Linked plan(s):** Plan 065, Plan 078
**Integration cost:** medium
**Defer until:** N/A

## What It Is

PromptQL is Hasura's AI-native collaboration platform — "Multiplayer AI with a Wiki." Teams connect data sources (Snowflake, Postgres, BigQuery, Salesforce, GitHub, Slack), build shared institutional knowledge from conversations, and coordinate multiple AI agents in unified threads. Enterprise security (SOC 2, HIPAA, GDPR). Available on Mac, iOS, Android.

## SME Mart Intersection

**Plan 065 (Message Center — Engagement-Scoped)** explicitly calls out PromptQL for pattern inspiration (BACKLOG.md note from 2026-04-01). Three specific patterns matter:

1. **Thread-per-resource model** — PromptQL ties conversations to specific data contexts. Plan 065 needs engagement-scoped messaging where threads attach to RFPs, bids, projects. Same structural pattern.
2. **Shared context with inline data refs** — PromptQL threads reference connected data inline. Plan 065's message center could reference engagement documents, bid statuses, timeline events the same way.
3. **AI agent threads** — PromptQL lets AI agents participate as thread members. Plan 033 P5 (LLM-Assisted Bid Generation) could surface AI-generated content directly in engagement message threads rather than a separate UI.

**Plan 078 (Transparency Controls)** — PromptQL's permission enforcement per-request is directly relevant. In a buyer/vendor marketplace, message visibility must respect party boundaries. PromptQL's model — where each query checks permissions against the requesting user's role and connected data sources — maps to the three-sided visibility model (Demand/Supply/Shared) that Plan 078 is designing controls for.

## Pattern vs Tool

**Pattern extraction, not direct adoption.** PromptQL is a standalone SaaS platform — we're not going to replace SME Mart's messaging with it. But three patterns are worth lifting:

1. **Resource-scoped threading** — conversations bound to a typed entity (engagement, RFP, bid), not free-floating channels
2. **Wiki-from-conversations** — auto-extracted knowledge base that grows from team interactions (could inform how engagement history captures institutional knowledge)
3. **Permission-aware data references** — inline data citations that respect the viewer's role/party

## Cost & Friction

- **Hardware:** none
- **Subscription:** enterprise pricing (likely $20-50/seat/mo based on Hasura's typical tiers)
- **Dev time to integrate:** weeks if API integration, months if deep embedding. Pattern extraction: days.
- **Ops burden:** high if integrated as a service, none if just extracting patterns
- **Dependency risk:** high — Hasura is well-funded but it's a bet on a single vendor for core messaging. Lock-in is real.

## Concrete SME Mart Application

### Example 1: Engagement Message Thread Structure

```typescript
// Thread bound to an engagement entity
interface EngagementThread {
  engagementId: string;
  threadType: 'rfp-discussion' | 'bid-review' | 'general';
  visibility: 'demand' | 'supply' | 'shared';  // Plan 078
  participants: PartyMember[];
  contextRefs: EntityRef[];  // inline refs to docs, bids, timeline events
}
```

### Example 2: Permission-Aware Message Rendering

```typescript
// PromptQL pattern: check permissions per-message, not per-thread
// Buyer sees all messages; vendor sees only 'shared' + 'supply' messages
function filterMessages(messages: Message[], party: 'demand' | 'supply'): Message[] {
  return messages.filter(m =>
    m.visibility === 'shared' || m.visibility === party
  );
}
```

### Example 3: Wiki-from-Engagement Knowledge

After an engagement closes, auto-extract key decisions, vendor performance notes, and lesson-learned threads into a searchable knowledge base. PromptQL calls this "evolving wiki" — SME Mart could call it "Engagement Intelligence."

## Recommendation

**spike** — PromptQL is explicitly referenced in Plan 065's BACKLOG.md notes. The pattern extraction is worth a dedicated 4-6 hour spike to:

1. Sign up for PromptQL free tier, explore the thread/wiki/permission model firsthand
2. Document the 3 patterns above with screenshots and API examples
3. Draft a Plan 065 discussion-questions list informed by what we learn
4. Evaluate whether the Slack API connector concept (BACKLOG.md note 2026-04-02) is a better fit than PromptQL patterns

## Discussion Questions

1. **Message threading model** — Should engagement messages be organized as flat threads (Slack-like, simple) or as resource-bound threads where each RFP/bid/document gets its own conversation context (PromptQL-like, richer but more complex)?
   - **Option A:** Flat thread per engagement — simple, familiar, lower dev cost. Risk: noisy as engagement scales.
   - **Option B:** Resource-bound threads — each entity (RFP, bid, document) gets its own thread. Richer context but more UI complexity.
   - **Default if not decided:** Flat thread (simpler MVP, can add resource binding later)
   - **Relevant plans:** 065, 078

2. **AI agent participation in threads** — Should the LLM assistant (Plan 033 P5) post directly into engagement message threads, or live in a separate "AI Assistant" panel?
   - **Option A:** AI posts in threads — feels collaborative, but could be noisy or confusing for non-technical buyers
   - **Option B:** Separate AI panel — cleaner separation, but loses the "multiplayer" feel
   - **Default if not decided:** Separate panel (safer for buyer-facing UX)
   - **Relevant plans:** 065, 033 P5

3. **Knowledge capture from engagement history** — Should the system auto-extract a "wiki" from engagement conversations (PromptQL's core value prop), or rely on manual note-taking (current Plan 047 approach)?
   - **Option A:** Auto-extract — AI summarizes threads into structured knowledge. Higher value, higher risk of noise.
   - **Option B:** Manual — users create notes explicitly. Lower risk, lower adoption.
   - **Default if not decided:** Manual (Plan 047 is already designed for this)
   - **Relevant plans:** 065, 047

## Links

- **Original:** https://promptql.io/
- **Scanner analysis (scan-mode):** ~/.claude/slack-scanner/analysis/promptql.md
- **Related drops:** [research-ai-ml-supply-chain-risks](2026-04-10-research-ai-ml-supply-chain-risks.md)
- **Related plans:** Plan 065, Plan 078, Plan 033 P5, Plan 047
