## Meeting Summary

**Date:** 2026-03-24
**Time:** 2:00 PM – 2:30 PM PT
**Duration:** ~30 minutes
**Participants:** Brian Hierholzer (CEO), Clark Stacer (Frontend Dev)
**Meeting Type:** Architecture / Vision — Engagement-Project hierarchy, agentic task systems, transparency audit trail

### Topics Discussed

- **Dual-party GSD / SDD within Projects** — Brian proposed that a common GSD (Goal-Spec-Driven) or SDD (Spec-Driven Development) toolkit should serve BOTH parties in a project, not just one side. After meetings or Slack conversations, the AI system would listen and auto-generate task proposals for both demand and supply sides. Joe Llamas shares this vision — engagements are long-lived with many meetings, and agentic systems should eventually participate in these conversations and build tasks for both parties.

- **Meeting transcript → task trail** — Clark and Brian agreed that meeting transcripts should be uploaded as project documents, with summarized notes and any spawned tasks linking back to the source transcript. Full provenance: "why was this task created? → this meeting, agreed by both parties."

- **Catalina wants Project NOW** — Brian reported that Catalina asked about creating a project with ZeroBias to attach tasks and a contract that "sets the stakes" based on hours. Brian's message: "we need it now, so let's tell Clark to hurry."

- **SME Mart UAT publishing** — Clark reported that Chris is helping finish the publishing flow for SME Mart to UAT. Kevin and Chris are "coming up for air" and starting to discuss features in standups.

- **Boundary-centric task model** — Brian reinforced that the majority of tasks are boundary-centric. Tasks need boundary permissions because the boundary is "the true perimeter of the network — the absolute non-porous steel lock that guards all things." Projects span multiple boundaries; tasks live within specific boundaries.

- **Transparency Entangled Task Pairs** — Brian introduced refined terminology: "Transparency Entangled Task Pairs" — mirrored tasks on demand and supply sides connected through the transparency center. Demand side creates a requirement task; the entanglement creates a corresponding permission/fulfillment task on the supply side (e.g., granting access to S3 buckets, APIs, data objects). The boundary mediates all access.

- **Project member roles** — Brian described three tiers: (1) active participants responsible for tasks, (2) observers/supervisors who watch task boards and may approve but don't do the work, (3) general members/viewers. A manager of 10 people needs cross-task visibility within the project. Observer role might map to a boundary role with scoped observability.

- **Boundary segmentation flexibility** — Brian emphasized boundaries can be very broad OR extremely narrow (down to one product per boundary per person). A supply-side org might isolate 7 people each into separate single-product boundaries, completely segmented and blind from each other. Multiple people in one org can work in different boundaries on the same project.

- **Task queuing and shift handoff** — Brian described a 24/7 help desk scenario where tasks need a queuing system. Unfinished tasks re-queue for the next shift. Requires persistent memory: the entire LLM/agent session must be pushed into the task system so the next person (or agent) gets full context for handoff.

- **Agentic memory capture in tasks** — Brian (echoing Joe) stated that every agentic ID and full session data must be captured in the task system. From a compliance perspective, full audit trail of every agentic instance is required. The task system must trap all agentic memory (Claude sessions, alternative LLMs) plus human activities. Memory persists at task level → rolls up to project level → rolls up to org level. Both parties retain forever.

- **Transparency center as immutable audit trail** — Brian described the transparency center as retaining the shared memory between parties, while each party also maintains private (non-shared) memory. The shared audit components will be cryptographically hashed — fully immutable. Clark drew the analogy to blockchain. Brian confirmed: immutable audit trail, nothing can be erased, only appended.

- **Timeline as the history surface** — Clark confirmed the timeline view is designed to be exactly this: every timestamp of task creation, transitions, file uploads, evidence submissions, requirement satisfactions — the complete project history.

### Key Decisions

1. **GSD/SDD toolkit should be dual-party** — serves both demand and supply sides within a project, not just one party.
2. **Meeting transcripts become project documents** with task provenance links.
3. **Project feature is urgent** — Catalina needs it now for real engagement with ZeroBias.
4. **Transparency entangled task pairs** is the working terminology for mirrored demand/supply tasks.
5. **Agentic session memory must be captured in the task system** — full audit trail requirement from both compliance and operational perspectives.
6. **Transparency audit trail will be cryptographically hashed** — immutable, append-only.

### Action Items

| # | Owner | Action | Priority | Context |
|---|-------|--------|----------|---------|
| 1 | Clark | Finish Engagement → Project UI restructuring (Plan 022) | HIGH | Catalina needs project capability now |
| 2 | Clark | Continue SME Mart UAT publishing with Chris | HIGH | Publishing flow for correct platform deployment |
| 3 | Clark | Capture agentic memory requirements in plans | MEDIUM | Task system needs to store LLM session data, agent IDs |
| 4 | Clark | Add task queuing/handoff concept to roadmap | MEDIUM | 24/7 shift scenarios, task re-assignment with context preservation |
| 5 | Brian | Send "the file" to Clark (referenced at end of meeting) | HIGH | Unspecified document Brian is preparing |

### Open Questions / Unresolved

- How exactly does the cryptographic hashing of transparency audit records work? (Brian said "we'll get into that later")
- What is the specific file Brian is sending Clark?
- How does the dual-party GSD toolkit integrate with existing meeting transcript processing?
- Where does the agentic session memory physically live? (Task attachments? Dedicated memory store? AuditgraphDB?)
- How do observer/supervisor roles map to ZB platform boundary roles?

### Key Quotes

> "Why would the spec driven development just satisfy one side? Why wouldn't it kind of potentially work for both?" — Brian, on dual-party GSD

> "We need it now. So let's tell Clark to hurry." — Brian, relaying Catalina's request for project capability

> "The boundary is the true perimeter of the network. That is the absolute non-porous steel lock that guards all things within that boundary and mediates all things in and out." — Brian

> "Our task system has to trap all of the agentic memory from that Claude session or alternative LLM solution into the task so that it carries its memory of every agent session." — Brian

> "Those transparency audit components are going to be cryptographically hashed. So they are immutable — a fully immutable audit trail." — Brian
