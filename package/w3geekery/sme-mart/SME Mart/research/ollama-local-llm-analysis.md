# Ollama Local LLM Integration — Feasibility Analysis

**Date:** 2026-03-26
**Author:** Clark / Claude
**Status:** Research Spike

## Executive Summary

Ollama enables running LLMs locally with a REST API at `localhost:11434`. This analysis evaluates where local inference could add value to SME Mart and ZeroBias UI, considering that SME Mart already uses Claude (Anthropic API) for AI-assisted bid generation.

**Key finding:** The strongest use cases are **cost reduction** (replacing low-complexity Claude API calls), **embedding-based search** (zero per-query cost), and **offline/edge capabilities**. Local LLMs are NOT a replacement for Claude on complex reasoning tasks like bid generation.

---

## Ollama Technical Capabilities

### API Surface
| Endpoint | Purpose | OpenAI-Compatible? |
|----------|---------|---------------------|
| `POST /api/chat` | Multi-turn conversation | Yes (`/v1/chat/completions`) |
| `POST /api/generate` | Single-prompt generation | — |
| `POST /api/embed` | Vector embeddings | Yes (`/v1/embeddings`) |
| Model management | Pull, list, delete models | — |

### Key Features
- **Structured output** — JSON mode + JSON Schema enforcement (deterministic)
- **Tool/function calling** — Supported by Llama 3.1+, Qwen3, Mistral Nemo
- **Streaming** — NDJSON streaming on all endpoints
- **Thinking/reasoning** — Extended thinking traces on supported models
- **Vision/multimodal** — LLaVA, Llama 3.2 Vision
- **OpenAI SDK compatible** — Drop-in replacement for `openai` client libraries

### Practical Model Tiers

| Tier | Models | VRAM | Speed | Quality |
|------|--------|------|-------|---------|
| **Edge** (0.5–3B) | Qwen3 0.5B, Phi 2, Gemma 2B | <2GB | 100+ tok/s | Basic classification, extraction |
| **Sweet spot** (7–8B) | Llama 3.1 8B, Qwen3 8B, Mistral 7B | 5–6GB | 40–60 tok/s | Good for structured tasks, summaries |
| **Heavy** (70B+) | Llama 3.3 70B | 43GB+ | 5–15 tok/s | Near-cloud quality, needs serious GPU |

### Embedding Models
| Model | Params | Context | Notes |
|-------|--------|---------|-------|
| `nomic-embed-text` | 137M | 8K | Best balance of quality/size |
| `mxbai-embed-large` | 334M | 512 | Surpasses OpenAI ada-002 |
| `qwen3-embedding` | 8B | 32K | Top MTEB score, heavier |
| `all-minilm` | 22M | 128 | Ultra-lightweight |

---

## SME Mart Opportunities

### Current AI Architecture
SME Mart already has AI integration via `BidAiService`:
- Claude Sonnet via Anthropic API through Vercel Edge middleware (`/api/llm/generate-bid`)
- SSE streaming to `AiLoadingPanel` component
- Structured bid parsing (executive summary, pricing, per-requirement responses)

### Opportunity 1: Embedding-Based Semantic Search (HIGH VALUE)
**What:** Generate embeddings for RFPs, bids, provider profiles, org documents, and notes. Enable natural-language search across all marketplace content.

**Where it fits:**
- RFP discovery — "Find RFPs related to SOC 2 readiness for healthcare"
- Provider matching — "Which providers have FedRAMP experience?"
- Document search — Cross-engagement search over uploaded org documents
- Note search — Semantic search across engagement notebooks

**Why Ollama:**
- Embeddings are cheap locally — `nomic-embed-text` runs on <1GB RAM
- Zero marginal cost per query (current faceted search is keyword-only)
- Embeddings can be pre-computed and stored in Neon (pgvector extension)
- No API key management or rate limits

**Architecture:**
```
Document created/updated → Ollama /api/embed → vector stored in Neon (pgvector)
User searches → query embedded → cosine similarity → ranked results
```

**Effort:** ~16–24 hrs (pgvector setup, embedding pipeline, search API, UI)

### Opportunity 2: Auto-Tagging & Classification (MEDIUM VALUE)
**What:** Automatically suggest `sme-mart.*` resource tags when content is created (RFPs, documents, notes).

**Where it fits:**
- RFP creation wizard (Step 2) — auto-suggest domain tags from description
- Org document upload — classify document type from content
- Note creation — suggest relevant engagement tags

**Why Ollama:**
- Classification is a low-complexity task — 7B models handle it well
- Structured output (JSON Schema) ensures valid tag format
- No round-trip latency to cloud API for simple classification
- Currently tags are 100% manual (Plan 037/039)

**Architecture:**
```
Content text → Ollama /api/chat (format: JSON Schema) → suggested tags array
```
Model: Llama 3.1 8B or Qwen3 8B with structured output

**Effort:** ~8–12 hrs

### Opportunity 3: Document Summarization for Project Bloom (MEDIUM VALUE)
**What:** Plan 040 (Project Bloom) envisions AI decomposition of uploaded documents into task trees. The initial summarization/extraction could use a local model, reserving Claude for the complex decomposition logic.

**Where it fits:**
- First-pass document parsing: extract key sections, dates, requirements
- Generate document summaries for the engagement timeline
- Pre-process before sending to Claude for full decomposition (reduces token cost)

**Why Ollama:**
- Reduces Claude API cost by pre-filtering/summarizing long documents
- 8B models handle extraction and summarization adequately
- Structured output ensures consistent section metadata

**Effort:** ~12–16 hrs (integrated with Plan 040)

### Opportunity 4: Bid Draft Pre-Generation (LOW-MEDIUM VALUE)
**What:** Use a local model for initial bid draft structure, then optionally refine with Claude.

**Why maybe not:**
- Bid generation is the highest-stakes AI feature — quality matters most
- Claude Sonnet significantly outperforms 8B local models on nuanced business writing
- Current cost is ~$0.56/interaction (Plan 033) — not prohibitive

**Verdict:** Keep Claude for bid generation. Not a good Ollama candidate.

### Opportunity 5: Meeting Notes Processing (LOW VALUE)
**What:** Process meeting transcripts locally instead of via Claude API.

**Why maybe not:**
- Meeting summaries benefit from Claude's comprehension quality
- Transcripts are long (high token count) — local models are slow on long context
- Already works well with current setup

---

## ZeroBias UI Opportunities

ZB UI has **zero existing AI integrations** — entirely greenfield.

### Opportunity 1: Vulnerability & CVE Summarization (HIGH VALUE)
**What:** Generate human-readable summaries of CVE/CWE entries, including risk assessment and remediation recommendations.

**Where it fits:**
- `PortalVulnerabilitiesService` — CVE detail views
- `PortalWeaknessesService` — CWE detail views
- Executive dashboards — aggregate risk narratives

**Why Ollama:**
- CVE descriptions are structured and formulaic — 8B models handle them well
- High volume (thousands of CVEs) — cloud API cost would be significant
- Summaries can be batch-generated and cached
- Compliance context is well-represented in training data

**Architecture:**
```
CVE data (description, CVSS, affected products) → Ollama → plain-English summary + remediation
Cache in Neon or Redis for repeat access
```

**Effort:** ~12–16 hrs

### Opportunity 2: Semantic Search Across Security Catalog (HIGH VALUE)
**What:** Same embedding approach as SME Mart — enable natural-language search across the full security catalog (products, vendors, frameworks, controls, attack patterns).

**Where it fits:**
- `PortalCatalogService` — "Find products that address insider threat detection"
- Framework crosswalks — "What NIST controls map to our SOC 2 gaps?"
- Attack pattern discovery — "Show techniques used in supply chain attacks"

**Why Ollama:**
- Catalog has thousands of entities — embedding once, searching for free
- Current search is faceted/keyword — semantic search is a major UX upgrade
- No ongoing API cost

**Effort:** ~20–28 hrs (larger entity surface than SME Mart)

### Opportunity 3: Alert Bot Configuration in Natural Language (MEDIUM VALUE)
**What:** Users describe what they want to detect in plain English → local model generates the alert bot filter body.

**Where it fits:**
- `PortalAlertBotsService` — alert creation wizard
- Reduces the expertise barrier for creating effective alerts

**Why Ollama:**
- Structured output (JSON Schema) ensures valid filter bodies
- Filter schema is bounded — 8B models can learn the pattern
- User-facing latency is acceptable (one-time generation during setup)

**Effort:** ~8–12 hrs

### Opportunity 4: Compliance Gap Analysis (MEDIUM VALUE)
**What:** Given a boundary's current control coverage, identify gaps against a target framework and generate remediation recommendations.

**Why Ollama:**
- Compliance frameworks are well-represented in model training data
- Structured input/output (control IDs, status, recommendations)
- Batch analysis can run in background

**Effort:** ~16–20 hrs

### Opportunity 5: Evidence Report Generation (MEDIUM VALUE)
**What:** Auto-generate audit report drafts from collected evidence.

**Why maybe Ollama, maybe Claude:**
- Report quality matters for compliance — may need Claude for final output
- Ollama could handle first-draft generation with Claude for polish
- Hybrid approach similar to SME Mart's document pre-processing

**Effort:** ~12–16 hrs (hybrid approach)

---

## Deployment Architecture Options

### Option A: Developer-Local (Spike/POC)
```
Developer machine → brew install ollama → ollama pull llama3.1:8b
Angular app → Vercel Edge middleware → localhost:11434
```
- Zero infrastructure cost
- Good for prototyping
- Not deployable to production

### Option B: Sidecar Service (Production-Ready)
```
Docker Compose:
  - ollama (GPU-enabled container)
  - embedding-worker (batch job for pre-computing vectors)

Vercel Edge → internal Ollama service URL
Neon pgvector for embedding storage
```
- Predictable cost (VM + GPU rental)
- No per-query API charges
- Scales with hardware, not usage

### Option C: Hybrid Cloud + Local
```
Low-stakes tasks → Ollama (classification, tagging, embeddings)
High-stakes tasks → Claude API (bid generation, complex analysis)
```
- Best quality-cost tradeoff
- Complexity of managing two inference backends
- Recommended approach

---

## Cost Comparison

| Task | Claude API (est.) | Ollama (8B local) |
|------|-------------------|-------------------|
| Tag classification (per call) | ~$0.003 | $0 (compute only) |
| Document summary (2K tokens) | ~$0.01 | $0 |
| Embedding (per document) | ~$0.0001 (OpenAI) | $0 |
| Bid generation (full) | ~$0.56 | Not recommended |
| CVE summary (per entry) | ~$0.005 | $0 |
| 1000 searches/month | ~$0.10 (embedding) | $0 |

**Break-even:** At ~500 classification/embedding calls per month, a $20/month GPU instance pays for itself vs. cloud API.

---

## Risks & Considerations

1. **Quality gap** — Local 8B models are measurably worse than Claude/GPT-4 on complex reasoning. Use only for bounded, structured tasks.
2. **Operational complexity** — Running Ollama in production means managing GPU infrastructure, model updates, and monitoring.
3. **Mac deployment** — Ollama runs well on Apple Silicon (Metal acceleration) for dev, but production needs Linux + NVIDIA GPU.
4. **Model licensing** — Most Ollama models are permissive (Llama 3, Qwen, Mistral) but verify commercial use terms.
5. **Latency** — First request after model load is slow (5–10s). Use `keep_alive` to keep models warm.
6. **Context limits** — 8B models typically support 8K–32K context. Long documents need chunking.

---

## Recommended Spike Scope

**Phase 1 — Proof of Concept (8–12 hrs):**
1. Install Ollama locally, pull `llama3.1:8b` + `nomic-embed-text`
2. Build a thin Angular service (`OllamaService`) wrapping the REST API
3. Implement auto-tag suggestion for RFP creation wizard (SME Mart)
4. Implement document embedding + pgvector search for one entity type
5. Measure: latency, quality vs. Claude, developer experience

**Phase 2 — Expand if POC validates (20–30 hrs):**
- Extend embeddings to all searchable entities
- Add CVE summarization to ZB UI
- Build the hybrid routing layer (Ollama for cheap tasks, Claude for complex)
- Docker Compose for local dev with Ollama sidecar

**Phase 3 — Production path (scope TBD):**
- GPU-enabled deployment (fly.io GPU, Railway, or self-hosted)
- Monitoring, model versioning, fallback to cloud API
- Performance benchmarks and quality gates

---

## Conclusion

Ollama is most valuable as a **cost-reduction and capability-expansion layer**, not a Claude replacement. The highest-ROI opportunities are:

1. **Embedding-based semantic search** — both apps, zero marginal cost, major UX upgrade
2. **Auto-classification/tagging** — SME Mart, reduces manual work, structured output makes it reliable
3. **CVE/vulnerability summarization** — ZB UI, high volume makes cloud API expensive

The recommended approach is **Option C (Hybrid)**: use Ollama for high-volume, low-complexity tasks and keep Claude for high-stakes generation (bids, reports, complex analysis).
