# Binary source documents live outside this repo

**Moved 2026-07-28** (Clark's call) — 50 binary files, ~41 MB, relocated to:

```
~/Projects/w3geekery/references/sme-mart/
```

Original folder structure is preserved there, so a path here maps 1:1 to a path there.

## What moved

| Type | Count |
|---|---|
| `.pdf` | 24 |
| `.docx` | 18 |
| `.xlsx` | 7 |
| `.pptx` | 1 |

## What stayed (and why)

The `.txt` / `.md` / `.html` extracts — 0.39 MB. **Every relocated binary has a matching text
extract here**, which is the form an agent can actually read. The binaries were the archive copy.

## Why they left

This repo is cloned by CI on every deploy. 41 MB of third-party source documents (a CA Department of
Public Health RFP corpus, plus decks) would ride along in every clone forever, and nothing in the
build reads them.

If you need an original — a signature block, an embedded image, exact formatting — pull it from the
path above. Do not commit it back.
