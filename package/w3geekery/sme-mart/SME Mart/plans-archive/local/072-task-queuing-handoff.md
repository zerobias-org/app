# Plan 072: Task Queuing & Shift Handoff

**Status:** Stub
**Phase:** Future
**Created:** 2026-03-24
**Depends on:** Plan 057 (task system), ZB platform task assignment APIs
**Source:** Brian CEO meeting 2026-03-24 — 24/7 help desk scenario

---

## Purpose

Support 24/7 shift-based operations where tasks re-queue when a shift ends. The next person (or agent) picks up with full context — including LLM session memory from the previous worker.

## Core Concept

Brian's scenario: a help desk runs 24/7. A task comes in, is assigned to Person A on shift. Person A starts work (possibly with Claude/LLM assistance) but shift ends before completion. The task must:

1. Re-queue (back to unassigned or assigned to next shift)
2. Carry full context: all work done so far, all LLM session data, all human notes
3. Next person picks up seamlessly — no "cold start"

## Key Requirements

- **Task queue per board** — unassigned tasks in a priority queue, picked by role/skill/availability
- **Shift handoff** — explicit "hand off" action that captures current state + re-queues
- **Session memory capture** — LLM session data pushed into task before handoff (Plan 073)
- **Handoff history** — full trail of who worked on it, when, what they did
- **Skills-based routing** — tasks route to qualified workers based on role/skill tags

## Relationship to Plan 073 (Agentic Memory)

Task queuing is the workflow container; agentic memory capture is the data that travels with the task. They're complementary but separable — queuing works without agentic memory (just human handoff notes), and agentic memory works without queuing (session data captured even without shift changes).

## Effort Estimate

8-12 hours (queue model, handoff flow, routing logic, handoff history UI)

---

*Session: `claude --resume poc/sme-mart`*
