# Concerns

> Auto-generated codebase map. Source of truth is the code itself.

## Technical Debt

### Dual data layer complexity
- **3 data paths**: Neon direct (`SmeMartDbService`), GraphQL reads (`GraphqlReadService`), pipeline writes (`PipelineWriteService`)
- Services must coordinate across layers — reads from Neon, writes to pipeline, eventual consistency via GQL
- `SmeMartDbService` dual-mode (Hub vs Neon) adds conditional logic throughout
- **Risk:** Data inconsistency between Neon (immediate) and AuditgraphDB (eventual after pipeline ingestion)

### Limited test coverage on critical paths
- `GraphqlReadService` — no tests, handles all AuditgraphDB reads
- `PipelineWriteService` — no tests, handles all production writes
- `AppInitService` — no tests, handles auth bootstrap
- Most shared components (~55) lack spec files
- **Risk:** Regressions in write/read paths won't be caught

### No E2E testing
- No Cypress, Playwright, or equivalent
- Critical flows (RFP creation → bid → engagement lifecycle) untested end-to-end
- Wizard components (`RfpWizard`, `BidWizard`) are complex multi-step flows

### Hardcoded IDs
- `PipelineWriteService`: `SME_MART_CLASS_IDS` and `PIPELINE_ID` hardcoded per environment
- `GraphqlReadService`: `BOUNDARY_ID` hardcoded
- **Risk:** Environment switches require code changes, not config

## Security Considerations

### API key exposure
- `environment.vercel.ts` references `NEON_DATABASE_URL` for direct Neon access in browser
- Neon HTTP queries run client-side (Vercel deployment)
- **Mitigation:** Move to server-side proxy / Hub DataProducer for production

### Auth bypass in dev
- `environment.ts` uses API key auth (`isLocalDev: true`)
- No session validation in dev mode — relies on env var `ZB_API_KEY`
- **Mitigation:** Acceptable for dev; production uses platform session auth

## Performance

### No lazy loading of shared components
- All shared components imported eagerly
- ~55 components in `shared/components/` — large initial bundle
- Page routes use lazy loading (`loadChildren`) but shared layer doesn't

### Neon HTTP query overhead
- Each query is a fresh HTTP request (no connection pooling in browser)
- `@neondatabase/serverless` designed for edge/serverless, but used in browser
- **Mitigation:** Hub DataProducer will replace Neon direct in production

## Fragile Areas

### Engagement lifecycle state machine
- `engagement-lifecycle.service.ts` manages status transitions
- Multiple services coordinate: `engagement-context.service.ts`, `engagement-tasks.service.ts`, `engagement-timeline.service.ts`
- Complex interdependencies between task state, timeline events, and engagement status

### RFP/Bid wizard flows
- `RfpWizard` and `BidWizard` are multi-step form components
- Wizard state management across steps
- `bid-ai.service.ts` adds AI draft generation layer
- **Risk:** State loss on navigation, complex validation across steps

### Tag system integration
- `sme-mart-tag.service.ts` and `sme-mart-resource.service.ts` depend on Hydra API
- Tag operations span multiple API calls (create tag → tag resource → link resources)
- Partial failures can leave orphaned tags or unlinked resources

### Platform dependency on schema reload
- GQL schema reloads every ~15 minutes after schema changes
- Pipeline-ingested data may not be immediately queryable
- Components must handle "type not yet available" errors gracefully

## UAT Migration (Active)

- CI/dev environment being rebuilt with Hydra
- UAT is temporary dev target (`npm run dev` → UAT)
- ID mapping required between CI and UAT environments
- Tracked in `.claude/notes/uat-migration-tracker.md`
- **Risk:** Stale CI IDs in code/config causing silent failures

## Architecture Risks

### Vercel deployment is temporary
- Current deployment uses Vercel Edge Middleware for API proxy
- Not aligned with ZeroBias platform deployment model (S3/CloudFront + iframe)
- Will need migration when platform publishing path is ready

### Missing server-side rendering
- Angular SSR not configured
- All data fetching is client-side
- SEO not a concern (authenticated app), but initial load is slower

### Single TODO in codebase
- `src/environments/environment.vercel.ts:11` — "Move to server-side proxy when Hub connection is working"
- Codebase is clean of TODO/FIXME markers otherwise
