---
id: "018"
severity: medium
phase: 19
found: 2026-04-17
status: open
---

# Phase 19 v2 — Latent Path-Default Bug in Both Stacks

Director v2 review (SIGN-OFF PASS) and gsd-plan-checker both missed miscalculated default path values in `zbb.yaml` and `setup.sh` fallbacks for `sme-mart-spa` and `sme-mart-login`. The bug was surfaced during Wave 2 execution by a CWD drift in the 19-03 executor agent that committed files at `app/zbb-stacks/sme-mart-login/` instead of `app/package/w3geekery/sme-mart/zbb-stacks/sme-mart-login/`. While investigating the drift, the planned default paths were traced and found incorrect at the correct locations.

## What shipped (incorrect defaults)

| Plan | File | Variable | Planned default | Resolves to (wrong) |
|------|------|----------|-----------------|---------------------|
| 19-02 | `sme-mart-spa/zbb.yaml` | `SPA_REPO_PATH` | `../../../` | one level above sme-mart root |
| 19-02 | `sme-mart-spa/setup.sh` | `SPA_REPO_PATH` fallback | `./../../../` | same |
| 19-03 | `sme-mart-login/zbb.yaml` | `LOGIN_REPO_PATH` | `../../../login` | does not exist — resolved against app/, not zerobias-org-forks/ |
| 19-03 | `sme-mart-login/setup.sh` | `LOGIN_REPO_PATH` fallback | `./../../../login` | same |

## What it should be

From `app/package/w3geekery/sme-mart/zbb-stacks/<stack>/`:

- SPA → SME Mart root: `../../` (2 levels up — zbb-stacks, sme-mart root)
- Login → `zerobias-org-forks/login`: `../../../../../../login` (6 levels up — zbb-stacks, sme-mart, w3geekery, package, app, zerobias-org-forks)

## Why review missed it

Director review and plan-checker evaluated structure, decisions, and nginx/docker integration correctness, but did not mentally trace path resolution from the script's actual location. The reference pattern (`zb/ui`) also lives at a different depth, so the path defaults weren't cross-checked.

## Fix

Commit: `fix(phase-19): correct path defaults + relocate sme-mart-login to package subtree` (2026-04-17). Applied both the directory relocation and the corrected `../` counts in one atomic change, with `(cd <path> && pwd)` verification passing from each stack directory.

## Watch-list addition

- Plan review and design review MUST mentally trace relative path resolution from the script's actual runtime location, especially for repos living inside a monorepo subtree. Do not approve defaults without running the equivalent of `(cd <script-dir> && cd <default> && pwd)` on paper.
