# Spec-Driven Development & GSD Framework — SME Mart Alignment

> **Source:** "Spec-Driven Development Is Eating Software Engineering: A Map of 30+ Agentic Coding Frameworks (2026)" by Vishal Mysore, Medium, Mar 9 2026
> **PDF:** `~/Downloads/Spec-Driven Development Is Eating Software Engineering...pdf`
> **Context:** Brian + Kevin discussing GSD framework adoption for ZB platform project templates (Slack 2026-03-18)

---

## Key Insight

> "Don't prompt AI to write code. Give it a specification and let agents implement it."

**Spec-Driven Development (SDD)** treats the specification as the source of truth, not the code. The workflow shifts from `Prompt → Code` to `Spec → Plan → Tasks → Code`.

## The Four Layers of the Agentic Coding Stack

| Layer | Purpose | Examples |
|-------|---------|----------|
| **1. Spec Frameworks** | Define requirements + architecture | Spec Kit, OpenSpec, BMAD, Intent, cc-sdd |
| **2. Planning & Task Systems** | Convert specs into task graphs | Taskmaster AI, Agent OS |
| **3. Execution Orchestrators** | Sub-agents execute tasks | **GSD**, Ralph Loop, Feature-Driven-Flow |
| **4. Autonomous Agents** | Full end-to-end | Devika, Tessl |

## GSD (Get Sh*t Done) — What Kevin Uses

- **Category:** Execution orchestrator (Layer 3)
- **Core idea:** Spec/roadmap → sub-agent execution
- **Key feature:** Solves context rot by spawning fresh sub-agents per task (clean 200K context each)
- **Workflow:** Requirements → plan → verify plan → execute → verify execution
- **GitHub:** github.com/gsd-build/get-shit-done (23K stars as of Mar 2026)
- **Multi-runtime:** Claude Code, OpenCode, Gemini CLI, Codex
- **Used by:** Amazon, Google, Shopify, Webflow

Kevin: "It is all self-contained. It takes requirements and then plans, verifies plan, executes, verifies execution. It is slow and deep and overkill for a single task but good for a full-stack feature or major change."

## Top 14 Frameworks Comparison

| # | Tool | Category | Core Idea | Notes |
|---|------|----------|-----------|-------|
| 1 | Spec Kit | Spec framework | Executable specs → plan → tasks → code | Most widely used SDD toolkit |
| 2 | OpenSpec | Spec framework | Change-based specs with proposal/design/tasks | Lightweight Spec Kit alternative |
| 3 | BMAD Method | Enterprise SDD | Multi-agent roles (PM, architect, dev) | Heavy enterprise planning |
| 4 | cc-sdd | Spec workflow | Requirements → design → tasks workflow | Bridge across coding agents |
| 5 | SpecFlow | Spec governance | Spec artifacts + compliance gates | Compliance-oriented |
| 6 | Agent OS | Planning system | Spec → task orchestration | Emerging agent workflow |
| 7 | Taskmaster AI | AI project manager | PRD → task graph → implementation | Focus on task graphs |
| 8 | **GSD** | Execution orchestrator | Spec/roadmap → sub-agent execution | **Execution-focused** |
| 9 | Ralph Loop | Autonomous TDD | Spec → tests → code → iterate | Test-driven agent loop |
| 10 | Feature-Driven-Flow | Governance pipeline | Spec with audit gates | Enterprise workflows |
| 11 | Superpowers | Lightweight workflow | Idea → mini-spec → tasks | Fast prototyping |
| 12 | Intent | Living spec system | Specs update as code evolves | Spec-as-truth |
| 13 | Tessl | Spec-as-Source | Code generated directly from spec | Specs are primary artifact |
| 14 | Devika | Autonomous coding agent | High-level objectives → steps → code | Open-source Devin-style |

## SME Mart / ZeroBias Alignment

Brian's vision: ZeroBias IS an SDD platform for regulated commerce. The Project/Board/Task hierarchy maps 1:1 to the SDD workflow:

```
SDD Workflow:              SME Mart Hierarchy (Plan 057):
─────────────              ──────────────────────────────
Idea                       RFP (storefront)
  ↓                          ↓
Specification              PRD (ProjectPrd — WHAT needs doing)
  ↓                          ↓
Architecture Plan          Plan (ProjectPlan — HOW/WHEN)
  ↓                          ↓
Task Breakdown             Board → Tasks (SmeBoard → SmeTasks)
  ↓                          ↓
Agent Execution            Activity Workflows (SmeActivity → SmeWorkflow)
  ↓                          ↓
Code / Deliverables        Deliverables + Evidence
  ↓                          ↓
Verification               Transparency Center (buyer/provider/shared rollups)
```

### Brian's Directive (2026-03-18)

> "I think this is a great template for product builders building apps on ZB"
> "Ideally we can trap it in a project/app template that also does intake as subtasks/plans"

This maps to Plan 042 (Project Plugin) — bundled MCP + templates + parsers for AI-driven project creation. The plugin IS an SDD executor for compliance engagements.

### Kevin's Usage

Kevin confirmed using GSD for ZB platform development. Its "requirements → plan → verify → execute → verify" cycle is the same pattern we're building into the platform as a first-class workflow for SME Mart users.

### Implications for Plans

| Plan | SDD Connection |
|------|---------------|
| **057** (Project View) | PRD + Plan + Board/Task = SDD's Spec → Plan → Tasks |
| **040** (Project Bloom) | AI document decomposition = SDD's "spec → task graph" |
| **042** (Project Plugin) | Bundled MCP + templates = SDD execution framework for compliance |
| **058** (Saved Task Views) | Filtered views across boards = SDD's task monitoring |
