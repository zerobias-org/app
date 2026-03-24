# Marketplace Meeting Summary #2

**Date:** Feb 2026 (late Feb, post-vacation)
**Duration:** ~32 minutes
**Participants:** Brian Hierholzer, Clark Stacer
**Source:** `Marketplace--Meeting Transcript.docx`

---

## Cleaned Transcript

[0:00] Clark: We need to figure out a system for this — we can have meetings set up to automatically dump the transcript into a folder like a OneDrive folder.

[0:14] Brian: Yeah, or we could use Otter or Firefly. We need to formalize this.

[0:28] Brian: Back to the swarm — the parent task has its own subtasks, and that's almost like a planner agent. Is that a project lead? And then these other tasks with their own subtasks — is this a swarm construct? Do we study agentic orchestration nomenclature around these?

[0:48] Brian: The parent agents or managing agents — are they product management agents versus PMO agents? I don't know what these are that orchestrate other agents and their sub-agents. Is Anthropic the only one using "swarms" or is everybody else using "AI agent orchestration"? We need to figure that out.

[2:04] Brian: I was going to build my own personal assistant with Claude and Obsidian Vault. Are you familiar with it?

[2:21] Clark: Never heard of it.

[2:50] Brian: It pulls from all kinds of different stuff — your own personal graph with documents and notes. It pulls from your notes on your Mac or phone, aggregating disparate pieces, cataloging and structuring them. And there's Basecamp and other project management tools. I don't want to reinvent PM tools too much, but they're going to be reimagined. Someone could build that within the platform — like if they're a PMO type, they could reimagine a project management space and put it right into the marketplace, fully integrated into SME Mart.

[4:07] Brian: I'm wondering if Obsidian Vault's approach of collating and aggregating data from disparate tools could help with plans — someone makes a voice recording while driving, dictates an idea, puts a note in. Getting all that together to pull into projects. Even taking this conversation and putting it into memory, linking to Obsidian Vault for reference.

[5:11] Clark: I'm installing it now. This is right up our alley. If I'm building out a notes interface, this could be used in the platform and tie into our GraphQL database.

[5:30] Brian: Yeah, you might just build your own little Obsidian toolkit. Anyway, back to the UI — go ahead.

[5:42] Clark: Just continuing to make progress. Connecting up with Joe was interesting. It's not clear exactly what we're doing in the short term together because we're wanting the same thing — the ability to modify the schema of the user profile in the platform.

[6:20] Brian: This is where I'm hoping that new toolkit with Neon allows you to fork or build your own branch and build out a schema extension. Then hand it back to Kevin and say this is how I extended the schema and we'd like it to support these properties. You're building an app on your own, but 99% chance this goes into core.

[6:59] Brian: There's going to be the ability for people to extend the schema for all sorts of reasons. Some directly into our schema, or proprietary stuff they want to hide — they still want to extend our schema to put their schema on top for their own things they'll monetize when they publish their app or service.

[7:29] Brian: How are you able to grab our schema and extend it right now?

[7:40] Clark: Right now that's not possible. I'm getting around it by using the platform's user profile as the base, and any extensions go into a Neon database. At whatever point we merge into core, I'll hand over the schema.

[8:08] Brian: OK, so you took our base schema and you're extending it. You are doing it the way we see others doing it.

[8:20] Clark: Eventually that might look like creating a fork of the ZeroBias schema in Neon, but that's not what I'm doing right now.

[8:38] Brian: That's a use case we want to support — here's the schema, create a fork and go run. I don't know how we'd enable our schema to be forked on the third party's dime with their own account.

[9:02] Brian: For now I want to make sure it works quickly — spin up from our own schema to enable rapid prototyping. There may be a charge component or it's "bring your own account."

[9:25] Clark: Joe mentioned he wanted the Credly credential check to be a platform thing. He wanted assessments to be a platform thing. Do I have the go-ahead to make plans to have him hand that over to me into SME Mart, or should that be totally separate integration projects?

[9:58] Brian: We need to figure out how — here's my comment: Credly or 50 different types of Credly's we want to support. He builds a Credly integration, it gets cataloged, then it's supported from a cataloged integration standpoint. I'm hoping that people can build connectors really quick and get them into the catalog. Anything you touch, like Neon, has to be integrated — you're using it, but it's not integrated yet, not understood.

[11:14] Brian: Any sort of Credly-esque system, background check system, or government ID system — these are things we want to add. Some sort of credentialing. If I walk into one hospital it's one credential system, a school is another. There are a million credentialing systems we'll have to integrate to say "here's my team and these are all our certifications and credentials." To me that's core — enhancing the user profile. But it's not core until somebody integrates it and the schema is extended to support their schema.

[12:07] Clark: There's got to be one prototype first, then it can be expanded upon to make it generic for other kinds.

[12:25] Brian: Correct. Now we say we support Credly #1, #2, #3. Somebody has to prototype first. That's what the Guild is — all of our customers and partners integrating to different things because everybody's stack is different. We need them to do it fast, integrate it, and it's fully understood. Then: from a user profile perspective, do I add these now that we understand what Credly is? It's a credentialing system. Choose your credentialing system — it's integrated and they're using Credly.

[12:59] Clark: OK, I see. Maybe I can ask Joe to have his LLM spit out a model of his Credly system.

[13:10] Brian: He already has a Credly account. We'd need to build the integration, but I want him to do it. We'll extend our schema — in SME Mart whether you're in SME Mart or just an org, we need to be able to trap credentials at the org level.

[13:51] Brian: I'm going to go out there and build 3 different integrations to support government ID — like facial scans on the app. Clark, you're a user on my team with five teammates, we're using Credly to push credentials into our company profile. We want to show all our creds. And by the way, these guys all have background checks and full ID upload to government ID that validates they are who they say they are.

[14:50] Brian: So there's a background check. Are you familiar with the LinkedIn ones or banking apps where you do facial recognition? I want that too — facial capture with government ID, passport or driver's license, and background check. All of that is coming. That's just credentialing — higher level credentialing. If we're selling into the government, there may be a DoD top secret credential system. We're going to have to talk to lots of different credentialing systems.

[15:55] Brian: We may pick one that does the government ID facial recognition capture. If somebody wants a different one, they build a connector. We may default with one out-of-the-box.

[16:08] Brian: Credentialing is a big bucket. We want to be the agentic marketplace — not for toys, but for mature, heavily regulated companies to buy and sell.

[16:44] Brian: This is going to be audited real time, background checks for everybody registered, government IDs, entire credential sets. How do they get rid of all friction? The government says they need DevSecOps guys with clearance level X and certifications of Y.

[17:03] Brian: Back to what Joe was saying — there should be a matching system. I have DevSecOps, I'm a government agency, I need people through the marketplace with government ID, background checks, and security clearance level X. That's a query — then 50 or 500 people or companies are returned. These are the 10 or 20 companies that provide these services, and this one has 15 people that meet the clearance level.

[17:47] Brian: That would all be credentials matching — not only the vertical, but people-level credentials of clearance and certifications.

[17:59] Clark: Yeah, so the scope is pretty big.

[18:20] Brian: Well, let's say we need 3 integrations: one to Credly, one to a government clearance system, and one that does facial recognition tied to your government ID. It's not that bad. But you could sort by that, search by that.

[18:38] Brian: You could search and say "I need DevSecOps but these are my credential requirements." Do you need background checks? Default yes for everybody. Government ID registration and validation? Yes. Certification levels of X. That's part of the search — only people with these skills, credentials, and clearances. Boom.

[19:17] Clark: I was looking at login.gov. That's the service where you have your ID, a picture, a selfie — they do all the verification.

[19:30] Brian: Yeah, I don't know what platform is underneath it. There are several that do that. I think that's all W3C credentialing and government Real ID type stuff — passport, or the states that have Real ID.

[20:04] Brian: We'd just pick one and integrate to it as a start. I was asking this morning when I can get started — I want to go into government credentialing and start building profiles for talent with background check, credentialing capabilities. Joe already hit Credly, but I want the government ID facial recognition validation. That's critical.

[20:37] Brian: That may be at the project level — I'm having an engagement with certain criteria, company to company or government to company, and they have to have XYZ. For this project I need clearance level X, for this one clearance level Y. Two projects with different clearance requirements. U.S. citizen on U.S. soil — is this person from out of the country?

[22:24] Clark: So should I be adding that to the SME Mart roadmap?

[22:40] Brian: I would say that is an org-level extension that feeds into the SME Mart matching process. I'll call it the "matching OS."

[22:56] Clark: OK, so that's like a separate project.

[22:57] Brian: That's an org-level and user-level profile buildout of team members and their credentials. We would need to extend the org based on the ability for SME Mart to do this matching process.

[23:17] Clark: So in the governance app under the org there would be tools for credential management.

[23:26] Brian: Yes. You build out credentials at individual users to build their profiles. That feeds from the org into SME Mart, should they want to declare those credentials. They may want to make them anonymous — just show "we have headcount with these credentials, not telling you names, but we have these credentials within our team."

[24:00] Clark: An auditor could look and see the organization has credentials for employees, for proof.

[24:13] Brian: Background checks on everybody. Government ID. That serves the org for compliance internally, and of course serves SME Mart with procurement.

[24:41] Clark: You mentioned a separate billing app.

[24:48] Brian: Keep in mind that everything ZeroBias does, every engagement we're going to take a cut on. Every project that goes active, likely at the task level — there's going to be billing mechanisms at the task. One task has one billing structure, a different task has a different billing structure.

[25:25] Brian: One task is legal compliance validation — metered rate, every legal review of requirements is 1 cent. Another task creates videos — that's a functional output. That task may bill $0.15 per second, and however many seconds you create per day gets billed daily. Different billing component. We need a mechanism to trap these different billing structures where ZeroBias gets a percentage of all bills.

[26:28] Brian: A task may be the billing mechanism itself. There may be a task that's nothing but a billing engine across these different functional outputs. Or the functional output has its own billing subtask.

[26:46] Brian: I create videos, there's a legal subtask for the video, then a billing subtask that totals the amount of videos generated every day, multiplies by X cents, creates a daily total. That aggregates to the project. The project sees all tasks and all billing subtasks.

[27:37] Brian: There may be 50 different tasks running within a project, each with billing extracts that give daily totals. 50 different billable tasks with different billable methods.

[27:53] Brian: The project summary would say "your cost as buyer today across all 50 tasks was $500" with an itemized breakdown. What ZB does — our rule is 3% across all project billing. ZB gets 3% of whatever dollars exchanged. We're the brokerage.

[29:14] Brian: Or it could be hours — just like you. You're a contractor, I've outsourced to you. You have a project building SME Mart with all these different tasks. The aggregate is an hourly rate across all tasks. W3 Geekery should be in SME Mart — you're a product management consultant who builds platform products, your hourly rate is X. We put an engagement together, get your tax information, create a project called SME Mart, and this thing tracks 50 different tasks. All history, context, work, and GitHub repos trapped in the task system.

[30:27] Brian: The hours per task should aggregate into daily, weekly, and monthly totals. Then we settle and ZeroBias takes 3% of the transaction fee.

[30:59] Brian: W3 Geekery is in there. What does W3 Geekery do? Who are you? What are your credentials? You're a full stack guy, you build agentic products using AI, your expertise is marketplaces for transactions involving AI orchestration, compliance, billing, project management.

[31:34] Clark: OK, awesome. Claude will be very helpful in aggregating all of this into the current plan and telling me what we're missing.

[31:54] Brian: Yeah, the rabbit hole just keeps getting deeper.

[32:03] Clark: Or new rabbit holes open up. That's OK, that's good.

[32:09] Brian: OK, when we stop this am I going to have to download and send the transcription like last time? I'll do that.

[32:21] Clark: OK, great. Whenever you get to it. Thanks, Brian. Have a good weekend. Bye.

---

## Topics Discussed

- **Agentic orchestration nomenclature** — Swarms vs. agentic orchestration vs. agent hierarchy. Need to study industry vocabulary for parent/managing agents, PMO agents, sub-agents. Is "swarm" Anthropic-specific or industry-standard?
- **Obsidian Vault & knowledge aggregation** — Brian's interest in Obsidian Vault for personal assistant use; relevance to SME Mart notes feature and aggregating disparate knowledge sources (voice memos, articles, notes) into projects
- **Schema extension model** — How third-party devs extend ZeroBias schema. Clark currently extending into Neon DB as workaround. Vision: fork the ZeroBias schema, extend it, hand back for core ingestion. "Bring your own account" for hosting forks.
- **Credentialing system (major topic)** — Three tiers: (1) professional credentials via Credly, (2) government ID + facial recognition validation (login.gov, ID.me), (3) background checks & security clearances (DoD). Joe already has Credly work. Brian wants all three integrated as connectors in the catalog.
- **Credentialing is org-level, not SME Mart-level** — Credentials live at the org/user profile level in the governance app, then feed into SME Mart's matching system. SME Mart consumes, doesn't own.
- **Matching OS** — The query system that matches demand (buyer requirements: DevSecOps + clearance X + background checks) against supply (provider teams with declared credentials). Credentials are a key filter dimension.
- **Billing architecture (major topic)** — Task-level billing with heterogeneous billing methods: metered (per-action), time-based (hourly), output-based (per-second of video). Billing subtasks per task. Project-level aggregation into daily/weekly/monthly summaries. ZeroBias takes ~3% transaction fee as the brokerage.
- **W3 Geekery as exemplar** — Brian described W3 Geekery/Clark's engagement with ZeroBias as a concrete example of the SME Mart model: provider profile, credential set, hourly billing, project-level tracking.

## Key Decisions

1. **Credentialing is an org-level extension, not SME Mart** — Credentials live at org/user profile level in the governance app. SME Mart consumes credential data for matching. Separate project from SME Mart roadmap.
2. **Joe should build the Credly connector** — Brian wants Joe to do the integration and hand it to the catalog, not Clark. Clark's role is to design the SME Mart UI that consumes it.
3. **Three credentialing integrations as starting scope** — Credly (professional certs), government ID + facial recognition (login.gov/ID.me), and background checks/clearances.
4. **Task-level billing with ZB 3% cut** — Each task can have its own billing structure (hourly, metered, per-output). ZeroBias takes ~3% of all transaction fees as the marketplace brokerage.
5. **Schema extension workflow** — Build in Neon as a fork, prototype, then hand back to core. Future: formalized schema forking capability for third-party devs.

## Action Items

| # | Owner | Action | Due/Priority | Context |
|---|-------|--------|-------------|---------|
| 1 | Clark | Research agentic orchestration nomenclature | Low | Swarm vs. orchestration vs. hierarchy — what's industry standard? |
| 2 | Clark | Explore Obsidian Vault for notes feature inspiration | Low | Brian installed it; relevant to knowledge aggregation in SME Mart |
| 3 | Clark | Feed transcript into plan and identify gaps | High | Aggregate this meeting's topics into the current PLAN.md |
| 4 | Joe | Build Credly connector integration | | Joe has a Credly account; build the connector for the catalog |
| 5 | Brian | Investigate government ID / facial recognition providers | | login.gov, ID.me — pick one for initial integration |
| 6 | TBD | Design org-level credential schema extension | | Extends user profile for credentials, background checks, government ID |
| 7 | TBD | Design the "Matching OS" query system | | Filter providers by credentials, clearance, certifications, location (US citizen requirement) |
| 8 | TBD | Design task-level billing structures | | Heterogeneous billing methods per task, billing subtasks, project-level aggregation |
| 9 | Brian | Set up transcript auto-dump workflow | Low | Currently manual download and send; needs OneDrive or Otter/Firefly integration |

## Open Questions

- What's the industry-standard nomenclature for AI agent hierarchies — swarm, orchestration, or something else?
- How will schema forking work for third-party devs? "Bring your own account" vs. ZB-hosted?
- Which government ID provider should be the first integration — login.gov or ID.me?
- Should credentials be anonymous by default in SME Mart (headcount + cert level, not names)?
- How does credential matching interact with project-level clearance requirements (different clearances per project within an engagement)?
- What's the billing subtask structure — one billing subtask per functional task, or a centralized billing task per project?
- What percentage does ZeroBias take as the brokerage — is 3% confirmed or placeholder?

## Key Quotes

> "We want to be the agentic marketplace, not for toys, but for mature, heavily regulated companies to buy and sell." — Brian

> "It's not core until somebody integrates it and the schema has been extended to support their schema." — Brian

> "I would say that is an org-level extension that feeds into the SME Mart matching process. I'll call it the matching OS." — Brian

> "The rabbit hole just keeps getting deeper." — Brian
> "Or new rabbit holes open up. That's OK, that's good." — Clark

> "W3 Geekery should be in SME Mart and you're a product management consultant and you build platform products." — Brian
