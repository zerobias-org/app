#!/usr/bin/env bash
# PreToolUse gate: block Edit/Write of Angular source under src/ until the
# sme-mart-architect skill has been consumed by THIS agent (main OR each subagent
# instance, keyed by session_id + agent_id). One-time per agent; passes silently after.
# "Consumed" = invoked the skill (Skill tool) OR Read its SKILL.md
# (<repo-root>/.claude/sme-mart/skills/sme-mart-architect.md) — so subagents that lack the Skill tool
# (e.g. gsd-executor) can still satisfy the gate. Block via exit 2.
# Ported from zb/ui ng-skill-gate.sh, tweaked for sme-mart (src/ source + sme-mart-architect).

input=$(cat)
# Fast path: only Angular source under src/ is gated — skip the rest cheaply.
case "$input" in *'/src/'*) : ;; *) exit 0 ;; esac

{ IFS= read -r fp; IFS= read -r agent; IFS= read -r sid; } < <(printf '%s' "$input" | python3 -c "import sys,json;d=json.load(sys.stdin);ti=d.get('tool_input',{});print(ti.get('file_path','') or '');print(d.get('agent_id','') or 'main');print(d.get('session_id','') or 'x')" 2>/dev/null)

case "$fp" in
  */src/*.ts|*/src/*.html|*/src/*.scss) : ;;
  *) exit 0 ;;
esac

marker="${TMPDIR:-/tmp}/sme-mart-architect-${sid}-${agent}"
[ -f "$marker" ] && exit 0

echo "BLOCKED — editing Angular code ($fp) before consuming the sme-mart-architect skill. FIRST do ONE of: (a) invoke the sme-mart-architect skill (Skill tool); or (b) Read the app repo's .claude/sme-mart/skills/sme-mart-architect.md (for agents without the Skill tool, e.g. gsd-executor). Absorb the repo conventions (standalone components, ngx-library theming, DataProducer/Generic-SQL data layer, and the Angular 21 modernization rules — input()/output()/inject(), @if/@for, no NgModule/CommonModule, no any), ASK open questions instead of guessing, THEN retry this edit. One-time per agent; passes silently afterward." >&2
exit 2
