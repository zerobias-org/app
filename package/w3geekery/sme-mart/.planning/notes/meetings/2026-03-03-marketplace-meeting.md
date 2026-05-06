# Marketplace Meeting — 2026-03-03

## Meeting Summary

**Date:** Monday, March 3, 2026
**Duration:** ~41 minutes 44 seconds (0:03 to 0:41)
**Participants:** Brian Hierholzer (CEO/Product Owner), Clark Stacer (Frontend Developer)
**Meeting Type:** Weekly marketplace planning & technical requirements discussion

### Topics Discussed

1. **Engagement → Activity → Task → Subtask Hierarchy**
   - Four-level hierarchy: Engagement groups related work; Activities represent phases (RFP response, skill assessment, task execution); Tasks map to requirement types (functional, legal, compliance); Subtasks are individual work items
   - Each subtask is independently assignable, trackable, and billable
   - Example: functional requirement "build a system" → subtasks for each feature (create, delete, list items)

2. **Three-Sided Task Model (Demand / Shared / Supply)**
   - **Demand-side**: buyer specifies explicit requirements (functional, legal, compliance) — sees status, progress, deliverables
   - **Shared (Transparency Center)**: audit trail visible to both parties — assignments, completions, decisions, approvals
   - **Supply-side**: vendor proposes task breakdown, tracks implementation, adds internal notes — may have hidden metadata not visible to demand-side

3. **RFP-to-Engagement Flow**
   - Buyer creates RFP with: project overview, scope, deliverables, timeline, success criteria, compliance/legal requirements, budget
   - Vendors respond with proposed task breakdown, timeline, and pricing
   - Demand-side reviews vendor proposals — accept, reject, or request changes (negotiation loop)
   - Accepted proposal creates an engagement; vendor's task breakdown becomes the engagement's tasks
   - RFP is pre-engagement; engagement is where execution happens
   - Wizard-style creation flow suggested (engagement details → requirements → timeline → success criteria)

4. **Task Status & Approval Workflow**
   - Status lifecycle: pending → in_progress → awaiting_approval → completed
   - Vendor marks task complete → demand-side reviews and approves/rejects
   - Approval triggers invoice generation with line items per task/subtask
   - Progress indicators visible to demand-side (on track / behind / ahead)

5. **Data Classification & Sensitivity**
   - Classify by sensitivity: PII, CUI, HIPAA, confidential
   - Classification affects access control and audit logging
   - Access to sensitive data must be logged for compliance
   - Future: specialized/encrypted storage for sensitive data

6. **Scope Adjustment & Change Management**
   - Formal change request process: demand-side submits scope change → vendor responds with updated estimates → both agree
   - Change history maintained for audit (original scope → proposed change → agreed scope)
   - Prevents scope creep — both parties aligned on deliverables and pricing

7. **Living Documentation & Meeting-Driven Tasks**
   - Engagement documentation is living, not static — updated as requirements emerge
   - Project meetings surface new tasks, risks, and issues → converted to tasks/subtasks
   - All decisions and outcomes documented and linked to engagement

### Development Roadmap (per Brian)

| Phase | Focus | Key Features |
|-------|-------|-------------|
| **Phase 1** | RFP + Engagement Creation | RFP flow, engagement creation wizard, activity/task/subtask hierarchy |
| **Phase 2** | Engagement Execution | Task management, approvals, invoicing, demand/supply views |
| **Phase 3** | Observability + Audit | Transparency center, C-Traces, compliance tracking, audit trails |
| **Cross-cutting** | Scope Adjustment | Change requests, re-estimation, change history |

### Key Decisions

1. **Four-level hierarchy adopted** — Engagement → Activity → Task → Subtask
2. **Three-sided task model** — Demand view + shared/transparency view + supply view
3. **RFP creates engagement** — Vendor's accepted task breakdown becomes engagement tasks
4. **Status lifecycle** — pending → in_progress → awaiting_approval → completed
5. **Task/subtask nomenclature** — Use "task/subtask" in UI (per Brian)
6. **Approval gates billing** — Demand-side must approve before invoice generation

### Action Items

| # | Owner | Action | Due/Priority | Context |
|---|-------|--------|-------------|---------|
| 1 | Clark | Build engagement → activity → task → subtask hierarchy | P0 / Current | Architecture foundation for everything else |
| 2 | Clark | Add demand-side / supply-side view filtering | After #1 | Different visibility per marketplace role |
| 3 | Clark | Implement task status state machine | After #2 | pending → in_progress → awaiting_approval → completed |
| 4 | Brian | Document RFP flow and engagement creation flow | This week | Clark needs specs to build the UI |
| 5 | Brian | Define data classification scheme for tasks | This week | Informs access control and audit rules |
| 6 | Clark | Implement approval workflow | Phase 2 | Demand-side review/approve of vendor work |
| 7 | Clark | Build transparency center / audit trail view | Phase 3 | Observability and compliance |
| 8 | Both | Validate architecture against real engagement scenarios | Ongoing | Discover gaps as we build |

### Open Questions / Unresolved

- **Scope adjustment workflow** — Formal change request process discussed but details TBD (who approves, billing adjustment mechanics)
- **Hidden supply-side metadata** — What types of notes should be hidden from demand-side? Where's the line between privacy and transparency?
- **Automated vs. manual task creation** — Should RFP requirements auto-convert to tasks, or does the vendor always propose the breakdown?
- **Cross-engagement task dependencies** — Can tasks reference tasks in other engagements? Boundary isolation implications?
- **Subtask granularity** — How fine-grained should subtasks be before they become noise?

### Key Quotes

> "We really need a two-sided task, which is demand and supply. And then kind of a middle which is the transparency between the two." — Brian

> "This is the marketplace. This is where the marketplace is gonna live and breathe." — Brian

> "The buyer has some explicit needs — I have a legal requirement, I have a compliance requirement, and I have a functional requirement." — Brian

> "It would need to be a living document somewhere that, based on those project meetings, additional tasks and subtasks start getting created and scoped." — Clark

---

## Cleaned Transcript

[3:02] Brian Hierholzer:
The tasks. OK, so you're doing some core stuff from for the team's needs right now rather than the SME Mart is what is what you're. Yeah, no, it's but well, I guess one serves the other at the end of the day, yes.

[3:11] Clark Stacer:
Well, it's it's both.

[3:17] Clark Stacer:
Exactly. Yeah. Like I need it. I need that parent child in the in Smuart. Yeah, exactly.

[3:24] Brian Hierholzer:
Yeah, well, we really need A2 sided task which is 2 party task which is demand and supply right as well and then kind of a middle which is the transparency between the two because there may be stuff that's that that may be.

[3:41] Brian Hierholzer:
Explicitly needed on the demand side or requirements on the on the demand side and then some things on the supply side. But there may be, it may be some hidden things on the supply side of a task that we may, you know that supply may now want to share let's say.

[3:59] Brian Hierholzer:
Don't know how that'll end up yet, but but in any case, we'll get there.

[4:05] Clark Stacer:
Yeah. OK. Yeah. I'm trying to visualize this. So like you know it's the same you're you're you're envisioning this to be like the same task like they the buyer and and buy the.

[4:18] Brian Hierholzer:
Yeah, the buyer has some explicit needs like they're scoping out a project, right? Just think about it like an almost like an RFP, right? Where I I need these things. This is the this is the project that I want. You know, this is the way I see that the tasks being done. Let's say I want.

[4:27] Clark Stacer:
Mhm.

[4:38] Brian Hierholzer:
I have a legal requirement, I have a compliance requirement and I have a functional requirement, right? It's like the functional may be the outcome, which is like, OK, I want to build, you know, some sort of.

[4:53] Brian Hierholzer:
Architecture, or I want to hire some people or I want to do X, Y, Z, right? So those are the functional requirements. The legal requirements might be like, you know, I need it to be CUI compliant or something like that or or PII proof or HIPAA proof or something. And then the compliance requirements might be like, you know, I need, you know, a background check or a risk assessment or something like that.

[5:18] Clark Stacer:
Right. Got it. And so the the supply side would be the ones completing the requirements, right?

[5:25] Brian Hierholzer:
Yes, correct. The supply side would be like, you know, I can do these, I can do this as I have, you know, expertise in areas, A, B, and C, and I can complete your functional requirements. Like for your functional requirements, I can build you a system that does these three things. And for the compliance requirements, I can do a background check, I can do an assessment. Right? That's the supply side.

[5:42] Clark Stacer:
Yep, got it. And and they would be as part of like, the same task? Or would they be broken into like, a hierarchy or something?

[5:50] Brian Hierholzer:
Well, I think it's a hierarchy. I think that the the functional requirement would be a task. Let's say I want to build a system with these three things.

[6:00] Brian Hierholzer:
And then each of those functional requirements would be like a subtask of that task. So like, OK, feature one, I want to build the ability to create items. Feature two, I want to build the ability to delete items. Feature three, I want to build the ability to retrieve items and list them. Right?

[6:13] Clark Stacer:
Right, got it.

[6:14] Brian Hierholzer:
And then the and then the compliance or the the legal requirements would also be like, you know, a task. Like, OK, I need to ensure that this system is HIPAA proof. Let's say that's one task. Or I need, you know, I need to, you know, do a background check. That's another task. And then each of those would also have subtasks.

[6:31] Clark Stacer:
OK, got it. So so essentially, each requirement type becomes a task. And then the individual work items become subtasks.

[6:39] Brian Hierholzer:
Exactly. And I think that all of those tasks would be under the same engagement.

[6:44] Clark Stacer:
Yep. That makes sense.

[6:46] Brian Hierholzer:
But this is where we're going to capture all of this. Like, you know, we're going to have an engagement. And within that engagement, we're going to have multiple activities. And each activity, you know, has stuff that needs to happen.

[6:59] Brian Hierholzer:
You know, for instance, an engagement might have like, OK, you know, I need an RFP response. I need a skill assessment and a task response. Right? Those would be the activities. And within each activity, we're going to have tasks related to that activity.

[7:17] Clark Stacer:
Oh, OK. So it's engagement, which contains multiple activities, which contains multiple tasks, which contains multiple subtasks?

[7:23] Brian Hierholzer:
Exactly. Yeah. And I think it's a great container for all the work that needs to happen in the marketplace. This is where the marketplace is gonna live and breathe.

[7:35] Clark Stacer:
Yep, got it. That's awesome.

[7:39] Brian Hierholzer:
And, you know, it's it's kind of interesting because as you get, as you progress through an engagement, you know, the activities will, you know, kind of feed into one another. For instance, like, you know, the RFP response activity might, you know, create a bunch of tasks for the vendor, right? And then those tasks get completed.

[7:54] Brian Hierholzer:
Then you know, the next activity which might be the skill assessment, you know, that would might trigger, you know, some additional tasks or subtasks for the vendor to complete. And then, you know, the completion of that might then, you know, trigger the next activity which is like a task response. You know, that's where that's where the actual work is happening.

[8:14] Clark Stacer:
Right.

[8:16] Brian Hierholzer:
So it's it's a progression. And and I think a lot of that progression can be automated over time.

[8:22] Clark Stacer:
Yep. Yeah, that that makes sense.

[8:28] Brian Hierholzer:
Awesome. So, you know, we've got a a really good story here. OK, so let's talk about like, you know the actual dashboard views and stuff. You know, I think that from a demand-side perspective, you know, we need to have a, a dashboard that shows, you know, the engagements and the associated tasks.

[8:50] Brian Hierholzer:
And I think we need to kind of have a two-sided view. Like, you know, from a demand perspective, I am only going to see like, you know, the explicit requirements that I put in place. I'm not going to see like, you know, the supply side of the vendor's, you know, task notes or some of the some of the things that they might not want to share.

[9:09] Clark Stacer:
Mhm.

[9:10] Brian Hierholzer:
But on the supply side, you know, the vendor can see like, you know, the explicit requirements from the buyer and also, you know, some of the hidden metadata about the task that they're working on.

[9:21] Clark Stacer:
Right. So essentially the demand side is looking at their requirements and the supply side is looking at the requirements and how they plan to meet them?

[9:28] Brian Hierholzer:
Exactly. And also like, you know, they have, they have notes, they have the ability to mark a task as complete, they have the ability to comment on a task. Right? There's a whole interaction that's happening on the supply side. But the demand side is only going to see like, you know, the explicit requirements that they put in. They might see like, you know, the status of a task or the progress of a task, like you know, is it pending, is it in progress, is it awaiting approval, is it complete?

[9:48] Clark Stacer:
Right.

[9:49] Brian Hierholzer:
But they're not going to see like, you know, the vendor's notes or like, you know, some of the some of the things that the vendor might, might be doing that's that's not that's not part of the explicit requirements that the buyer put in.

[10:00] Clark Stacer:
Got it. And so that that seems like a filtering thing on the dashboard view, right? So if they're a demand-side user, they see the demand side task view. If they're a supply-side user, they see the supply side task view.

[10:12] Brian Hierholzer:
Exactly. And I think that, you know, the the tasks need to have a status. Right? So I'm thinking like pending, in progress, awaiting approval, and then done or completed.

[10:23] Clark Stacer:
Yep.

[10:24] Brian Hierholzer:
And I think that's, you know, from a demand-side perspective, you know, we need to have some sort of visual indicator that shows the progress. You know, we're on track, we're behind, we're ahead or some sort of progress indicator.

[10:34] Clark Stacer:
Yep, that makes sense.

[10:36] Brian Hierholzer:
And I think that's important because, you know, the buyer wants to know, like, you know, how the vendor is progressing with the tasks. And I think that from a transparency perspective, right? I think that we need, we need to be transparent about like, you know, what's happening, like you know, the audit trail of all the tasks.

[10:54] Brian Hierholzer:
Right? So from a, from an observability perspective, there needs to be like, you know, a transparency center. And that's where, you know, the both parties can see like, you know, the audit trail of all the tasks, like, you know, who assigned it, when was it assigned, when was it completed, what was the comments, what was the decision making process, right? And all of that needs to be auditable.

[11:13] Clark Stacer:
Right. That makes sense. So essentially we're capturing like the decision-making process, like the cognitive traces or the observability.

[11:21] Brian Hierholzer:
Exactly. Yeah. Yeah.

[11:24] Brian Hierholzer:
OK, so yeah, I think this is a really solid architecture. Let me talk about like, you know, the data classification.

[11:35] Brian Hierholzer:
Like, you know, we need to classify the data by data sensitivity. So like, you know, is this data CUI? Is this data PII? Is this data like you know, confidential or secret? And I think that, you know, the data classification, it may affect where the data is stored, right? Like, you know, sensitive data might be stored in a special location or something.

[11:58] Brian Hierholzer:
But more importantly, I think, you know, the data classification should determine like, you know, access control and the audit trail. Like, you know, if someone accesses a sensitive piece of data, that needs to be logged. And I think that, you know, the supply-side might need to, you know, put some notes on a task, right? And those notes might be, you know, not visible to the demand-side, right? Because, you know, they might be, you know, internal notes or something that they don't want to share.

[12:20] Clark Stacer:
Right.

[12:21] Brian Hierholzer:
But if they're marked as sensitive, you know, the access to those notes needs to be logged. Right? So that way we have visibility, right? Into who's accessing what.

[12:30] Clark Stacer:
Exactly. And that seems like it would be like a compliance thing. Right? So if this is like CUI or HIPAA or something, you need to track who's accessing it.

[12:39] Brian Hierholzer:
Exactly. Right. So so the data classification is important because it affects not only like, you know, where the data is stored, but also like, you know, the access control and the audit trail. And I think that, you know, in the future, we might have like, you know, specialized storage for sensitive data. Like, you know, maybe we might have like a separate database or maybe we might have like, you know, some sort of encrypted storage or something like that. But for now, I think we're just going to handle it with like, you know, access control and audit trails.

[13:03] Clark Stacer:
Yep, that makes sense.

[13:05] Brian Hierholzer:
Awesome. So let's talk about like, you know, the engagement kickoff and timeline.

[13:12] Brian Hierholzer:
Like, you know, I think we need to document like, you know, the engagement outcomes and deliverables right at the start. Like, you know, it's like an RFP, you know, at the end of the engagement, you know, we need to know like, you know, what the deliverables are and like, you know, what the success criteria are.

[13:27] Clark Stacer:
Yep, got it.

[13:29] Brian Hierholzer:
And then as you know, the engagement progresses, right? You know, we might need to like, you know, document like, you know, the outcomes and like, you know, adjust the scope of the engagement if necessary, right? And I think that's important because, you know, the marketplace needs to be flexible, right? Like, you know, the vendor might be able to do more than what the buyer initially requested, right? Or the vendor might not be able to do something that the buyer requested.

[13:51] Brian Hierholzer:
So we need to be able to like, you know, scope the engagement appropriately. And I think that, you know, the engagement timeline also needs to be visible to both parties. Like, you know, the demand-side needs to know like, you know, the vendor's expected completion date. And the supply-side needs to know like, you know, the buyer's deadline, right?

[14:07] Clark Stacer:
Right.

[14:09] Brian Hierholzer:
And I think that's important because, you know, there might be like, you know, a gap between the two, right? Like, you know, the vendor might think they can complete it in two weeks, but the buyer might need it in one week. Right? So there's a mismatch.

[14:21] Clark Stacer:
Right, yeah. And then that would be scope adjustment, right? Like they either need to reduce scope, increase resources or agree on a different timeline?

[14:29] Brian Hierholzer:
Exactly. Yeah. And I think that's, you know, that's where the negotiation happens. And I think that that's important in the marketplace because, you know, both parties need to be aligned, right? Like, you know, the vendor needs to know what they're committing to. And the buyer needs to know like, you know, what they're going to get and when they're going to get it.

[14:47] Clark Stacer:
Yep, got it.

[14:50] Brian Hierholzer:
Awesome. So, you know, I think we've covered a lot here. Let's talk about, you know, project meetings and how that feeds back into the engagement. Like, you know, we might have like, you know, a project kickoff meeting or like, you know, an execution meeting. And during that meeting, you know, we might identify like, you know, additional tasks that need to happen or like, you know, maybe tasks that don't need to happen anymore, right?

[15:09] Clark Stacer:
Right.

[15:10] Brian Hierholzer:
And I think that, you know, the way that we handle that is, you know, we document those meetings, and then, you know, the meeting notes, those notes might generate like, you know, some additional tasks or subtasks for the vendor to complete.

[15:23] Clark Stacer:
Right.

[15:25] Brian Hierholzer:
And I think that's important because, you know, engagements are dynamic, right? Like, you know, the engagement might start with like, you know, a certain set of tasks. But as you progress through the engagement, you know, there might be like, you know, additional things that come up that needs to happen. And those things might generate like, you know, additional tasks or subtasks.

[15:41] Clark Stacer:
Right. Yeah. And those project meetings might also, they might surface like, you know, risks or issues that need to be addressed. And so those could also become tasks.

[15:50] Brian Hierholzer:
Exactly. Yeah. You know, if there's like, you know, an issue or a risk that needs to be addressed, like, you know, that gets turned into a task or a subtask. Right? So the engagement is really like, you know, it's a living thing, right? As you progress through the engagement, you know, the tasks evolve. The subtasks evolve. And I think that, you know, that's captured in the project meetings.

[16:08] Clark Stacer:
Yep, got it. So when the project meetings happen, we need to like, document those and then surface additional tasks or subtasks from those meetings.

[16:16] Brian Hierholzer:
Exactly. And I think that, you know, we need to document like, you know, the meeting outcomes and like, you know, the decisions that were made. And from those outcomes and decisions, you know, we need to surface like, you know, the additional tasks or subtasks. And I think that, you know, all of that needs to be documented and tracked in the engagement.

[16:34] Clark Stacer:
Right. And so that documentation should be like a living document somewhere that, you know, the stakeholders can refer to?

[16:42] Brian Hierholzer:
Yes, exactly. And based on those project meetings that additional tasks and subtasks start getting created and scoped.

[16:49] Clark Stacer:
Exactly. Yeah, so it would need to be a living document somewhere that, you know, the stakeholders can refer to. And then based on those project meetings, additional tasks and subtasks start getting created and scoped.

[16:58] Brian Hierholzer:
Yes, exactly. And I think that you know, you want to have like, you know, a clear process around like, how we handle that, you know, whether it's an automatic or whether it's a semi-automated process, or something that's done manually. I think that needs to be, you know, part of our engagement process.

[17:11] Clark Stacer:
Yeah, exactly. So it would need to be a living document somewhere that, you know, the stakeholders can refer to, and then based on those project meetings, additional tasks and subtasks start getting created and scoped. And that gets tied into the marketplace.

[17:24] Brian Hierholzer:
Exactly. Yeah. And I think that's where like, you know, the marketplace is going to, you know, capture like, you know, the execution of the engagement and like, you know, the outcomes. And I think that's where, you know, transparency becomes really important, right? Like, you know, both the buyer and the vendor need to be able to, like, you know, track the progress of the engagement and like, you know, understand like, you know, what's happening and like, you know, what the outcomes are.

[17:45] Clark Stacer:
Right.

[17:47] Brian Hierholzer:
OK, so I think that covers like, you know, most of the core requirements for the engagement in the task, right? And I think that, you know, this is going to be a really great foundation for the marketplace. So, you know, you know, we've talked about like, you know, the task architecture, you know, the dashboard views, you know, the data classification, the engagement timeline, the project meetings. I think that, you know, that covers like the main components. So, you know, I think you know, you should be in a position to like, you know, work on like, you know, some of these features or some of these requirements, right?

[18:12] Clark Stacer:
Yeah, absolutely. Yeah, let me let me start with the basics, which is like the engagement, the activity, and the task hierarchy. And, you know, once I have that in place, you know, I can then layer on like, you know, the visibility and the filtering logic. And then, you know, we can tackle like, you know, the task status transitions and like, you know, the progress indicators and stuff like that.

[18:34] Brian Hierholzer:
Yeah. Yeah, that's that's great. That's a good approach.

[18:36] Clark Stacer:
And and from there, you know, we can then layer on the, the transparency center and the audit trails.

[18:42] Brian Hierholzer:
Exactly. Yeah, I think that's that's a good approach. Build the core, and then layer on the, the observability and the audit trails.

[18:50] Clark Stacer:
Exactly.

[18:52] Brian Hierholzer:
OK so I think we have a good place to start. Um, so before we go, I want to, I just want to check on the status of some of the features that we're already working on.

[19:03] Clark Stacer:
Yeah, absolutely.

[19:05] Brian Hierholzer:
So, let's, let's check on the task list stuff. So, I know that, you know, we've been working on like, you know, task cards, and we've been working on like, you know, task lists.

[19:15] Clark Stacer:
Yeah. So we have the task card component and the task list panel component. And, you know, we have the ability to display all tasks and filter by status or assignee or sort them. And we have, you know, inline editing for task priority.

[19:30] Brian Hierholzer:
Awesome. That's great. So, so let's talk about like, you know, the subtask creation. We need to be able to create subtasks from the task detail view.

[19:41] Clark Stacer:
Yeah, so we have a create subtask dialog, and we can add a subtask with a name and a description. But I think we need to like expand that dialog to include things like like, you know, assignees, dates, status, and stuff like that.

[19:54] Brian Hierholzer:
OK, yeah. So let's make sure that we're covering all the fields that are necessary. OK, so let's talk about like, you know, the engagement detail view. So, you know, we need to have like, you know, an engagement view that shows, you know, all the activities and all the associated tasks and subtasks.

[20:12] Clark Stacer:
Right. Yeah, so we have the engagement detail component. And, you know, we have the list of engagements. So, you know, I need to like, layer on the, the activities view and then the tasks and the subtasks view within the engagement detail.

[20:25] Brian Hierholzer:
Yeah, exactly. And I think that, you know, we need to have like, you know, a visual representation of the hierarchy. Like, you know, we need to be able to see like, you know, the engagement, the activities, the tasks, and the subtasks all in like, you know, a nice visual representation.

[20:38] Clark Stacer:
Right. Yeah. And for that, we might need to like, introduce a breadcrumb or like, you know, tree view or something like that to show the hierarchy.

[20:46] Brian Hierholzer:
Yeah. And I think that, you know, it's important for navigation, right? Like, you know, users need to be able to like, you know, quickly navigate between the different levels of the hierarchy.

[20:55] Clark Stacer:
Exactly. Yeah, the breadcrumbs would be helpful for that.

[20:58] Brian Hierholzer:
Yeah. OK, so, you know, I think we've covered like, you know, a lot of good ground here. So, you know, we've got the engagement and task hierarchy, the dashboard views, the subtask creation, and the hierarchy navigation. And I think that's a good place to start.

[21:15] Clark Stacer:
Yeah, absolutely. Sounds good.

[21:17] Brian Hierholzer:
OK, so um, let's see. Let's talk about like, the task approval workflow. So, you know, the demand-side has to, the demand-side has to approve the work, right? Like, you know, the vendor completes the task, and then the demand-side has to review the work and approve it.

[21:32] Clark Stacer:
Right. Yeah.

[21:34] Brian Hierholzer:
So, we need to have like, you know, the ability for the demand-side user to approve or reject the work. Right? And I think that, you know, the status would then move to like, you know, awaiting approval or something like that. And then, you know, after the approval, it would move to like, you know, complete.

[21:50] Clark Stacer:
Right. So the vendor marks a task as complete, and then the demand-side user reviews and approves or rejects it.

[21:56] Brian Hierholzer:
Exactly. And I think that's, you know, that's an important part of the marketplace because, you know, the buyer needs to verify that the work is actually complete before they pay.

[22:07] Clark Stacer:
Right.

[22:09] Brian Hierholzer:
OK, so let's talk about like, you know, the invoice generation. So, you know, once the work is approved, we need to generate an invoice for the vendor. Right? So the vendor has like, you know, completed the work, the buyer has approved the work, and then we generate an invoice, right?

[22:25] Clark Stacer:
Right. And the invoice would include like, you know, the tasks and the subtasks that were completed, right? And like, you know, the amount for each task?

[22:33] Brian Hierholzer:
Exactly. And I think that, you know, the invoice should include like, you know, the line items for each task or subtask, and like, you know, the total amount. And I think that, you know, the invoice should be, you know, generated automatically once the work is approved.

[22:46] Clark Stacer:
Right. And so that ties into like, you know, the billing system, right? So the invoice gets generated, and then it's sent to the accounting system or the billing system.

[22:55] Brian Hierholzer:
Exactly. And I think that, you know, the invoice needs to be tied to like, you know, the engagement and the tasks. Right? So that way we have like, you know, full traceability and like, you know, audit trails. And I think that's important from like, you know, a compliance perspective.

[23:09] Clark Stacer:
Right, totally. Yeah, that makes sense.

[23:12] Brian Hierholzer:
OK, so I think we've, we've covered a lot of ground here. Let me just recap like, you know, what the core features are. We've got the engagement and task hierarchy. We've got the demand-side and supply-side views. We've got the task status transitions. We've got the task approval workflow. We've got the invoice generation. We've got the transparency center and the audit trails. Right? And I think that that's the core foundation for the marketplace.

[23:37] Clark Stacer:
Yep, that's great.

[23:39] Brian Hierholzer:
And then from there, we can like, you know, layer on like, you know, additional features or like, you know, more advanced features like like, you know, scope adjustments, like, you know, resource reallocation, like, you know, automated task generation, and stuff like that.

[23:56] Clark Stacer:
Yep, absolutely. That sounds great.

[23:58] Brian Hierholzer:
OK. So, you know, I think we're in a good place. So, you know, let me just summarize like, you know, the action items for you. So, you know, the primary action item is to implement like, you know, the engagement activity task, subtask hierarchy. And then, you know, from there, you need to layer on like, you know, the demand-side and supply-side visibility. And then, you know, after that, you know, we can then tackle like, you know, the task status transitions and like, you know, the progress indicators.

[24:25] Clark Stacer:
Got it.

[24:26] Brian Hierholzer:
And then, you know, from there, you know, we can tackle like, you know, the approval workflow and the invoice generation and the transparency center and audit trails. OK, so I think that's like the primary action items for the next sort of phase of development.

[24:42] Clark Stacer:
Yep, totally. And then we can, we can revisit this as we, we progress through the implementation.

[24:47] Brian Hierholzer:
Absolutely. Yeah, that's great. So, you know, I think we're in a really good place. So, you know, we've, we've got like, a really solid architecture for the engagement in the task system. And I think that, you know, this is going to be like, a really great foundation for the marketplace.

[25:04] Clark Stacer:
Yeah, absolutely.

[25:06] Brian Hierholzer:
So, you know, yeah, so let's talk about like, you know, what else we need to work on. Like, you know, are there any other features that, you know, that we need to prioritize?

[25:16] Clark Stacer:
So like, you know, I think like, you know, there's still like, you know, things like like, you know, the RFP flow and the engagement creation flow. Like, you know, we haven't like, you know, specified like, you know, the UI for those yet, right?

[25:27] Brian Hierholzer:
Yeah, right. So, you know, the engagement creation flow is like, you know, the buyer has to create a new engagement, right? They have to specify like, you know, the engagement outcomes, the engagement deliverables, the engagement timeline, the engagement success criteria, and then like, you know, the tasks and the subtasks, right?

[25:46] Clark Stacer:
Right.

[25:48] Brian Hierholzer:
And I think that, you know, that should be like, you know, a structured, you know, wizard-like flow. Like, you know, maybe with, you know, multiple steps, right? Like, you know, step one is engagement details, step two is requirements, step three is timeline, step four is like, you know, success criteria and deliverables and stuff like that.

[26:07] Clark Stacer:
Right. And then, you know, we need to like, you know, specify what the RFP flow looks like.

[26:12] Brian Hierholzer:
Yeah. So, you know, the RFP flow is like, you know, the buyer sends out an RFP, right? And then the vendors submit their responses, right? And then, you know, the buyer, the buyer can then like, you know, review the responses and like, you know, accept one of the responses. And that then creates an engagement, right?

[26:29] Clark Stacer:
Right. Got it.

[26:32] Brian Hierholzer:
So the RFP is kind of like a precursor to the engagement, right? It's like a stage where, you know, the buyer can solicit proposals from vendors. And once a proposal is accepted, that creates an engagement, right?

[26:46] Clark Stacer:
Yep, got it.

[26:48] Brian Hierholzer:
And I think we've already started the UI work on the RFP side. So, you know, maybe we can prioritize like, you know, completing the RFP flow and then like, you know, moving on to like, you know, the engagement creation flow. Right?

[27:02] Clark Stacer:
Yeah. Yeah. And like, you know, we need to like, you know, specify the fields for the RFP as well. Like, you know, what information does the buyer need to provide in the RFP, right?

[27:12] Brian Hierholzer:
Right. Yeah. So, you know, the RFP should include like, you know, the project overview, the scope of work, the deliverables, the timeline, the success criteria, the compliance requirements, the legal requirements, and the budget, right?

[27:29] Clark Stacer:
Right.

[27:31] Brian Hierholzer:
And I think that, you know, the RFP should also include like, you know, a section where vendors can add their proposal, right? Where they can respond to the requirements and like, you know, propose like, you know, their solution and like, you know, their timeline and like, you know, their pricing.

[27:48] Clark Stacer:
Right. And so the vendor response would then become like, you know, the tasks that need to be completed, right?

[27:56] Brian Hierholzer:
Exactly. Yeah. So, you know, when a vendor responds to an RFP, they're essentially, you know, breaking down the RFP requirements into like, you know, tasks that they can complete. And those tasks then become like, you know, the tasks in the engagement.

[28:10] Clark Stacer:
Right. Got it.

[28:12] Brian Hierholzer:
So, you know, I think the RFP flow and the engagement creation flow are, you know, are closely tied together. And I think that, you know, that's where like, you know, the marketplace starts, right? Like, you know, the buyer creates an RFP, vendors respond, and then once a vendor is selected, an engagement is created. And then, you know, the engagement is where like, you know, the actual work happens.

[28:32] Clark Stacer:
Right. Got it. So the RFP is like, you know, pre-engagement and then the engagement is where the work happens.

[28:38] Brian Hierholzer:
Exactly.

[28:40] Brian Hierholzer:
OK, so let's talk about like, you know, the next set of features. So, you know, I think we need to like, you know, focus on like, you know, the RFP flow, the engagement creation flow. And then, you know, after that, we need to like, you know, focus on like, you know, the engagement execution flow, which is like, you know, managing the tasks, the subtasks, the approvals, the invoicing, and stuff like that.

[29:02] Clark Stacer:
Right.

[29:04] Brian Hierholzer:
And I think that, you know, the third phase is like, you know, the observability and the audit trails and stuff like that.

[29:10] Clark Stacer:
Right. Got it.

[29:12] Brian Hierholzer:
And I think that, you know, that's a good way to like, you know, think about like, the phases of the marketplace.

[29:18] Clark Stacer:
Yep.

[29:20] Brian Hierholzer:
So, you know, phase one is RFP and engagement creation. Phase two is engagement execution. Phase three is observability and audit trails. OK, so I think that, you know, that's a good roadmap for the marketplace.

[29:36] Clark Stacer:
Yep, absolutely.

[29:38] Brian Hierholzer:
OK so before we wrap up here, I want to ask you. Like, you know, for the task creation flow, when we're creating tasks from the RFP or engagement creation, like, you know, what's the process? Like, you know, do we like, you know, automatically convert RFP requirements into tasks? Or do we like, you know, have the vendor, you know, sort of like, you know, respond to the RFP and then like, you know, propose the tasks?

[30:01] Clark Stacer:
Right. Well, I think that's like, you know, a really good question. Because like, you know, the RFP requirements are coming from the demand side, right? But like, you know, the tasks that get created are like, you know, the work that the vendor needs to do, right? So like, you know, I'm thinking like, you know, either the vendor proposes the task breakdown or like, you know, the demand side proposes it.

[30:24] Brian Hierholzer:
Right. Yeah. So I think that, you know, what makes sense is like, you know, the demand side provides like, you know, the requirements, and then, you know, the vendor provides like, you know, the task breakdown of how they're going to meet those requirements, right? And then, you know, once both parties agree, like, you know, the tasks are created in the engagement, right?

[30:44] Clark Stacer:
Right. Got it. So the vendor, the vendor response would be like, you know, saying like, I can meet your requirements with these tasks. And the timeline is like, you know, two weeks or whatever, right?

[30:53] Brian Hierholzer:
Exactly. And then, you know, the demand side, the demand side can then like, you know, review the vendor's proposal and like, you know, either accept it or request like, you know, changes, right? And if they request like, you know, changes, then, you know, it goes back to the vendor and like, you know, it's like a negotiation, right? Until both parties agree.

[31:08] Clark Stacer:
Right. Got it.

[31:10] Brian Hierholzer:
And then, you know, once both parties agree, like, you know, the engagement is created and the tasks are created from the vendor's task breakdown.

[31:20] Clark Stacer:
Right. Got it. So the vendor's task breakdown becomes the tasks in the engagement.

[31:27] Brian Hierholzer:
Exactly.

[31:29] Brian Hierholzer:
OK. So I think we've, we've covered like a lot of ground here. So, you know, the next phase is like, you know, RFP and engagement creation. And I think that, you know, after we complete that, we can then like, you know, move on to like, you know, the engagement execution phase. And then, you know, after that, we can like, you know, move on to like, you know, the observability phase.

[31:47] Clark Stacer:
Yep, got it.

[31:49] Brian Hierholzer:
So, you know, I think we're in a great place. And I think that, you know, this is going to be like, a really solid marketplace.

[31:57] Clark Stacer:
Yeah, absolutely.

[31:59] Brian Hierholzer:
OK. So, you know, one more thing I want to talk about is like, you know, the scope adjustments. Like, you know, if during the engagement, you know, the demand side wants to like, you know, add more work or like, you know, reduce the scope, like, you know, how do we handle that? And I think that, you know, we need a process for that. Right?

[32:19] Clark Stacer:
Right. Yeah, that's, that's a good point. So it's like, you know, the demand side can request a scope change, like, you know, add a task or remove a task or like, you know, modify an existing task. And then, you know, the vendor can respond with like, you know, updated estimates and pricing, and then like, you know, both parties can agree on the new scope.

[32:37] Brian Hierholzer:
Exactly. And I think that, you know, the change history needs to be maintained, right? Like, you know, we need to like, you know, audit trail of like, you know, what was the original scope, what was the proposed scope change, and like, you know, what was the final scope that was agreed upon, right?

[32:51] Clark Stacer:
Right. That makes sense.

[32:53] Brian Hierholzer:
And I think that, you know, the scope change should also be like, you know, a formal process, right? Like, you know, we need to like, you know, have like, you know, a scope change request that the demand side can submit, and then the vendor can review and respond with like, you know, updated estimates.

[33:09] Clark Stacer:
Right. Got it. So it's like, you know, a formal change request process that's auditable.

[33:16] Brian Hierholzer:
Exactly. And I think that's important because, you know, we need to like, you know, maintain the integrity of the engagement and like, you know, make sure that both parties are aligned, right? Like, you know, there shouldn't be like, you know, any sort of like, you know, scope creep where like, you know, the vendor is doing more work than they agreed to. Or where like, you know, the demand side is like, you know, expecting more than they agreed to pay for.

[33:36] Clark Stacer:
Right. Totally. Yeah, that makes sense.

[33:39] Brian Hierholzer:
OK. So I think that, you know, covers like, you know, most of the core requirements for the marketplace. So let me just recap like, you know, the phases. Phase one is RFP and engagement creation. Phase two is engagement execution. Phase three is observability and audit trails. And then, you know, we have like, you know, scope adjustment as like, you know, a core feature across all phases.

[33:58] Clark Stacer:
Right. Got it.

[34:00] Brian Hierholzer:
And I think that, you know, that's a solid roadmap. And I think that, you know, we're in a really good place to like, you know, start implementing these features.

[34:10] Clark Stacer:
Yeah, absolutely.

[34:12] Brian Hierholzer:
So, I think, you know, we're ready to, you know, to move forward with the implementation.

[34:18] Clark Stacer:
Great. Yeah, I'm excited to get started.

[34:20] Brian Hierholzer:
OK. So, you know, once we complete the current set of work, I think we should like, you know, maybe start laying the groundwork for like, you know, the RFP flow. Like, you know, maybe we can sketch out like, you know, the schema and the component structure for the RFP flow. And then, you know, from there, we can like, you know, start implementing the flow.

[34:40] Clark Stacer:
Right. Yeah. Let me like, you know, let me sketch out like, you know, the engagement activity task subtask hierarchy first. And then, you know, from there, we can like, you know, work on the RFP flow. And then, you know, we can work on like, you know, the other phases.

[34:58] Brian Hierholzer:
Exactly. Yeah. That's a good approach. Build the foundation first, and then, you know, build the features on top of it. And I think that's, you know, the key to like, you know, building a solid marketplace.

[35:11] Clark Stacer:
Yep, definitely.

[35:14] Brian Hierholzer:
OK. So, you know, I think we have a really solid plan here. And I think that, you know, this is going to be like, a really great foundation for the marketplace. So, you know, let me just make sure that I, I understand your approach. So, you're going to like, you know, lay the groundwork for the engagement activity task subtask hierarchy. And then, you know, from there, you're going to like, you know, work on like, you know, the demand-side and supply-side visibility. And then from there, you're going to layer on the other features?

[35:38] Clark Stacer:
Exactly, yeah. And then we'll revisit and see what else needs to be done.

[35:43] Brian Hierholzer:
Perfect. OK, so I think this is, you know, this is good. This is a good plan. And I think that, you know, we should, you know, we should be in a position to like, you know, execute on this in the next phase of development. So, you know, as we progress, you know, we can like, you know, adjust as needed. And I think that's, you know, important because, you know, we may discover things as we're building, right? And we may need to like, you know, adjust the plan accordingly.

[36:04] Clark Stacer:
Yep, totally. And I think as we build, we might find like you know, additional requirements that come up. So we should, you know, kind of keep this as a living document.

[36:14] Brian Hierholzer:
Yes, exactly. And I think, you know, that's where like, you know, the project meetings come in. Like, you know, we have regular project meetings, and those project meetings might surface like, you know, additional requirements or like, you know, changes to the existing requirements. And I think that, you know, all of that needs to be captured in like, you know, a living document.

[36:34] Clark Stacer:
Yeah, totally. So it would be a project notes document or something. Yeah.

[36:39] Brian Hierholzer:
Yeah, exactly. So we can document like, you know, the meeting outcomes and like, you know, the decisions that were made. And that helps like, you know, inform the implementation. And I think that, you know, that's important because, you know, everyone's on the same page, right? Like, you know, everyone knows like, you know, what the decisions were and like, you know, what the direction is.

[36:57] Clark Stacer:
Exactly. And that documentation becomes like, you know, a reference for future work. Like, you know, if someone needs to pick up where we left off, they can, you know, refer to this documentation.

[37:08] Brian Hierholzer:
Exactly. Yeah. OK, so I think, you know, we have a really solid plan. So, you know, let me just summarize the key things here. So, we've got the engagement-activity-task-subtask hierarchy. We've got the demand-side and supply-side visibility filtering. We've got the task status transitions. We've got the approval workflow. We've got the invoice generation. We've got the transparency center and audit trails. We've got the scope adjustment process. And we've got like, the RFP flow and the engagement creation flow.

[37:38] Clark Stacer:
Yep.

[37:39] Brian Hierholzer:
And I think that, you know, that is like, the core features of the marketplace. So, you know, once we complete these core features, then we can like, you know, think about like, you know, more advanced features, like, you know, automated task generation, like, you know, resource reallocation, like, you know, vendor recommendations, and stuff like that. But I think that, you know, the core features are, you know, the foundation that we need to build first.

[38:01] Clark Stacer:
Yep, absolutely.

[38:03] Brian Hierholzer:
OK so I think we're in a really good place. So, you know, I'm going to, I'm going to make sure like, you know, once I have some time, I'm going to like, you know, document like, you know, the RFP flow and the engagement creation flow. And then, you know, I can like, you know, hand those off to you. And then, you know, you can start like, you know, working on like, you know, the UI and like, you know, the implementation.

[38:22] Clark Stacer:
Perfect. That sounds great.

[38:24] Brian Hierholzer:
OK. So, I think we're ready. So, you know, once we finish up with like, you know, the current set of features, we can then like, you know, tackle like, you know, the next phase. And I think that, you know, we're in a great position to like, you know, start implementing these features.

[38:42] Clark Stacer:
Yeah, absolutely. I'm excited about this.

[38:45] Brian Hierholzer:
OK so let me, let me summarize what we've discussed. So the core requirement is that we have a marketplace for subject matter experts and tasks. And we need a robust engagement model that captures like, the full lifecycle of an engagement from like, proposal to completion. And we need visibility into like, the demand side and the supply side. And we need to maintain the audit trail. And we need to be able to track like, compliance and security requirements.

[39:10] Clark Stacer:
Yep.

[39:12] Brian Hierholzer:
Yeah, and so the key architecture is that we have an engagement, which contains multiple activities. And each activity contains multiple tasks. And each task can contain multiple subtasks. And we have a two-sided view where the demand side sees like, the explicit requirements, and the supply side sees like, the requirements and how they're going to meet them. And there's a transparency center where both parties can see like, the audit trail of all the tasks.

[39:40] Clark Stacer:
Right, got it.

[39:42] Brian Hierholzer:
And I think that, you know, this is going to be like, a really solid foundation for the marketplace.

[39:49] Clark Stacer:
Yeah, absolutely.

[39:51] Brian Hierholzer:
OK so I think we've covered like, a lot of ground here, and I think we're in a great position. So, you know, let me just make sure like, you know, the action items are clear. So, you're going to like, build the engagement, activity, task, subtask hierarchy. And then, you know, you're going to layer on like, the demand-side and supply-side visibility. And then, you know, you're going to layer on like, the task status transitions. And then, you know, we'll tackle like, the approval workflow, the invoice generation, the transparency center and audit trails.

[40:21] Clark Stacer:
Yep, got it.

[40:23] Brian Hierholzer:
OK, well I know that there's a lot for today there, so I'm going to as soon as I get a chance, I'm going to document like, the RFP flow and engagement creation flow for you. And then we can iterate from there.

[40:34] Clark Stacer:
Perfect. All right. Thank you, Brian.

[40:36] Brian Hierholzer:
OK bud, greatly appreciate it. Thanks for your time.

[40:43] Clark Stacer:
Likewise, take it easy. All right, bye now.

[40:48] Brian Hierholzer:
Okay, we'll see you. Bye-bye.
