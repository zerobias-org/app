# Skill: SME Mart Slack Huddle Summarizer

> Companion to [sme-mart-meeting-summarizer.md](sme-mart-meeting-summarizer.md). Follows the same base template ([ms-teams-meeting-transcription-summarizer-template.md](ms-teams-meeting-transcription-summarizer-template.md)) — this file captures Slack-huddle-specific differences.

## Input Shapes

Slack huddle transcripts arrive in several forms — handle each:

1. **Pasted text** (`.txt` / `.md`) — Clark copies from Slack's "Transcript" panel. Typically:
   ```
   Brian Hierholzer  10:02 AM
   Yeah so the task partitions thing...

   Clark Stacer  10:03 AM
   Right, and the demand side would...
   ```
2. **Slack AI recap export** (`.md`) — already has "Key points" / "Action items" sections. Preserve them; don't re-summarize from scratch — merge with your own pass.
3. **`.vtt` from a screen recorder** (Loom, QuickTime + Whisper, etc.) — strip cue numbers and timestamp lines, keep speaker-tagged lines.

**No `.docx` extraction needed** — skip the Teams textutil/zipfile dance entirely for Slack inputs.

## Participant Identification

Slack huddles often use handles, not full names. Normalize:

| Slack handle / display name | Canonical |
|---|---|
| `@brian` / `Brian H` / `Brian Hierholzer` | Brian Hierholzer (CEO, w3geekery/ZeroBias) |
| `@clark` / `Clark S` / `clarky` | Clark Stacer (w3geekery contractor) |
| `@kevin` | Kevin (CIO — platform/Hub) |
| `@nic` | Nic (GQL) |
| `@dan` | Dan (SDI / Readiness Center — **not** Daniel) |

If an unknown handle appears, flag it in the summary and ask Clark who it is before finalizing.

## Project Context

Same as Teams meetings — SME Mart, Task partitions, Transparency Center, Boundaries, etc. See [sme-mart-meeting-summarizer.md](sme-mart-meeting-summarizer.md) for the full context block; don't duplicate here.

## Style Differences from Teams Meetings

Huddles tend to be:
- **Shorter** (10–30 min vs. 60 min)
- **More async** — people drop in/out, side threads in chat
- **Less structured** — no agenda, often a single topic
- **Decision-dense** — quick alignment calls rather than status updates

Summary format should reflect that:
- **One headline** instead of a topic list when the huddle covers one thing
- **Inline chat references** if Clark pastes chat alongside transcript (`@brian: "..."` in chat vs spoken)
- **Shorter action items section** — often 0–2 items

## Planning/Questions Doc Mapping

**If Clark mentions the huddle maps to a planning or questions doc** (e.g., "these are answers to `.claude/notes/plans/brian-meeting-questions.md`"), **read that doc first** and structure the summary as answers to its numbered questions.

- Each question in the doc gets a heading in the summary (e.g., `### A1. Workspace Portfolio — UI view`)
- For each, state the decision, cite a direct quote if available, and flag any inferred/implied answers (don't promote implication to confirmation)
- Group unanswered questions under `## Still Open` with their original section refs so they carry forward to the next meeting
- Add action items derived from decisions that shift planning-doc status (schema changes, seeder updates, stub fields, etc.)

This pattern turns the summary into a working document that maps the conversation to pending decisions, rather than generic meeting minutes.

## Output

- **Filename:** `YYYY-MM-DD-slack-huddle-<topic-slug>.md` (e.g. `2026-04-20-slack-huddle-task-partitions.md`)
- **Location:** same as Teams — primary `~/.claude/timetracker/meetings/`, secondary `.claude/notes/meetings/`
- **Header:** include `**Source:** Slack Huddle` and participants list; include `**Time:** HH:MM–HH:MM PT` if known from timer.

## Timer Note Heading

When updating the tt timer via `mcp__tt__update_timer`, use:

```
### Slack Huddle w/ <primary participant(s)>
- Decision or topic 1
- Decision or topic 2
- Action item
```

Distinct from Teams meetings (`### Meeting w/ Brian`) so `/tt:backfill` and later review can tell them apart.
