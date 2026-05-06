# Marketplace Meeting — 2026-04-14

**Time:** 2:00 PM – 2:45 PM PT (21:00–21:45Z)
**Duration:** ~33 min (recorded)
**Participants:** Brian Hierholzer (CEO), Clark Stacer (W3Geekery)
**Meeting Type:** Review / Q&A — Brian answering the CE1–CE6 validation questions Clark sent via Slack 2026-04-13

---

## Topics Discussed

- **Home vs Linked Engagements (asymmetric)** — Brian confirms the primary/linked terminology. Primary = buyer+seller commerce. Linked/secondary = auditor aligned with buyer. Not many-to-many.
- **Standing engagements** — Plausible. MSA/background/banking at engagement level, commercial terms vary project-by-project.
- **Seller consent** — Baked into the transparency-system agreement, not per-request approval.
- **Private → Shared publishing + anonymity** — Anonymity is a **toggle**, buyer-configurable per linked engagement. Default/best-practice = anonymous.
- **3PAO specialty taxonomy** — Marketplace-curated directory + vendor-declared (like schema extensions). 3PAOs are "category #1."
- **Scope overlap & "bake-off" audits** — Buyer decides. Introduces **Cybersecurity SLA** as the arbitration contract.
- **Cybersecurity SLA (NEW concept)** — Assessor packages continuous-monitoring logic + legal terms + rights-to-cure periods; buyer subscribes; buyer imposes those terms on seller via primary engagement. Can include teeth (penalties, contractual outs).
- **Anonymity through remediation** — Findings + alerts + cure periods (30/60/90d) live in the shared transparency center; auditor stays anonymous, remediation flows through transparency center not direct seller↔auditor contact.
- **3PAO sourcing** — Both catalog AND bring-your-own. BYO 3PAOs must still register in SME Mart ("can't have them off the island") — private placement vs. open bid.
- **Partial boundary scope** — Both/and. Multi-party parallel assessment across different boundaries, different scopes within the same boundary — "and, and, and, and."
- **Auto-revoke on termination + nested transparency centers** — Mutual-handshake termination for primary engagement. Auditor revocation cascades across their pulled-in projects. Opens the nesting question: every project has its own transparency center, linked projects have linked transparency centers, auditor-buyer may have a **secondary** transparency center that publishes into the primary. Brian: *"how many layers of inception is this?"*

---

## Key Decisions

1. **Asymmetric engagement model confirmed.** Primary (buyer+seller commerce) + linked (secondary, usually auditor-buyer). Not peer many-to-many.
2. **Anonymity = toggle, buyer-controlled.** Per linked engagement. Default to anonymous for 0-bias purity but not enforced.
3. **3PAO directory is marketplace-curated + vendor-declared.** Accept community-declared specialties; SME Mart relabels or curates. 3PAOs as top category.
4. **BYO 3PAOs allowed but must register** in SME Mart (private placement flow).
5. **Partial scope is arbitrarily granular.** Boundary-level, sub-boundary/task-level, both. No restrictions.
6. **Cybersecurity SLA becomes a first-class concept** — packaged assessor IP imposed into primary-engagement contracts. Contains continuous monitoring logic + legal language + rights-to-cure + penalties.
7. **Termination cascades** — auditor revocation cascades across projects they were pulled into.
8. **Transparency centers are per-project** — each engaged party has their own; linked projects create linked transparency centers that publish into the primary.

---

## Action Items

| # | Owner | Action | Priority | Context |
|---|-------|--------|----------|---------|
| 1 | Clark | Update `.planning/research/external/2026-04-13-ceo-miro-cross-engagement-audit-model.md` — move the 6 open questions into a "Resolved" section with Brian's answers | High | Keeps research doc authoritative |
| 2 | Clark | Add **Cybersecurity SLA** as a new concept in the research doc + BACKLOG — likely a new plan (CE8?) | High | Net-new concept introduced this meeting |
| 3 | Clark | Refine CE1 plan to reflect asymmetric primary/linked + termination cascade + nested transparency centers | High | Core plan, blocks CE2–CE6 |
| 4 | Clark | Update CE2 (Selective Disclosure) — anonymity is a toggle per linked engagement, not per-party | Medium | Scope clarified |
| 5 | Clark | Update CE3 (Multi-3PAO scope) — confirm partial scope is both boundary-subset AND intra-boundary partition | Medium | Scope clarified |
| 6 | Clark | Update CE6 (Publish-to-Shared) — remediation flows through transparency center (alerts + rights-to-cure) | Medium | Scope clarified |
| 7 | Clark | Add backlog item for **nested transparency centers / linked projects** — projects can nest via parentId OR link across engagements via linked transparency centers | Medium | Per Brian's "inception" nesting observation |
| 8 | Clark | Keep iterating "down this path" — back up to simplify if complexity becomes unmanageable | Ongoing | Self-directed |

---

## Open Questions / Unresolved

- **Nested transparency centers depth** — how many levels of nesting are realistic? At what depth does the model break down?
- **Global/meta auditor role** — Clark raised: does someone need to see across all transparency centers?
- **Cybersecurity SLA packaging** — is this a new SME Mart entity type (reusable assessor template) or a free-form attachment to engagements?
- **Termination cascade granularity** — auditor revoked globally vs. project-by-project? Transcript suggests global revoke from that buyer's scope.

---

## Key Quotes

> "The primary engagement would be between the buyer and the seller. The assessor... they are in commerce with the buyer, but it is a secondary transaction." — Brian

> "The purest sense of a pure unbiased audit is that... the seller is not a party of the transaction or the engagement, but they are a party to the results of the auditor that... do not know who they are." — Brian

> "I think it's all of the above. I think this is in all of the above... it's an and, and, and, and, and." — Brian, on partial boundary scope

> "There is no project without its own transparency center also. So then you're going to have project and transparency center linked into a primary project and transparency center." — Brian

> "How many layers of inception is this, right?" — Brian

---

## Cybersecurity SLA (NEW)

Brian introduced this mid-meeting as the contractual mechanism for continuous monitoring:
- **Who:** Packaged by assessor, sold to buyer as subscription
- **What:** Assessment logic + legal terms + rights-to-cure language
- **How:** Buyer imposes these terms on seller via primary-engagement contract
- **Example:** $200/app × 5 apps = $1,000/mo assessor subscription with 30/60/90-day cure windows, penalties, contractual-out clauses
- **Why it matters:** It's the arbitration layer — when findings conflict or thresholds are breached, the SLA is authoritative

This likely becomes Plan **CE8: Cybersecurity SLA as First-Class Contract Template**.
