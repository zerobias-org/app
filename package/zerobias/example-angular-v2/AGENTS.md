# example-angular-v2 — agent guide

The **Angular 21** reference app for building on the ZeroBias platform with the **v2 client**
(`@zerobias-com/zerobias-client`) + per-service SDKs. It mirrors the feature surface of
`../example-nextjs-v2` (compliance **project → board → task**, read + code-reveal write demos), but
builds **natively on the ZeroBias Angular component library** `@zerobias-org/ngx-library` instead of
rebuilding those components. For repo-wide app/deploy conventions see the root
[`../../../AGENTS.md`](../../../AGENTS.md).

## MANDATORY — read the `angular-architect` skill before writing ANY code

Before writing or editing **any** code in this package, you MUST invoke the **`angular-architect`**
skill (`Skill(angular-architect)`) and follow modern Angular 21 best practices. This is not
optional. See [CLAUDE.md](./CLAUDE.md).

Angular 21 non-negotiables here:
- **Standalone** components/directives/pipes (no NgModules).
- **Zoneless** change detection (the app default — no zone.js). Never add `provideZoneChangeDetection`.
- **Signals** for component/service state; `computed()` for derived; `effect()` sparingly.
- **New control flow** in templates (`@if` / `@for` / `@switch`) — never `*ngIf` / `*ngFor`.
- **`inject()`** over constructor DI.
- **`ChangeDetectionStrategy.OnPush`** on every component.
- **Signal Forms** (`@angular/forms/signals`) for the write-demo forms — not reactive/template forms.
- **`@angular/aria`** directives for accessibility.
- **Vitest** for unit tests (the app default test runner).
- TypeScript strict; keep components small (smart/dumb split); lazy-load feature routes.

### REQUIRED: components & styles come from ngx-library FIRST

Before minting **any** component or writing **any** SCSS, check `@zerobias-org/ngx-library`. Strict
order: **(1) ngx-library** (its `Zb*Component`s + its `.zb-*` SCSS classes / `--zb-*` tokens — deep
layers for chips, badges, buttons, panels, status dots, etc.), **(2) Angular Material**
(https://v21.material.angular.dev/) if not in ngx-library, **(3) hand-roll only as a last resort**
(e.g. the app-shell layout ngx-library doesn't ship), still using `--zb-*` tokens. Never hardcode a
color or hand-roll a chip/card/badge/panel that already exists. Full rule: [CLAUDE.md](./CLAUDE.md);
what's available: [docs/using-ngx-library.md](./docs/using-ngx-library.md) +
`node_modules/@zerobias-org/ngx-library/docs/{COMPONENT_API,CSS_CLASSES,CSS_PROPERTIES}.md`.

## Stack

- Angular 21 (standalone, zoneless), TypeScript strict, Vitest.
- `@zerobias-org/ngx-library@0.2.42` — ZeroBias Angular components + M3 theme. Consuming it:
  [docs/using-ngx-library.md](./docs/using-ngx-library.md).
- v2 SDKs: `zerobias-client`, `dana-sdk`, `portal-sdk`, `platform-sdk`, `types-core-js`.

## Structure

```
src/
  app/
    core/                 zerobias-app.service.ts (client bootstrap), session.service.ts (signals)
    app.config.ts         providers: APP_INITIALIZER (client init), router, http, provideZbDefaults
    app.routes.ts         lazy feature routes
    app.ts / app.html     app shell (sidenav rail + toolbar)
  environments/           environment.ts (prod) + environment.development.ts (fileReplacements)
  styles.scss             ngx-library M3 theme
proxy.conf.js             local-dev /api proxy + API-key injection
```

## Client bootstrap & auth

`ZerobiasAppService` builds `ZerobiasClientApi/App` once and `init()`s it; `app.config.ts` runs that
in an `APP_INITIALIZER`, then `SessionService.connect()` wires the `user`/`org`/`api` signals from
the client's RxJS streams. Deployed: platform SSO (session cookie); the client redirects on no
session. Local dev (`ng serve`): `proxy.conf.js` forwards `/api` to ci and injects
`Authorization: APIKey <API_KEY>` (never bundled), and the session WebSocket is disabled
(`socketUrlPath` empty) to avoid reconnect spam.

## Build, deploy & local dev

- **Build:** `npm run build` → static bundle **flat in `dist/`** (`outputPath.browser: ""`),
  `baseHref: /example-angular-v2/`. That's what CI syncs to `s3://app-<env>-zerobias.com/example-angular-v2/`.
  One build promoted across uat/qa/prod (host resolved at runtime).
- **Local dev:** `export API_KEY='<zerobias api key>'` then `npm start` → http://localhost:4200/example-angular-v2/.
- Node **22** (`.nvmrc`); `.npmrc` resolves `@zerobias-*` from `pkg.zerobias.org` via `ZB_TOKEN`.

## Angular docs (local, version-pinned)

The block below indexes Angular docs pinned to this app's Angular version, downloaded to
`.angular-docs/` (gitignored) by `npx github:w3geekery/angular-agents-md`. **Prefer these local,
version-exact docs over training-data memory** — Angular changes fast across versions. Re-run the
tool after bumping the Angular version to refresh.

## Angular Docs

<!-- ANGULAR-AGENTS-MD-START -->[Angular Docs Index]|root: ./.angular-docs|STOP. What you remember about Angular may be OUTDATED. Always search docs and read before any task.|If docs missing, run: npx angular-agents-md|ai:{ai-tutor.md,design-patterns.md,develop-with-ai.md,mcp-server-setup.md,overview.md}|best-practices:{a11y.md,error-handling.md,style-guide.md,update.md}|best-practices/runtime-performance:{overview.md,profiling-with-chrome-devtools.md,skipping-subtrees.md,slow-computations.md,zone-pollution.md}|ecosystem:{custom-build-pipeline.md,web-workers.md}|ecosystem/rxjs-interop:{output-interop.md,signals-interop.md,take-until-destroyed.md}|ecosystem/service-workers:{app-shell.md,communications.md,config.md,custom-service-worker-scripts.md,devops.md,getting-started.md,overview.md,push-notifications.md}|.:{error.md}|events:{v21.md}|guide/animations:{complex-sequences.md,css.md,enter-and-leave.md,migration.md,overview.md,reusable-animations.md,transition-and-triggers.md}|guide/aria:{accordion.md,autocomplete.md,combobox.md,grid.md,listbox.md,menu.md,menubar.md,multiselect.md,overview.md,select.md,tabs.md,toolbar.md,tree.md}|guide/components:{advanced-configuration.md,anatomy-of-components.md,content-projection.md,dom-apis.md,host-elements.md,inheritance.md,inputs.md,lifecycle.md,outputs.md,programmatic-rendering.md,queries.md,selectors.md,styling.md}|guide/di:{creating-and-using-services.md,creating-injectable-service.md,defining-dependency-providers.md,dependency-injection-context.md,di-in-action.md,hierarchical-dependency-injection.md,lightweight-injection-tokens.md,overview.md}|guide/directives:{attribute-directives.md,directive-composition-api.md,overview.md,structural-directives.md}|guide:{drag-drop.md,elements.md,hydration.md,image-optimization.md,incremental-hydration.md,security.md,ssr.md,tailwind.md,zoneless.md}|guide/forms:{dynamic-forms.md,form-validation.md,overview.md,reactive-forms.md,template-driven-forms.md,typed-forms.md}|guide/forms/signals:{comparison.md,custom-controls.md,designing-your-form-model.md,field-state-management.md,migration.md,models.md,overview.md,validation.md}|guide/http:{http-resource.md,interceptors.md,making-requests.md,overview.md,security.md,setup.md,testing.md}|guide/i18n:{add-package.md,deploy.md,example.md,format-data-locale.md,import-global-variants.md,locale-id.md,manage-marked-text.md,merge.md,overview.md,prepare.md,translation-files.md}|guide/ngmodules:{overview.md}|guide/performance:{overview.md}|guide/routing:{common-router-tasks.md,customizing-route-behavior.md,data-resolvers.md,define-routes.md,lifecycle-and-events.md,navigate-to-routes.md,overview.md,read-route-state.md,redirecting-routes.md,rendering-strategies.md,route-guards.md,route-transition-animations.md,router-reference.md,router-tutorial.md,routing-with-urlmatcher.md,show-routes-with-outlets.md,testing.md}|guide/signals:{effect.md,linked-signal.md,overview.md,resource.md}|guide/templates:{binding.md,control-flow.md,defer.md,event-listeners.md,expression-syntax.md,ng-container.md,ng-content.md,ng-template.md,overview.md,pipes.md,two-way-binding.md,variables.md,whitespace.md}|guide/testing:{attribute-directives.md,code-coverage.md,component-harnesses-overview.md,component-harnesses-testing-environments.md,components-basics.md,components-scenarios.md,creating-component-harnesses.md,debugging.md,karma.md,migrating-to-vitest.md,overview.md,pipes.md,services.md,using-component-harnesses.md,utility-apis.md,zone-js-testing-utilities.md}|introduction/essentials:{components.md,dependency-injection.md,next-steps.md,overview.md,signal-forms.md,signals.md,templates.md}|introduction:{installation.md,what-is-angular.md}|reference:{cli.md,license.md,press-kit.md,releases.md,roadmap.md,versions.md}|reference/concepts:{overview.md}|reference/configs:{angular-compiler-options.md,file-structure.md,npm-packages.md,workspace-config.md}|reference/errors:{NG0100.md,NG01101.md,NG01203.md,NG0200.md,NG0201.md,NG0203.md,NG0209.md,NG02200.md,NG02800.md,NG02802.md,NG0300.md,NG0301.md,NG0302.md,NG0401.md,NG0403.md,NG0500.md,NG05000.md,NG0501.md,NG0502.md,NG0503.md,NG0504.md,NG0505.md,NG0506.md,NG0507.md,NG05104.md,NG0602.md,NG0750.md,NG0751.md,NG0910.md,NG0912.md,NG0913.md,NG0919.md,NG0950.md,NG0951.md,NG0955.md,NG0956.md,NG1001.md,NG2003.md,NG2009.md,NG3003.md,NG6100.md,NG8001.md,NG8002.md,NG8003.md,overview.md}|reference/extended-diagnostics:{NG8021.md,NG8101.md,NG8102.md,NG8103.md,NG8104.md,NG8105.md,NG8106.md,NG8107.md,NG8108.md,NG8109.md,NG8111.md,NG8113.md,NG8114.md,NG8115.md,NG8116.md,NG8117.md,overview.md}|reference/migrations:{cleanup-unused-imports.md,common-to-standalone.md,control-flow.md,inject-function.md,ngclass-to-class.md,ngstyle-to-style.md,outputs.md,overview.md,route-lazy-loading.md,router-testing-module-migration.md,self-closing-tags.md,signal-inputs.md,signal-queries.md,standalone.md}|tools/cli:{aot-compiler.md,aot-metadata-errors.md,build-system-migration.md,build.md,cli-builder.md,deployment.md,end-to-end.md,environments.md,overview.md,schematics-authoring.md,schematics-for-libraries.md,schematics.md,serve.md,setup-local.md,template-typecheck.md}|tools/devtools:{component.md,injectors.md,overview.md,profiler.md}|tools:{language-service.md}|tools/libraries:{angular-package-format.md,creating-libraries.md,overview.md,using-libraries.md}|tutorials:{README.md,home.md}|tutorials/deferrable-views/intro:{README.md}|tutorials/deferrable-views/steps/1-what-are-deferrable-views:{README.md}|tutorials/deferrable-views/steps/2-loading-error-placeholder:{README.md}|tutorials/deferrable-views/steps/3-defer-triggers:{README.md}|tutorials/first-app/intro:{README.md}|tutorials/first-app/steps/01-hello-world:{README.md}|tutorials/first-app/steps/02-Home:{README.md}|tutorials/first-app/steps/03-HousingLocation:{README.md}|tutorials/first-app/steps/04-interfaces:{README.md}|tutorials/first-app/steps/05-inputs:{README.md}|tutorials/first-app/steps/06-property-binding:{README.md}|tutorials/first-app/steps/07-dynamic-template-values:{README.md}|tutorials/first-app/steps/08-ngFor:{README.md}|tutorials/first-app/steps/09-services:{README.md}|tutorials/first-app/steps/10-routing:{README.md}|tutorials/first-app/steps/11-details-page:{README.md}|tutorials/first-app/steps/12-forms:{README.md}|tutorials/first-app/steps/13-search:{README.md}|tutorials/first-app/steps/14-http:{README.md}|tutorials/learn-angular/intro:{README.md}|tutorials/learn-angular/steps/1-components-in-angular:{README.md}|tutorials/learn-angular/steps/10-deferrable-views:{README.md}|tutorials/learn-angular/steps/11-optimizing-images:{README.md}|tutorials/learn-angular/steps/12-enable-routing:{README.md}|tutorials/learn-angular/steps/13-define-a-route:{README.md}|tutorials/learn-angular/steps/14-routerLink:{README.md}|tutorials/learn-angular/steps/15-forms:{README.md}|tutorials/learn-angular/steps/16-form-control-values:{README.md}|tutorials/learn-angular/steps/17-reactive-forms:{README.md}|tutorials/learn-angular/steps/18-forms-validation:{README.md}|tutorials/learn-angular/steps/19-creating-an-injectable-service:{README.md}|tutorials/learn-angular/steps/2-updating-the-component-class:{README.md}|tutorials/learn-angular/steps/20-inject-based-di:{README.md}|tutorials/learn-angular/steps/22-pipes:{README.md}|tutorials/learn-angular/steps/23-pipes-format-data:{README.md}|tutorials/learn-angular/steps/24-create-a-pipe:{README.md}|tutorials/learn-angular/steps/25-next-steps:{README.md}|tutorials/learn-angular/steps/3-composing-components:{README.md}|tutorials/learn-angular/steps/4-control-flow-if:{README.md}|tutorials/learn-angular/steps/5-control-flow-for:{README.md}|tutorials/learn-angular/steps/6-property-binding:{README.md}|tutorials/learn-angular/steps/7-event-handling:{README.md}|tutorials/learn-angular/steps/8-input:{README.md}|tutorials/learn-angular/steps/9-output:{README.md}|tutorials/signal-forms/intro:{README.md}|tutorials/signal-forms/steps/1-set-up-form-model:{README.md}|tutorials/signal-forms/steps/2-connect-form-template:{README.md}|tutorials/signal-forms/steps/3-add-validation:{README.md}|tutorials/signal-forms/steps/4-display-errors:{README.md}|tutorials/signal-forms/steps/5-add-submission:{README.md}|tutorials/signal-forms/steps/6-next-steps:{README.md}|tutorials/signals/intro:{README.md}|tutorials/signals/steps/1-creating-your-first-signal:{README.md}|tutorials/signals/steps/10-reacting-to-signal-changes-with-effect:{README.md}|tutorials/signals/steps/11-next-steps:{README.md}|tutorials/signals/steps/2-deriving-state-with-computed-signals:{README.md}|tutorials/signals/steps/3-deriving-state-with-linked-signals:{README.md}|tutorials/signals/steps/4-managing-async-data-with-signals:{README.md}|tutorials/signals/steps/5-component-communication-with-signals:{README.md}|tutorials/signals/steps/6-two-way-binding-with-model-signals:{README.md}|tutorials/signals/steps/7-using-signals-with-services:{README.md}|tutorials/signals/steps/8-using-signals-with-directives:{README.md}|tutorials/signals/steps/9-query-child-elements-with-signal-queries:{README.md}<!-- ANGULAR-AGENTS-MD-END -->
