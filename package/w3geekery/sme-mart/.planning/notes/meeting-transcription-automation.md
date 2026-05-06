# Meeting Transcription Automation Research

> **TL;DR:** MS Teams has a free Graph API that can auto-fetch transcripts via webhook the moment a meeting ends — best path for SME Mart. Zoom works too (Pro+ only). Slack Huddles have no native API. Phased plan: (1) Build a Claude skill now that summarizes pasted transcripts and suggests Jira tasks, (2) wire up Teams webhook for auto-capture, (3) eventually bake into ZB platform as a Task Activity field.

**Date:** Feb 16, 2026
**Author:** Clark (via Claude research)
**Context:** Brian requested a workflow for capturing meeting transcriptions, summarizing them, and generating action items / ZeroBias tasks. This could eventually become a ZB Task "Activity" custom field.

---

## Goal

1. **Capture** meeting transcriptions (automated or manual)
2. **Summarize** via LLM — key topics, decisions, action items
3. **Generate artifacts** — Jira tasks, emails, docs, ZB task comments
4. **Long-term** — ZB Task Activity field for uploading transcriptions directly in-platform

---

## Platform API Capabilities

### Microsoft Teams (Primary — used for SME Mart meetings)

**Verdict: Fully automatable via Microsoft Graph API**

| Capability | API | Notes |
|-----------|-----|-------|
| Fetch transcript after meeting | `GET /communications/callRecords/{id}/transcripts` | Returns `.vtt` format |
| Webhook on transcript ready | Change notifications subscription | Get notified the moment transcript is available |
| AI meeting insights | Meeting Insights API | Returns notes, action items, participant mentions natively |
| Auto-transcribe setting | `PATCH /onlineMeetings/{id}` | Enable transcription programmatically per meeting |

**Key details:**
- As of Aug 2025, Microsoft **dropped charges** for transcript/recording Graph APIs (previously metered)
- Transcription works for scheduled meetings backed by calendar events
- Requires Azure AD app registration with appropriate permissions (`OnlineMeetingTranscript.Read.All`)
- Returns `.vtt` (WebVTT) format with timestamps and speaker identification

**Links:**
- [Transcript API Overview](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/meeting-transcripts/overview-transcripts)
- [Get callTranscript](https://learn.microsoft.com/en-us/graph/api/calltranscript-get?view=graph-rest-1.0)
- [Change Notifications for Transcripts](https://learn.microsoft.com/en-us/graph/teams-changenotifications-callrecording-and-calltranscript)
- [Meeting Insights API](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/meeting-transcripts/meeting-insights)

### Zoom

**Verdict: Automatable with limitations**

| Capability | API | Notes |
|-----------|-----|-------|
| Webhook on recording complete | `recording.completed` event | Includes `file_type: "TRANSCRIPT"` |
| Download transcript | Recording files API | `.vtt` format |

**Limitations:**
- Requires **Pro+ plan** (no free tier)
- Must use **cloud recording** (not local)
- Only **meeting host** can access transcript via API
- Requires OAuth app with recording scope

**Links:**
- [Zoom Webhooks](https://developers.zoom.us/docs/api/webhooks/)
- [Zoom Transcript API Tutorial](https://www.recall.ai/blog/zoom-transcript-api)

### Slack Huddles

**Verdict: No native API — requires third-party**

- Slack exposes **no API access** to huddle recordings or transcripts
- **Slack AI add-on** provides summaries but no programmatic access
- **Recall.ai** can send a bot to capture real-time transcripts, audio, speaker timelines, and participant events via their API + webhooks
- Other third-party options: timeOS, Votars, Notta

**Links:**
- [Recall.ai Slack Huddles](https://www.recall.ai/blog/capturing-slack-huddle-data-with-recall-ai)
- [Slack AI Huddle Notes](https://slack.com/help/articles/31377193680019-Use-AI-to-take-huddle-notes-in-Slack)

---

## Recommended Approach (Phased)

### Phase 1: Manual + Skill (Now)

- Manually download Teams transcript (`.vtt` or copy/paste from Teams UI)
- Feed into a Claude skill (`meeting-summarizer`) that:
  - Parses transcript (handles `.vtt` timestamps, speaker labels)
  - Generates structured summary: topics, decisions, open questions
  - Extracts action items with assignee suggestions
  - Offers to create Jira tasks, draft follow-up emails, or generate meeting notes docs
- **Effort:** ~1 day to build skill + prompt

### Phase 2: Semi-Automated (Near-term)

- Register an Azure AD app with Graph API permissions
- Subscribe to Teams transcript change notifications (webhook)
- When transcript is ready: auto-fetch, run through summarizer, post summary to Slack channel or Jira comment
- Integrate with `/tt` to auto-log meeting time
- **Effort:** ~1 week (Azure AD setup, webhook listener, integration)

### Phase 3: ZB Task Activity (Future / Product Feature)

- Custom field on ZB Tasks for "Meeting Transcription"
- Upload audio file or paste transcript directly in task
- Platform runs transcription (if audio) + summarization
- Auto-generates sub-tasks from action items
- Links meeting context to the task's activity history
- **Effort:** Product feature — requires platform changes

---

## Transcript Retrieval Options (Implementation Detail)

### Option A: OneDrive Sync (Zero Code)

Teams already saves transcripts to the **meeting organizer's OneDrive** (`Recordings/` folder) as `.vtt` or `.docx`. If OneDrive is synced locally on the Mac, transcripts are already on the filesystem — just need a slash command to find the latest one, parse it, and run summarization. No API setup needed.

### Option B: Graph API Slash Command — `/fetch-transcript` (Recommended)

A Python script that authenticates with Microsoft Graph and fetches transcripts on demand:

```
/fetch-transcript            # list recent meetings with transcripts
/fetch-transcript <meetingId> # download + summarize specific meeting
```

**What's needed:**
- Azure AD app registration (one-time, ~15 min)
- `OnlineMeetingTranscript.Read.All` delegated permission
- Device code auth flow (CLI-friendly, no server needed)
- Auth tokens cache locally — no re-auth every time

**API flow:**
```
GET /me/onlineMeetings → list meetings
GET /me/onlineMeetings/{id}/transcripts → list transcripts
GET /me/onlineMeetings/{id}/transcripts/{id}/content → download .vtt
```

**Limitations:**
- Only works for **calendar-based meetings** (not ad-hoc calls)
- Meetings must not have expired
- Delegated auth preferred over app-only (avoids application access policy issues)

**Links:**
- [Get callTranscript](https://learn.microsoft.com/en-us/graph/api/calltranscript-get?view=graph-rest-1.0)
- [getAllTranscripts](https://learn.microsoft.com/en-us/graph/api/onlinemeeting-getalltranscripts?view=graph-rest-1.0)
- [Transcript permissions](https://graphpermissions.merill.net/permission/OnlineMeetingTranscript.Read.All)

### Option C: Webhook Auto-Capture (Fully Automated)

Subscribe to [change notifications](https://learn.microsoft.com/en-us/graph/teams-changenotifications-callrecording-and-calltranscript) so meeting-end events auto-fetch and process transcripts. Requires an always-on service (Azure Function, local daemon, etc.). Best for Phase 2.

### Transcript Storage Details

| Meeting Type | Storage Location | Format |
|-------------|-----------------|--------|
| Private (1:1, group, ad-hoc) | Organizer's OneDrive / `Recordings/` | `.vtt`, `.docx` |
| Channel meetings | SharePoint site for the channel / `Documents/Recordings/` | `.vtt`, `.docx` |

**Note:** Transcripts may not auto-save to OneDrive unless explicitly configured in tenant settings. Manual download from Teams UI is always available as fallback.

### Actual Teams .docx Transcript Format (from Brian's export)

Analyzed real transcript from `Marketplace--Meeting Transcript.docx`. Format is VTT-style inside a `.docx`:

```
0:0:4.279 --> 0:0:5.79 Brian Hierholzer To help plan.
0:0:7.79 --> 0:0:10.639 Clark Stacer Um, I just in in teams.
```

**Pattern:** `START_TIME --> END_TIME SPEAKER_NAME Message text`

**Observations:**
- Timestamps are `H:M:S.ms` (non-standard — not zero-padded like proper VTT `HH:MM:SS.mmm`)
- Speaker name is on the same line as text (no separate label line)
- Overlapping timestamps exist (people talking over each other)
- Short backchannel interjections ("Yeah.", "Yep.", "No.") captured as separate entries
- No paragraph grouping — every utterance is its own line
- Needs `textutil -convert txt` on macOS to extract text from `.docx`

**LLM Parsing Skill:** Created at `sme-mart/.claude/skills/meeting-summarizer.md` — handles this format plus standard `.vtt` and plain text. Produces cleaned transcript, structured summary, action items, and offers to create Jira tasks.

---

## Transcript Download Permissions

**Problem:** On our last call, only Brian (meeting organizer) could download the transcript. This is default Teams behavior — only the organizer and co-organizers can download. Attendees can *view* in Teams but not download.

### Quick Fixes (No Admin Changes)

| Fix | How | Effort |
|-----|-----|--------|
| **Brian adds Clark as co-organizer** | Edit recurring meeting → add Clark as co-organizer | One-time, ~1 min |
| **Brian shares transcript file** | OneDrive → `...` > Open in browser > Share > Manage Access > add Clark with "Can view" (includes download) | Per-meeting |
| **Schedule in a Teams channel** | Channel meetings store transcripts in SharePoint — all channel members get access automatically | Change meeting setup |

### Automation Workflow Options (Given Brian Owns Transcripts)

**Option A: Brian runs a command** — Brian has a simple tool (CLI, Power Automate button, or Slack command) that downloads the latest transcript and drops it in a shared folder or attaches to a ZB task. Clark/Claude picks it up from there.

**Option B: Clark as co-organizer (Recommended)** — Brian adds Clark as co-organizer on recurring meetings. Then Clark's Graph API credentials can fetch transcripts directly via `/fetch-transcript`. Brian doesn't need to do anything extra after each meeting.

**Option C: Shared folder convention** — Brian configures Teams to auto-share transcripts to a shared OneDrive/SharePoint folder. All meeting transcripts go there automatically. Claude monitors the folder.

### Additional Permission Details

- **Co-organizers** get the same editing/download permissions as organizers automatically
- **Teams Premium or Copilot license** unlocks a dropdown to customize "Who has access to the recording and transcript" (Everyone / Organizers only / Specific people)
- **Channel meetings** bypass all of this — transcripts go to SharePoint where channel members inherit access
- External guests/attendees can only view recordings if explicitly shared

**Links:**
- [Customize transcript access](https://support.microsoft.com/en-us/office/customize-who-can-access-a-recording-or-transcript-in-microsoft-teams-65869725-a7d7-407c-91d4-8b7b8c8d0d0b)
- [Transcript storage and permissions](https://learn.microsoft.com/en-us/microsoftteams/tmr-meeting-recording-change)
- [Grant download access](https://learn.microsoft.com/en-us/answers/questions/5601911/how-can-i-give-access-to-someone-to-be-able-to-dow)

---

## Open Questions for Brian

1. Are SME Mart meetings exclusively on MS Teams, or also Zoom/Slack?
2. Does Brian have admin access to the MS Teams tenant (needed for Graph API app registration)?
3. Should summaries go to Slack, email, Jira, or all three?
4. Who should action items be assigned to by default?
5. Is there a preferred format for meeting notes (e.g., a Confluence template)?
6. For Phase 3 — would this be a w3geekery feature or a ZeroBias platform feature?
7. Is OneDrive syncing locally on Clark's Mac? (determines if Option A is viable)
8. Does Clark/Brian have access to register an Azure AD app in the Teams tenant? (needed for Option B)
9. Can Brian add Clark as co-organizer on recurring SME Mart meetings? (simplest path to transcript access)
10. Does the Teams tenant have Teams Premium or Copilot license? (enables per-meeting access customization)
11. Would scheduling meetings in a Teams channel work for the team? (auto-shares transcripts via SharePoint)
