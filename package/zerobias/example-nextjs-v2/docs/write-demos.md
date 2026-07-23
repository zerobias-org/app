# Write demos — code-reveal, not execution

**Status: doctrine (2026-07-15).** Write/create/edit demos in this app **do not call the
platform.** They *reveal the code* a developer (or their LLM) would use, show the exact request
payload built from real input, and show an **obfuscated fixture** of the response. Nothing is
ever written. Read demos stay live and real.

## The problem this solves

This app is a **reference app** — it teaches people how to build on the ZeroBias platform, and
increasingly it teaches *their LLMs*, which read code and shapes, not UIs. Read demos (Products,
task list, task detail) are safe: they GET real data and leave nothing behind.

Writes are the trap. A "create task" or "post comment" demo that hits the real platform leaves
**demo cruft in a shared org** with no cleanup (pkv already does this). But faking the write with
`localStorage` and showing a fake "success" teaches nothing and is quietly dishonest.

The way out: for a write, the lesson **is the call and its shapes** — not the side effect. So
show those, truthfully, and never execute.

## The doctrine: code-reveal

A write demo presents three things and issues zero requests:

1. **The call** — the invocation a consumer would write, e.g.
   `platformClient.getTaskApi().addComment(taskId, comment)`. Short, stable, shown as TypeScript.
2. **The request payload** — the actual request object, **constructed live from the user's real
   input through the real SDK class** (`new NewTaskComment(undefined, markdown)`) and serialized.
   Because the construction is real code compiled into the app, the **build's typecheck guarantees
   the signature and shape are correct** against the installed SDK. It updates as the user types.
3. **The response** — an **obfuscated fixture** showing what the server returns, so the reader
   sees the return shape without a live call. Labeled as a fixture, never presented as a live
   result.

The UI stays interactive — compose a comment, fill a form — but "submit" *reveals the call*
rather than sending it. The editor becomes a **code generator**: type the input, see the precise
SDK call and payload an LLM would emit to persist it.

### Why this teaches the surface

Executing a write would add only two things over code-reveal: the live round-trip (validation,
server-generated ids, workflow side effects) and the click-it-and-watch-it-appear feel. The feel
is irrelevant to an LLM consumer. The round-trip semantics that *do* matter on a compliance
surface — a task needs an `activityId`, status moves via a `transitionId` (not a string), RACI is
first-class — are **annotations next to the code**, not things you must hit an endpoint to
explain. Everything a developer or their LLM needs to *write the call correctly* is covered.

## Honesty guarantees (what keeps this from lying or rotting)

- **The request payload is real.** It's the actual SDK object built from live input and
  serialized — not a hand-typed string. If the SDK renames a field or changes a constructor, the
  app **fails to typecheck** and we fix it. That's the anti-rot guarantee.
- **The response is a labeled fixture**, obfuscated and clearly marked "example — not a live
  call." It's illustrative, not authoritative.
- **The read demos remain the live truth for response shapes.** Task detail really fetches real
  comments; anyone wanting the authoritative return shape has it there. The write fixture only has
  to be *representative*.

## Obfuscated fixtures

Response fixtures live in one place (`src/lib/fixtures.ts`) and are **obfuscated**: realistic
*shape*, fake *content* — invented UUIDs, generic person names ("Jordan Rivera"), no real org,
task, or user data. They exist to show structure, so they must never carry data captured verbatim
from a real tenant. Keep them shaped like the SDK return type they illustrate; the read path is
where the exact live shape is proven.

## Consistency

Code-reveal is the **app-wide write-demo doctrine**. Every write surface follows it, and **pkv
gets retrofitted** from its current real-write to code-reveal — it's the one existing write demo,
and the cruft it leaves is exactly what this doctrine removes.

## What this changes vs. the earlier draft

An earlier version of this doc proposed a session-local *overlay* (real writes faked into
`localStorage`, merged over real reads). Code-reveal supersedes it: no mock data layer, no
overlay, no cleanup — because nothing is ever written or even pretended-written. Strictly simpler.

## Open questions

1. **(For Kevin) Should create/edit surfaces appear in the demo at all?** This is now purely
   *editorial* — with code-reveal, nothing is written, so the old *safety* objection (polluting a
   real org) is gone. Showing the create-task code needs no sandbox org.
2. **Response fixtures: hand-authored or captured-then-scrubbed?** Hand-authored is simpler and
   carries zero tenant data; capturing a real response and scrubbing it is more faithful but risks
   leaking real values if scrubbing misses a field. Default to hand-authored, shaped against the
   SDK type.

## See also

- [component-strategy.md](./component-strategy.md) — why this app builds its own components
- [pkv.md](./pkv.md) — the existing write demo to retrofit to code-reveal
