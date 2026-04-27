# Plan 033, Phase 5: LLM-Assisted Bid Generation

**Status:** In Progress
**Session:** `claude --resume poc/sme-mart`

## Implementation Phases

### Phase 1: Foundation (Data Model + DB)
- [x] Extend `Bid` model with `ai_assisted`, `ai_model`, `ai_generated_at`
- [ ] Create `bid-ai.model.ts` — AI-specific types
- [ ] ALTER TABLE bids (3 new columns)

### Phase 2: LLM Infrastructure
- [ ] Vercel API route `/api/llm/generate-bid` (Edge Function)
- [ ] `BidAiService` — context gathering + LLM orchestration + streaming
- [ ] Update `BidsService` — persist AI metadata

### Phase 3: UI Components
- [ ] `BidMethodChooser` component (mirrors RFP method chooser)
- [ ] `AiDraftBadge` component
- [ ] `AiLoadingPanel` component
- [ ] Integrate into `BidWizard` (method chooser before Step 1)

### Phase 4: Per-Section Regeneration (Stretch)
- [ ] "Regenerate" buttons on each wizard section
- [ ] Single-section re-drafting via BidAiService

### Phase 5: Testing
- [ ] Unit tests for BidAiService
- [ ] Integration tests for full AI bid flow
- [ ] Extend existing bid wizard specs

## Key Decisions

- **LLM Provider:** Claude (Anthropic API) via Vercel Edge Function
- **Approach:** Option C (client → Vercel Edge → Anthropic API) for POC
- **Streaming:** Yes, section-by-section progressive display
- **All AI content editable** — vendor reviews before submission
