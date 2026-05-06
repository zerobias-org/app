# Agentic Optimization & Automatic Maintenance — Concepts for SME Mart

**Source:** [Empromptu — Agentic Optimization & Automatic Maintenance](https://empromptu.ai/feature/agentic-optimization-and-automatic-maintenance)
**Added:** 2026-02-20

## Core Idea

AI applications that optimize, evaluate, and maintain themselves in production — preventing performance degradation as data and models evolve, without manual intervention.

## Key Concepts from Empromptu

1. **Continuous Evaluation** — every AI execution scored and tracked against baselines
2. **Drift Detection** — monitor output quality, data patterns, and behavioral consistency; catch regressions before users notice
3. **Controlled Promotion** — only validated improvements deploy through governed pathways
4. **Policy-Aware Optimization** — all optimizations checked against governance policies
5. **Reduced Operational Overhead** — eliminate manual prompt tuning, reactive debugging, emergency model swaps

## How These Map to SME Mart

### 1. AI Execution Scoring (Near-term, Phase 5+)

If/when we add AI-assisted features (RFP generation, service matching, provider recommendations), track every output:

```typescript
interface AIExecutionLog {
  feature: string;        // 'rfp-generation' | 'service-matching' | 'provider-recommendation'
  promptVersion: string;  // track which template produced this
  input: object;
  output: object;
  score?: number;         // user feedback or automated quality metric (accepted/rejected/modified)
  timestamp: Date;
}
```

Store in Neon DB. Build admin dashboard panel to review AI performance over time.

### 2. Drift Detection for Hub Module / Data Layer

- **Schema drift** — monitor if Neon DB schema changes unexpectedly and alert before queries break
- **Data quality monitoring** — track if data patterns through the DataProducer interface shift (e.g., sudden drop in provider profiles, anomalous review patterns)
- **Connection health** — automated monitoring of Generic SQL Hub Module connection status (we already hit a 503 during initial setup)
- Could surface as a "Data Health" panel in the admin dashboard

### 3. Policy-Aware Optimization via ZeroBias Boundaries

ZeroBias already has **Boundaries** and **Tasks** as governance primitives. We can:
- Tie any AI optimizations to the org's boundary policies
- Ensure automated decisions respect access control
- Log AI decision changes in the **Transparency Center** audit trail
- Use ZeroBias Tags to track AI model versions / prompt versions in production

### 4. Self-Healing / Reduced Operational Overhead

Practical for Clark's 15 hrs/week constraint:
- **Connection auto-recovery** — if Hub connection drops, retry with backoff before surfacing error
- **Model version abstraction** — if we integrate LLMs, abstract the model behind a service so upgrades don't require code changes
- **Prompt variant A/B testing** — try different prompt templates, promote the better performer automatically

### 5. Admin Dashboard — AI Monitoring Panel (Future Phase)

Add an "AI Health" tab to the admin panel:
- Execution logs with scores
- Prompt version comparison (which template performs better)
- Data drift alerts
- Connection health status
- Model version tracking

## Priority & Timing

These are **post-MVP concepts** — not needed until we introduce AI-assisted features. The foundation to build on:

| Concept | Prerequisite | Earliest Phase |
|---------|-------------|----------------|
| Execution logging | AI features exist | Phase 5+ (if AI features added) |
| Data drift detection | DataProducer connection stable | Phase 6-7 |
| Connection health monitoring | Hub Module in production | Phase 7 |
| Policy-aware optimization | Boundaries integration | Post-MVP |
| Prompt A/B testing | Multiple AI features | Post-MVP |
| Admin AI health panel | Any of the above | Post-MVP |

## Action Items

- [ ] Revisit after Phase 5 when engagement lifecycle is complete
- [ ] Evaluate which AI-assisted features to build first (service matching? RFP generation?)
- [ ] Design the `ai_execution_logs` table schema when ready
- [ ] Discuss with Kevin whether Hub Module health monitoring should be platform-level or app-level
