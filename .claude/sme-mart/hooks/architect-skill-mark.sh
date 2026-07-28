#!/usr/bin/env bash
# PostToolUse marker: write the per-agent marker (session_id + agent_id) when the
# sme-mart-architect skill is CONSUMED — either invoked via the Skill tool, or its
# SKILL.md (.claude/skills/sme-mart-architect.md) is Read (the escape hatch for subagents
# without the Skill tool). After this, architect-skill-gate.sh stops blocking Angular edits
# for that agent. Wire on Skill|Read.
# Ported from zb/ui ng-skill-mark.sh, tweaked for sme-mart (sme-mart-architect).

input=$(cat)
# Fast path: payload must mention the skill at all, else nothing to do (keeps per-Read cost ~0).
case "$input" in *sme-mart-architect*) : ;; *) exit 0 ;; esac

{ IFS= read -r skill; IFS= read -r fp; IFS= read -r agent; IFS= read -r sid; } < <(printf '%s' "$input" | python3 -c "import sys,json;d=json.load(sys.stdin);ti=d.get('tool_input',{});print(ti.get('skill','') or '');print(ti.get('file_path','') or '');print(d.get('agent_id','') or 'main');print(d.get('session_id','') or 'x')" 2>/dev/null)

hit=0
case "$skill" in *sme-mart-architect*) hit=1 ;; esac
case "$fp" in */sme-mart-architect.md) hit=1 ;; esac
[ "$hit" = "1" ] && touch "${TMPDIR:-/tmp}/sme-mart-architect-${sid}-${agent}"
exit 0
