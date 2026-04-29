# ZeroBias Org Chart

**Last updated:** 2026-04-27 (Clark)

Authoritative roster. Look this up when about to attribute work to a named person. **Do NOT guess names** — if no one fits, write "backend team" / "UI team" / "platform team".

## Leadership

| Name | Role | Notes |
|---|---|---|
| **Brian** | CEO | Sets business directives. Does NOT write code. NEVER attribute implementation to Brian. Meetings with Clark: Tue + Fri. |
| **Kevin** | CIO | Both backend team and UI team report to Kevin. Clark reports to Kevin. Owner of platform/Hub infrastructure decisions. |

## Backend Team (reports to Kevin)

| Name | Role | Specialties |
|---|---|---|
| **Chris** | Team lead dev | Backend lead |
| **Nicholas** | Developer | GQL specialist, hydra specialist (escalate boundary/indexing/pod/hydra issues here) |
| **Andrey** | DevOps | Infra, deploys, CloudFront, CI/CD |

## UI Team (reports to Kevin)

| Name | Role | Specialties |
|---|---|---|
| **Tom** | Angular lead | Deep Angular expertise — escalate Angular-specific architecture/idiom questions to Tom |
| **Clark** (the user) | Sr. frontend dev | W3Geekery contractor. Broader frontend / full-stack-ish background; less Angular-specialized than Tom. SME Mart frontend, 15 hrs/week cap |

## Adjacent (separate orgs / business units)

| Name | Role | Notes |
|---|---|---|
| **Daniel Rojas** | Owner of all Content repos | `zerobias-org/vendor`, `zerobias-org/product`, `zerobias-org/schema`, etc. Ping for `approved` labels on PRs against those repos, and on Content workflow / `zbb gate` questions. |
| **Dan** (not Daniel) | Building Readiness Center (Plan 024) | Separate from Clark's SME Mart work |
| **Brian Ruf** | NOT Brian-CEO | Different person, different business unit. Never suggest. |

## Routing rules

- **GQL boundary/indexing/pod issues** → Nicholas
- **Hydra issues** → Nicholas
- **Deploy / CloudFront / CI infra** → Andrey
- **Backend lead questions / cross-cutting decisions** → Chris (escalate to Kevin if needed)
- **Angular-specific architecture / idioms** → Tom (Angular lead)
- **General frontend / full-stack work on SME Mart** → Clark
- **Content repo PRs / `zbb gate` / schema workflow** → Daniel Rojas
- **Business directives / scope decisions** → Brian (via Kevin if non-urgent)
- **Anything Clark reports to / status / cross-team coordination** → Kevin

## Default phrasing when unsure

- "the backend team" — when no specific name fits and the work is server-side
- "the UI team" — when no specific name fits and the work is frontend
- "platform team" / "ZB platform side" — for cross-cutting infrastructure
- Never invent a name. Never default to "Brian or Kevin would" — that's a guess.
