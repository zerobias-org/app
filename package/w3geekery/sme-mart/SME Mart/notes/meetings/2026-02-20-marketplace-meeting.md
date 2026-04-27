# Marketplace Meeting Summary

**Date:** Feb 2026
**Duration:** ~11 minutes
**Participants:** Brian Hierholzer, Clark Stacer
**Source:** `~/Projects/ZeroBias/transcripts/Marketplace--Meeting Transcript.docx`

---

## Cleaned Transcript

[0:00] Brian: To help plan.

[0:07] Clark: I just clicked "start transcription" in Teams — clicking the triple dot menu, "record and transcribe," and now I'm seeing the words in a transcript.

[0:29] Brian: Perfect. So let's write the hooks to this. Let's do an integration to calendaring and video/audio calls to leverage those quickly — right out of Microsoft 365, Teams, or Zoom. We've got to pull all those integrations into the project.

[1:02] Clark: Yeah, that'll be fun to investigate.

[1:08] Brian: And then that observability article — if you could pull all that context into observability requirements and how those would fit into the task system, as well as how those things would need to be shared in the transparency center between both parties. Assume full transparency — all data from the supply side and demand side would have to be shared for every agentic run, because the agent's going to be programmatically doing things.

[2:03] Clark: I ran into something we need to talk about. When I was telling Claude to attach a plan to a task as a w3geekery vendor, I realized file attachments upload to our S3 AWS bucket. There might need to be the ability to save attachments to a private location — that needs to be looked into.

[2:52] Brian: The other thing is data sensitivity. How are we classifying this data? Are certain tasks highly sensitive versus others? Patient-centric stuff, PII? Where does data classification come in? Do we need data classification tied to access for certain file types? Where are certain things stored versus things that are not sensitive or confidential?

[3:38] Clark: Right, we need the flexibility depending on the context of privacy and security.

[3:48] Brian: This task system will be guided by all of these parameters. Everything it does is going to be accessing data, network, or applications. Did it access it securely? What were the rights granted — too broad or narrow? Was this PII? In government it's called CUI. All of that gets trapped in the task, bound to products, bound to data objects with read/write capabilities. What was the context of what the agent did and why? Did we test this prior to releasing into production?

[5:00] Brian: Are we going to have subtasks for test/prototype, and then the final task is the production release? A full historical of release management — all in the task. This task system is an encyclopedia in itself.

[5:34] Brian: All landing in transparency between parties. The buy side and sell side — does a task technically get split apart? Like the transparency center: sell side, demand side, and shared pieces.

[6:35] Clark: That's where having an umbrella task for the engagement — one master task with subtasks divided between supply side and demand side.

[6:52] Brian: There's going to be task assignment, pools of tasks, task selection from a person or an agent. This is like a call center, an operational round robin, an auditing system, a JIRA ticket, a Monday board, a billing engine, an assessment — it's insane.

[7:47] Clark: We're doing a good job exposing the bits that need to be expanded. It's a process of refinement — we're on the path.

[8:03] Brian: Let's just get the concepts in art — make pictures of all these concepts. Transparency on the left, transparency center on the right, the shared middle. Data on each side, what's shared based on permissions. Audio calls, transcription, calendar integration, full memory of all of it.

[8:38] Brian: All the observability requirements — once you look at that article you'll see standards for retention of memory: why did the agent do this, when, what was the context of its decisioning, did it do something wrong, was there a permission override from the demand side, was it secure, did we audit it before it ran?

[9:32] Brian: And then by the way, we gotta bill it. How are we billing it?

[9:41] Brian: Look forward to seeing the data from this transcription landing in the UI — at least the planning of trapping it, and that observability set of requirements going into the transparency center, all bound in memory. Everything committed to memory from all parties, all context, all systems, all compliance, all conversations. And what is sensitive data and what's not?

---

## Topics Discussed

- **Meeting transcription integration** — Hooking into Teams/Zoom/365 for auto-capture of meeting recordings and transcripts
- **Observability requirements** — Agent activity logging, decisioning context, security audit trail, referencing an external observability article
- **Data sensitivity & classification** — PII, CUI (government), determining what's sensitive vs. not, storage implications
- **File attachment privacy** — Current S3 uploads may need scoped/private storage for vendor-uploaded files
- **Task system architecture** — Buy-side/sell-side split, umbrella tasks with subtasks, assignment pools, round-robin, release management (test/prototype/production subtasks)
- **Transparency center** — Full bidirectional visibility between supply and demand parties
- **Memory & compliance** — Complete audit trail of all conversations, agent actions, permissions, and compliance context
- **Billing** — Task system needs to support billing for all tracked work

## Key Decisions

1. **Assume full transparency** — For this exercise, all data from both supply-side and demand-side must be shared for every agentic run
2. **Conceptual diagrams first** — Brian wants visual "art" of all these concepts before implementation
3. **Task system is the backbone** — Everything (observability, billing, compliance, assignments) flows through the task

## Action Items

| # | Owner | Action | Context |
|---|-------|--------|---------|
| 1 | Clark | Research and integrate observability article into task system requirements | See [Observability Wall article notes](../observability-wall-article.md) — C-Traces (Cognitive Traces) concept maps directly to task system transparency requirements |
| 2 | Clark | Investigate calendar/video integration hooks | Teams, Zoom, Microsoft 365 — pull integrations into the project |
| 3 | Clark | Create conceptual diagrams | Visualize transparency center (supply/demand/shared), data flow, permissions model |
| 4 | Clark | Investigate private file attachment storage | Current S3 bucket may need scoped access for vendor-uploaded files |
| 5 | TBD | Define data classification scheme | Determine what's PII, CUI, sensitive vs. non-sensitive — affects storage and access |
| 6 | TBD | Design task buy-side/sell-side split | How does a task look when multiple parties observe it — shared vs. party-specific fields |
| 7 | TBD | Design billing integration in task system | How are tasks billed — tied to agent runs, hours, deliverables? |

## Open Questions

- How will data classification map to file storage locations and access controls?
- Should subtasks follow a release lifecycle (test -> prototype -> production)?
- How does task assignment/pooling work — manual selection, round-robin, or agent-driven?
- What specific observability standards need to be met (which article is Brian referencing)?
- How granular should the transparency center split be per task?

## Key Quotes

> "This task system literally will be guided by all of these parameters. Everything it's gonna do is gonna be accessing data or network or applications." — Brian

> "This is like a call center. It's an operational round robin. It's an auditing system. It's a JIRA ticket. It's a Monday board. It is a billing engine. It is an assessment. It's insane." — Brian

> "We need to have the ability to be flexible depending on the context of privacy and security." — Clark

> "We have to literally have everything committed to memory from all parties, all context, all systems, all compliance, all conversations." — Brian
