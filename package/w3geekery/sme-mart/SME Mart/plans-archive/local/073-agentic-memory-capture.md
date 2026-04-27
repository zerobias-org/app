# Plan 073: Agentic Memory Capture in Tasks

**Status:** Stub
**Phase:** Future
**Created:** 2026-03-24
**Depends on:** Plan 057 (task system), ZB platform agentic framework
**Source:** Brian CEO meeting 2026-03-24 — full agentic session audit trail, Joe compliance requirement

---

## Purpose

Capture full LLM/agent session data in the task system. Every agentic interaction that touches a task must be recorded: agent ID, API key, full session transcript, reasoning chain. Required for compliance audit trail (Joe) and operational continuity (shift handoff).

## Core Requirements (Brian + Joe)

1. **Agent ID tracking** — every agentic instance (Claude session, MCP key, API key) identified
2. **Full session capture** — complete session transcript, not just summaries
3. **Task-level memory** — each task retains all agentic sessions that touched it
4. **Project-level rollup** — task memories roll up to project history
5. **Org-level rollup** — project memories roll up to org history ("full historical across all projects forever")
6. **Dual retention** — shared memory (transparency center) + private memory (each party's proprietary work)
7. **Compliance** — full audit trail of every agentic instance, per Joe's requirements

## Memory Hierarchy

```
Org Memory (forever, per-org)
└── Project Memory (all tasks in project)
    └── Task Memory (all sessions on this task)
        ├── Shared: transparency-entangled session data (visible to both parties + assessors)
        └── Private: party-specific session data (visible only to owning org)
```

## Data Model Considerations

Session data is potentially large (full Claude transcripts). Storage options:
- **AuditgraphDB** — structured metadata (agent ID, timestamps, summary) as task fields
- **FileService** — full session transcripts as file attachments on tasks
- **Dedicated memory store** — if volume warrants it (future)

Likely hybrid: metadata in GQL fields, full transcripts as attached files.

## Relationship to Existing Systems

- **SpecStory** — already captures Claude Code session transcripts in `.specstory/history/`. Similar concept, but task-scoped rather than developer-scoped.
- **ZB platform C-Traces** — cognitive traces for agent decisioning context. May overlap/integrate.
- **Timeline** — session events appear on project timeline as task activity entries.

## Effort Estimate

10-15 hours (data model, capture hooks, storage, task detail UI panel, privacy controls)

---

*Session: `claude --resume poc/sme-mart`*
