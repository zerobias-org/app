# SME Mart

**Subject Matter Expert marketplace for compliance and cybersecurity** — an Angular 21 application built on the ZeroBias platform, hosted at `https://uat.zerobias.com/sme-mart` (UAT) and `https://app.zerobias.com/sme-mart` (production).

"Upwork meets Whop" for ZeroBias platform users: buyers post engagements, SMEs bid, work flows through ZB Tasks with proper RACI and Boundaries.

## Status

- **UAT:** initial deploy validating the publish pipeline (`zerobias-org/app:uat` → `app-uat-zerobias.com` S3 bucket → CloudFront). IAM role updated 2026-04-21 (Andrey) — retrying end-to-end publish.
- **Prod:** not yet published — pending UAT verification and platform enrollment

## Architecture

- **Framework:** Angular 21, standalone components, no NgModules, no Nx
- **UI library:** `@zerobias-org/ngx-library` (theming, ZB components)
- **Platform client:** `@zerobias-com/zerobias-angular-client` (wraps the full ZB SDK)
- **Data access:** Generic SQL Hub Module via DataProducer interface (Neon PG backing store)
- **GraphQL:** Custom schema packages under `zerobias-org/schema` for marketplace entities (Engagement, Bid, ServiceOffering, etc.)

## Development

```bash
npm install
npm run dev          # dev server → uat.zerobias.com (default)
npm run dev:ci       # dev server → ci.zerobias.com
npm run test         # Karma unit tests
npm run lint
```

Required env (`.env.local`):
- `ZB_API_KEY` — API key for the target environment
- `ZB_ORG_ID` — organization UUID
- `ZB_TOKEN` — registry auth for `@zerobias-org` private packages
- `GITHUB_TOKEN` — registry auth for `@zerobias-com` private packages

## Deployment

Branch → environment mapping (via `.github/workflows/dispatch.yml`):

| Branch | Environment | URL |
|---|---|---|
| `dev`  | ci   | `https://ci.zerobias.com/sme-mart` |
| `qa`   | qa   | `https://qa.zerobias.com/sme-mart` |
| `uat`  | uat  | `https://uat.zerobias.com/sme-mart` |
| `main` | prod | `https://app.zerobias.com/sme-mart` |

Merging to any of these branches with changes under `package/*/*/**` triggers `Dispatch Deploys` → `Deploy App` → `static-s3-app-release` to the matching S3 bucket.

## Team

- **Brian Hierholzer** (CEO) — product/business direction
- **Kevin** (CIO) — platform infrastructure
- **Clark Stacer** ([W3Geekery](https://w3geekery.com)) — SME Mart frontend
