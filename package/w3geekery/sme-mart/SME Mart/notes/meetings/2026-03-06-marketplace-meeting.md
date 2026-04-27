# Marketplace Meeting — 2026-03-06

## Meeting Summary

**Date:** 2026-03-06 (Friday)
**Duration:** ~12 minutes
**Participants:** Brian Hierholzer (CEO), Clark Stacer (Frontend Dev)
**Meeting Type:** 1:1 — Architecture alignment & taxonomy follow-up

### Topics Discussed

- **Engagement/Project taxonomy confirmation** — Confirmed the hierarchy discussed in Slack earlier: Engagement (corp-to-corp) wraps Projects (scoped work). Brian validated the model and gave a high five.

- **Kevin's platform perspective on Project entity** — Clark relayed Kevin's feedback: owner is a principal (org or user), Project is "a bunch of related resources" (boards, timelines, files, calendar events), vendors are realized as Orgs, service offerings as Boundaries.

- **Project plugin vision** — Brian described a "project plugin" concept: a templating system that packages MCP skills, document parsers, and task templates into a single plugin. Users would spin up AI, load the project plugin, answer a questionnaire, and auto-generate a fully structured project with typed tasks/subtasks.

- **Old world vs. new world support** — Two paths: (1) Near-term: LLM/MCP skill ingests legacy documents (PDFs, Word docs, ZIP files) and decomposes them into project structure. (2) Future: Native project plugin where users build projects from scratch with AI assistance using templates.

- **CDPH RFP as gold standard** — Brian confirmed using the California RFP documents as the reference for building out both engagement-level requirements (corporate checks, D&B, banking) and project-level requirements (task/subtask decomposition).

- **Supply-side profile preloading** — Vendors load their corporate docs, banking references, background checks, D&B info once. Then for each new project bid, it's all pre-filled — "programmatic buy, sell."

- **Distributor/reseller go-to-market** — Distributors and resellers will go into buy-side companies, help modernize procurement processes using ZeroBias, and potentially offer "agentic procurement services" using ZeroBias as the delivery method.

- **Platform blockers and pressure** — Clark has hit 4-5 platform blocks but is staying productive. Brian sees this as valuable: creating real-world demand drives backend velocity from Kevin/Chris. Catalin's hosted MCP work will also unlock faster iteration.

### Key Decisions

1. **Project plugin architecture** — Projects should be built via a plugin that bundles MCP skills, document parsers, task type templates, and questionnaire flows. The plugin is the delivery mechanism for both AI-assisted and manual project creation.
2. **Dual-path document ingestion** — Support legacy docs (PDF/Word/ZIP → AI decomposition) AND native structured project creation via plugin templates.
3. **CDPH RFP confirmed as reference implementation** — Use it to build out engagement-level requirements and project-level task decomposition patterns.

### Action Items

| # | Owner | Action | Due/Priority | Context |
|---|-------|--------|-------------|---------|
| 1 | Clark | Use CDPH RFP to build out engagement-level AND project-level requirements model | High | Gold standard for both levels — corporate requirements (engagement) + task decomposition (project) |
| 2 | Clark | Design LLM/MCP skill for document-to-project decomposition | Medium | Phase 1: JSON API upload. Phase 2: MCP skill (once Catalin's hosted MCP is ready) |
| 3 | Clark | Continue filing ZB platform feature requests as blocks are hit | Ongoing | Creates demand-side pressure for backend velocity |

### Open Questions / Unresolved

- How exactly will the "project plugin" be packaged? (MCP + skills + parsers + templates — compilation format TBD)
- When will Catalin's hosted MCP server be available for skill integration?
- Specific structure of the supply-side "pre-loaded vendor profile" that auto-fills engagement requirements

### Key Quotes

> "Ideally what we're creating is basically a templating system that allows the AI to essentially build out these projects really quickly, including the tasks and subtasks." — Brian

> "A plugin should include the MCP and the skills and the documents and the whatever. It's just like a big plugin that has all of these things in it." — Brian

> "The most important thing is that we build for the new world, but we support the old world." — Brian

> "Programmatic buy, sell." — Brian (on pre-loaded vendor/buyer profiles automating engagement setup)

> "We need to create the real world. That's exactly why we're doing this." — Brian (on Clark/Dan/Joe pushing demand that drives platform development)

---

## Cleaned Transcript

[0:00] **Clark:** That was super helpful.

[0:13] **Clark:** I checked in with Kevin about the vendor/provider concept. He said a service/product offering in the catalog is realized by a Boundary, same way a vendor is realized by an Org. He didn't quite answer my question directly, but the owner will be a principal — either an org or a user. So there might be a different concept in SME Mart for the owner of a project. Actually no, that would still be just whoever the org or user is.

[1:01] **Brian:** It's the org or the lead of the project within the org. So there's a project owner that's going to create a project, and then they're going to start assembling the project components. All of the requirements — high-level project, lower-level task-level stuff. Ideally what we're creating is basically a templating system that allows the AI to essentially build out these projects really quickly, including the tasks and subtasks. Does that make sense?

[1:36] **Brian:** I could see us having a project plugin that says: here are all the components of a project, here's the task templates, here's the subtask templates, here's the types of tasks — all of the legal, all of the security, all the compliance, all the functional. So we have this really good plugin for projects. They spin up their AI and say "I'm going to start a project," great, grab the project plugin.

[2:10] **Brian:** Enter the questionnaire and all these things and then boom, it creates these projects. Rather than creating RFP templates like California did, it's a project template using AI based on our project plugin. It's very programmatic and it just shoots right into the project templates using this project plugin.

[2:39] **Clark:** In the short term, while we're waiting for everybody to modernize, I'm planning on there being an LLM prompt or an MCP skill that will take a PDF or a Word doc or a ZIP file like that ZIP file you sent me and basically tear it all to pieces and make a project out of it.

[3:06] **Brian:** That's exactly it. You're able to support the old world and then you build a template that allows us to support the new world — a project plugin. They can go into Claude, see a project plugin and boom, the thing's ready. "What's your project today? What do you want to do? Let's start." And here are all the things to build a very fast iterative project template with all the tasks, the task types available.

[3:42] **Brian:** If you already have an RFP, pull those documents into this and then that thing disassembles and breaks it down and jams it into the plugin template using the plugin. The plugin could even have support for those documents. Grab the documents and add them into the plugin. If it's in notes, if it's in documents, if it's in a PDF — whatever it is, we'll jam that thing in here and automagically fill out this thing using the project plugin.

[4:36] **Clark:** As phase one, they could let their LLM create a JSON document based on all their input and then use API endpoints to upload it into SME Mart and create their project that way. Next step would be once Catalin's done with the hosted MCP server, that could have a skill that says "create project from RFP."

[5:08] **Brian:** The plugin should include the MCP and the skills and the documents and the whatever. The plugin eats the MCP, eats the skills, eats those document parsers — it's just like a big plugin that has all of these things in it depending on what's needed, available from the demand side.

[5:43] **Clark:** With that thought in mind, I can be working on using this current RFP that we got as the gold standard.

[5:56] **Brian:** I think it's a perfect starting point because even in there at the engagement level, there were corporate requirements — what's your history, how long have you been here — that's the engagement requirement stuff.

[6:10] **Clark:** The bid has to include all of that stuff. Before they can even consider it, they have to check these boxes.

[6:22] **Brian:** On the supply side, to counter this — I get to load my vendor stuff one time. I have all my corporate docs, all my banking references, all my background checks, all my D&B. It's all there. So everything is loaded one time and you're done and you can just get right into the project stuff. You don't have to rebid or reload your stuff for every single person you're trying to sell to. Same thing on the buy side — it's fully automated.

[7:08] **Clark:** It'll pre-fill out like 90% of it. It's going to be the same thing every time.

[7:11] **Brian:** Programmatic. Programmatic buy, sell.

[7:21] **Clark:** Having the agentic part of it will be pretty key to help these old-school guys get their stuff modernized. We have to be able to support the old Word doc and Excel spreadsheet.

[7:41] **Brian:** The most important thing is that we build for the new world, but we support the old world. Our distributors and resellers — they're the ones that are going to go into the buy-side companies and say "We're going to help you modernize your entire procurement process." They're going to potentially do procurement services. "We're gonna take all your RFPs and put it into ZeroBias, into a mechanized project management template, use AI to do this, show you how to do this yourself for training. Or we could just run this for you because we're a modern shop and we're just gonna do an agentic procurement service using ZeroBias as the method of delivery."

[8:48] **Clark:** This has been helpful — every single day there's some huge piece that I get and it's really helpful in pivoting and helping this thing fill out.

[9:05] **Brian:** I think you're getting clarity on what this really is.

[9:14] **Clark:** I've been biting Kevin's heels constantly. I've hit four or five blocks that are ahead of the curve for what the backend is able to support.

[9:30] **Brian:** That's exactly what we need to do — create the real world. That's why we're doing this. You, Dan, Joe, and hopefully more. I'm hoping with the Catalin work, it allows them to react faster and you to create the demand faster.

[10:17] **Brian:** We can't sit on a call and interview and ask questions. If you're a developer and you can explicitly say "here's the schema, these are the extensions, here's the UI, here's my use case" — all of that detail becomes very clear. I'm hoping you can trap all those demand-side things at the backend you need. That's what I'm trying to help you do — create a very programmatic way to explicitly state what you need off the backend and why. It provides all of the supporting documentation, UI, and the user story to support it.

[10:58] **Clark:** I've been collecting feature requests as I go and creating ZeroBias feature request tasks for Chris or Kevin. As soon as these guys are done with this exercise and can turn back to doing features, I think we'll see velocity really quick.

[11:31] **Brian:** I know that one unlocks the other. We got to get this done — the core stuff.

[11:48] **Brian:** Awesome. I'll shoot you the transcript once it builds and we're good.

[11:53] **Clark:** All right, brother. Thank you. Have a great weekend.
