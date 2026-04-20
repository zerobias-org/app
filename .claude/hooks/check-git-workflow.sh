#!/usr/bin/env bash
# Hook: Enforce git workflow rules for the zerobias-org SCHEMA repo only.
# Ensures we use the w3geekery fork, stay synced with upstream, and validate
# schema changes with dataloader before committing.
#
# Scope: Only activates for commands targeting the schema repo
# (~/Projects/w3geekery/zerobias-org-forks/schema).

set -euo pipefail

INPUT=$(cat)
CMD=$(echo "$INPUT" | jq -r '.tool_input.command // ""')

# Only check commands containing git commit, git push, gh pr create
if ! echo "$CMD" | grep -qE '(git commit|git push|gh pr create)'; then
  exit 0
fi

# ── Scope check: only apply to schema repo ──
# Detect target repo from cd in command or from PWD
SCHEMA_FORK="/Projects/w3geekery/zerobias-org-forks/schema"
SCHEMA_UPSTREAM="/Projects/zb/zerobias-org/schema"

IS_SCHEMA_CMD=false
if echo "$CMD" | grep -qF "$SCHEMA_FORK"; then
  IS_SCHEMA_CMD=true
elif echo "$CMD" | grep -qF "$SCHEMA_UPSTREAM"; then
  IS_SCHEMA_CMD=true
elif [[ "${PWD:-}" == *"$SCHEMA_FORK"* || "${PWD:-}" == *"$SCHEMA_UPSTREAM"* ]]; then
  IS_SCHEMA_CMD=true
fi

# Not a schema repo command — allow it through
if [[ "$IS_SCHEMA_CMD" != "true" ]]; then
  exit 0
fi

ERRORS=()

# ── Rule 1: Must use w3geekery fork, not upstream zb/ repo ──
if echo "$CMD" | grep -qF "$SCHEMA_UPSTREAM"; then
  ERRORS+=("WRONG REPO: Command references ~/Projects/zb/zerobias-org/schema. Use ~/Projects/w3geekery/zerobias-org-forks/schema instead. We are a 3rd-party developer — always work from the w3geekery fork.")
fi
if [[ "${PWD:-}" == *"$SCHEMA_UPSTREAM"* ]]; then
  ERRORS+=("WRONG DIRECTORY: CWD is in ~/Projects/zb/zerobias-org/schema. Switch to ~/Projects/w3geekery/zerobias-org-forks/schema for all git operations.")
fi

# ── Rule 2: Check upstream sync before commit/push ──
# Resolve the actual schema repo dir from the command
SCHEMA_DIR="$HOME$SCHEMA_FORK"
if echo "$CMD" | grep -qE '(git commit|git push)'; then
  if [[ -d "$SCHEMA_DIR/.git" ]]; then
    git -C "$SCHEMA_DIR" fetch upstream --quiet 2>/dev/null || true
    BEHIND=$(git -C "$SCHEMA_DIR" rev-list --count HEAD..upstream/dev 2>/dev/null || echo "0")
    if [[ "$BEHIND" -gt 0 ]]; then
      ERRORS+=("NOT SYNCED: Schema repo is $BEHIND commit(s) behind upstream/dev. Run: cd $SCHEMA_DIR && git pull upstream dev")
    fi
  fi
fi

# ── Rule 3: Dataloader validation for schema class changes ──
if echo "$CMD" | grep -qE 'git commit'; then
  if [[ -d "$SCHEMA_DIR/.git" ]]; then
    STAGED_CLASSES=$(git -C "$SCHEMA_DIR" diff --cached --name-only 2>/dev/null | grep -c 'classes/.*\.yml$' || echo "0")
    if [[ "$STAGED_CLASSES" -gt 0 ]]; then
      MARKER=""
      for PKG_DIR in "$SCHEMA_DIR"/package/w3geekery/smemart "$SCHEMA_DIR"/package/w3geekery/sme-mart; do
        if [[ -f "$PKG_DIR/.dataloader-validated" ]]; then
          MARKER="$PKG_DIR/.dataloader-validated"
          break
        fi
      done

      if [[ -z "$MARKER" ]]; then
        ERRORS+=("DATALOADER NOT RUN: Schema class YAMLs are staged but dataloader hasn't been validated. Run: cd $SCHEMA_DIR && npm run verify (in the schema package dir) && touch <pkg-dir>/.dataloader-validated")
      else
        MARKER_AGE=$(( $(date +%s) - $(stat -f %m "$MARKER" 2>/dev/null || echo "0") ))
        if [[ "$MARKER_AGE" -gt 1800 ]]; then
          ERRORS+=("DATALOADER STALE: .dataloader-validated is $(( MARKER_AGE / 60 )) minutes old. Re-run dataloader to validate current changes.")
        fi
      fi

      # Check if new field properties have corresponding field definition YAMLs
      STAGED_FIELDS=$(git -C "$SCHEMA_DIR" diff --cached --name-only 2>/dev/null | grep -c 'fields/.*\.yml$' || echo "0")
      NEW_PROPS=$(git -C "$SCHEMA_DIR" diff --cached 2>/dev/null | grep -c '^\+.*field:' || echo "0")
      if [[ "$NEW_PROPS" -gt 0 && "$STAGED_FIELDS" -eq 0 ]]; then
        ERRORS+=("MISSING FIELD DEFINITIONS: New 'field:' properties added to class YAMLs but no field definition YAMLs staged. Every 'field: x.y' needs a corresponding fields/x.y.yml file.")
      fi
    fi
  fi
fi

# ── Rule 4: Cross-fork PR check ──
if echo "$CMD" | grep -qE 'gh pr create'; then
  if ! echo "$CMD" | grep -q -- '--repo zerobias-org/'; then
    ERRORS+=("PR TARGET: Use --repo zerobias-org/schema --head w3geekery:<branch> for cross-fork PRs. Don't create PRs on the fork itself.")
  fi
fi

# ── Rule 5: Schema PRs — feature work to dev, promotes to main via fork-side branch ──
# Enforces the 3rd-party-developer workflow: no branch-to-branch PRs on upstream
# (that requires write access we don't have). Promote PRs must source from the
# w3geekery fork.
if echo "$CMD" | grep -qE 'gh pr create'; then
  if echo "$CMD" | grep -q -- '--repo zerobias-org/schema'; then
    if echo "$CMD" | grep -qE -- '--base main\b'; then
      # Promote to main: head must be w3geekery:dev (Variant A) or
      # w3geekery:<branch-containing-'promote'> (Variant B, recommended).
      if ! echo "$CMD" | grep -qE -- '--head w3geekery:(dev\b|[^ ]*promote[^ ]*)'; then
        ERRORS+=("WRONG PROMOTE HEAD: dev→main promote PRs must source from the w3geekery fork. Use --head w3geekery:dev (Variant A) or --head w3geekery:<branch-with-'promote'-in-name> (Variant B, recommended). A 3rd-party developer cannot create branch-to-branch PRs on zerobias-org/schema directly — the head branch must live on the fork.")
      fi
    elif ! echo "$CMD" | grep -qE -- '--base dev\b'; then
      ERRORS+=("WRONG BASE BRANCH: Schema PRs must target --base dev for feature work, or --base main for dev→main promotes (with fork-side head branch). No other base branches allowed.")
    fi
  fi
fi

# ── Output ──
if [[ ${#ERRORS[@]} -gt 0 ]]; then
  MSG="BLOCKED — Schema repo workflow violations:\n"
  for E in "${ERRORS[@]}"; do
    MSG="$MSG\n  - $E\n"
  done
  MSG="$MSG\nFix these before proceeding."

  jq -n --arg reason "$MSG" '{
    "decision": "block",
    "reason": $reason
  }'
  exit 2
fi

exit 0
