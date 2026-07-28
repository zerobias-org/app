# `.claude/` — agent tooling, per app

Repo-root home for Claude agent tooling. **Per-app config lives at `.claude/<app>/`.**

```
.claude/
├── hooks/                  # repo-wide hooks
├── sme-mart/               # <- per-app: package/w3geekery/sme-mart
│   ├── agents/  commands/  hooks/  skills/  scripts/
│   ├── post-mortems/       # failure reports — read before schema changes
│   ├── research/  sketches/  smoke-tests/  ui-specs/
│   └── references/         # text extracts; binaries live outside the repo
└── <next-app>/             # same shape
```

## Why root-level and not inside the app dir

**The deploy detector.** `.github/workflows/dispatch.yml` triggers on `package/*/*/**` — *any* file
under an app directory redeploys that app. Agent docs living at
`package/<vendor>/<app>/.claude/` meant every note edit shipped a build. Root-level `.claude/` sits
outside that glob, so tooling changes cost nothing.

**Branch survival.** The repo builds on feature-branch-per-unit (see [AGENTS.md](../AGENTS.md)
§Branching). Anything committed only to a unit branch dies with it. Landing tooling on `uat` — the
branch every feature branch is cut from — means each new branch has it by construction.

## Adding an app

Create `.claude/<app>/`, mirror the shape above, take only what you need. Reference it from the app's
`CLAUDE.md` using a relative path (`../../../.claude/<app>/…` from `package/<vendor>/<app>/`).

## Conventions

- **Keep it small.** This ships in every clone, including CI. Binary source documents (PDF, DOCX,
  XLSX, PPTX) do **not** belong here — keep the text extract, store the original outside the repo.
  See [`sme-mart/references/BINARIES-RELOCATED.md`](sme-mart/references/BINARIES-RELOCATED.md).
- **No machine-specific absolute paths** in anything committed here — hooks and skills get read by
  other people's agents. Use repo-relative paths.
- **`.planning/` is separate** and stays gitignored (local director/planning scratch). This directory
  is the shared, versioned half.
