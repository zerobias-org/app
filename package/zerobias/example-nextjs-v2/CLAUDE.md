# CLAUDE.md

This project's agent guidance lives in **[AGENTS.md](./AGENTS.md)**.

Read AGENTS.md first — it is the single source of truth for how this app is
structured, the canonical ZeroBias v2 client/SDK patterns it demonstrates, and
the per-feature reference docs under [`docs/`](./docs/).

## TODO — next time we work in this app

_All three items below were completed in **0.4.0** (Phase 4) — see [CHANGELOG.md](./CHANGELOG.md).
Kept here (checked) for traceability; prune when convenient._

- [x] **Build every SDK request object as a plain object literal typed to the model, and merge the
      request payload INTO the call panel.** Done in `../example-angular-v2`; this app is now behind.
      Two linked changes:
      1. **Build request objects as plain object literals typed to the model** —
         `const board: NewBoard = { name, status: BoardStatus.from(...), boardType: BoardType.from(...) }`
         — NOT `new NewBoard(...)` positional and NOT `NewBoard.newInstance(obj)`. Typing the const
         makes the **compiler enforce the model's required fields** (a missing one is a build error);
         `newInstance(obj: any)` accepts anything and catches nothing. Values must be the real SDK
         types — `EnumValue` via `Status.from("...")` (a bare string does NOT satisfy the enum-typed
         field) and `UUID` via `toUUID("...")` (`UUID` is a branded class, not a string). Runtime is
         safe: the API `create()` spreads the body and serializes by model name, and `EnumValue` /
         `UUID` JSON-serialize to their wire values. Models: `NewProject`, `NewBoard`, `NewTask`,
         `NewTaskComment`, `NewTaskLink`, `Pkv`, `CreateApiKeyBody`, and the `Search*Body` bodies.
         For **update/PATCH deltas** use `const delta: UpdateX = {}` then assign only changed fields;
         `null` (clear) survives to the wire because nothing round-trips through a serializer — no
         `applyNulls`-style workaround needed (the Angular side had one against `newInstance`'s
         null-dropping; the typed-literal pattern removes the problem entirely).
      2. **Kill the separate "Request payload" panel.** Render the call with the live values inline
         so one panel shows both — `const project: NewProject = { name: "...", status: "draft", ... }`
         followed by the API call. Angular does this via an `objectLiteral()`
         helper in `shared/call-reveal/call-reveal.ts` that renders the REAL built object (so the
         panel cannot drift from what the code actually constructs) and drops `undefined` keys.
      Bump the version + CHANGELOG when it lands.

- [x] **Fix the top banner (header) to match the portal EXACTLY** — the same reconciliation just
      done in `example-angular-v2` (`app.component.html` / `app.component.scss`). Touch
      `src/styles/_header.scss` + `src/components/Header.tsx`.
      **Portal source of truth:** `zb/com/ui/projects/portal/src/app/app.component.scss`
      (`.portal-toolbar`, `.zb-ui-bar`) + `.../portal/components/zerobias-default-app-bar/zerobias-default-app-bar.component.scss`.
      **Exact values (verified vs the portal's devtools Computed Styles):**
      - Toolbar bg **`#000`** (not `#232323`); height **64px**; gap **8px**; padding-left **8px**.
      - Accent strip = a **separate 4px bar element** (NOT a `border-bottom` — a border adds 4px and
        makes the bar 68px): `background: linear-gradient(90deg, rgba(3,175,240,1) 25%, rgba(35,35,35,1) 75%)`.
      - **App icon** `public/app-icon.svg` (already here — navy tile, white border, ZeroBias "0" mark,
        from the platform `nav/_template/color.svg`): replace the `<span className="brand-mark">ZB</span>`
        tile with `<img src="/app-icon.svg" alt="ZeroBias" />` at **36px**, `margin: 0 6px`, display block.
      - **App name:** **Roboto, 16px, font-weight 400, line-height normal, letter-spacing normal, #fff.**
        (Material's toolbar forces weight 500 / line-height 32px onto descendant text — override all three.)
      Bump version + CHANGELOG when it lands.

- [x] **Add a "Your session" landing to the home page.** Port the home view built in
      `../example-angular-v2/src/app/pages/home/home.ts` — an intro blurb (what the app is + the
      `project → board → task` teaching goal) plus a **session card** showing the signed-in
      **user name, email, and current org** (from `useSession()`), with a short note on how the
      client bootstrapped (SSO / dev API key). Clark liked it in the Angular app and wants parity
      here. Today this app's home (`src/app/page.tsx`) is the demo-card grid — add the session
      card above/alongside it, don't remove the cards. Use the existing `--zb-*` tokens + card
      styles. Bump the version + CHANGELOG when it lands.
