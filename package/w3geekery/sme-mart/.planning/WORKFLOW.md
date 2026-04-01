# GSD + Director Workflow

Quick reference for the backlog-to-shipped workflow using 3 tmux panes.

**Launch:** `sme-mart-director.sh` or `tmux attach -t sme-director`

```
┌──────────────────┬──────────────────┬──────────────────┐
│  LEFT            │  MIDDLE          │  RIGHT           │
│  meta-director   │  gsd-plan        │  gsd-exec        │
│  (persistent)    │  (plan phases)   │  (execute phases) │
└──────────────────┴──────────────────┴──────────────────┘
```

---

## 1. Pick from backlog

Open `.planning/BACKLOG.md`, choose a plan. Note the plan number and description.

## 2. Design — LEFT pane

```
/meta:director design
```

- Tell the director which backlog item you're working on
- It will ask questions one at a time — answer, push back, iterate
- When done, it produces canonical specs + REQUIREMENTS.md
- Say **"save"** when satisfied — director passivates to disk

## 3. Create milestone — MIDDLE pane

```
/gsd:new-milestone
```

- Point it at the REQUIREMENTS.md the director created
- Produces: PROJECT.md, ROADMAP.md (with phases), STATE.md

## 4. Plan a phase — MIDDLE pane

```
/gsd:plan-phase 1
```

- Creates PLAN.md for the phase
- Repeat for each phase, or do one at a time

## 5. Review the plan — LEFT pane

```
/meta:director review 1
```

- Director checks plan against specs, Angular patterns, data flow, budget
- Outputs: BLOCK / FLAG / NOTE issues
- **Fix all BLOCKs before executing**
- Repeat for each phase planned in step 4

## 6. Execute — RIGHT pane

```
/gsd:execute-phase 1
```

- GSD executes the plan, writes code, commits

**If something goes wrong** — LEFT pane:

```
/meta:director checkpoint 1
```

- Paste errors or describe the problem
- Director diagnoses root cause, prescribes fix

## 7. Repeat 4→5→6 for each phase

```
MIDDLE:  /gsd:plan-phase 2
LEFT:    /meta:director review 2
RIGHT:   /gsd:execute-phase 2
```

## 8. Ship

```
MIDDLE:  /gsd:ship
```

## 9. Retro — LEFT pane

```
/meta:director retro
```

- Reviews what worked, what didn't
- Updates RETROSPECTIVE.md, WATCH-LIST-SEED.md
- Accumulated learnings carry forward to next milestone

---

## Tips

- **Don't kill the tmux session** — detach with `ctrl+b d`, reattach with `tmux attach -t sme-director`
- **Director is persistent** — it holds context across the full milestone. The GSD panes come and go.
- **One phase at a time** is fine — you don't have to plan all phases upfront
- **Sync upstream** periodically: `/meta:sync` checks for meta-harness updates
- **Backlog stubs** — new ideas go in `.planning/BACKLOG.md`, not into the active milestone
