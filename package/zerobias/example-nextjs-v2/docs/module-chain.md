# Module usage — the connection chain (GitHub)

Demonstrated in [`src/app/module/page.tsx`](../src/app/module/page.tsx). It connects
a real GitHub client **through the Hub** and lists an org's repositories, by
walking the module chain:

```
product (github.github)   portalClient.getProductApi().search({ packageCode })
  -> module               storeClient.getModuleApi().search({ products })
    -> connection         hubClient.getConnectionApi().search({ modules })
      -> scope            hubClient.getScopeApi().search({ connections })
        -> hub client     new GithubHubImpl().connect(HubConnectionProfile)
```

Each discovered connection is picked from an accessible listbox
(`src/components/ConnectionPicker.tsx`) that shows its operational status as a
colored dot — see [loading-and-status.md](./loading-and-status.md#status-dots).
Non-usable connections (status not `up`/`standby`) render disabled.

The first four hops are read-only platform discovery. The last hop is the point:

```ts
import { GithubHubImpl } from "@auditlogic/hub-sdk-github-github";
import { HubConnectionProfile } from "@zerobias-org/types-core-js";
import { getZerobiasClientUrl } from "@zerobias-com/zerobias-client";

const profile = new HubConnectionProfile(
  getZerobiasClientUrl("hub", true, env.isLocalDev), // Hub server URL
  api.toUUID(targetId),          // scope id (multi-scope) or connection id (single-scope)
  env.isLocalDev ? env.apiKey : undefined,
  undefined,                     // session
  api.toUUID(org.id),            // org for multi-tenancy
);
const client = new GithubHubImpl();
await client.connect(profile);

const orgs = await client.getOrganizationApi().listMyOrganizations(1, 25);
const repos = await client.getOrganizationApi().listRepositories(
  orgName, OrganizationApi.TypeEnum.All, OrganizationApi.SortEnum.FullName,
  OrganizationApi.DirectionEnum.Asc, 1, 25,
);
```

**The Hub holds the connection's GitHub credentials** — the browser never sees a
GitHub token. `HubConnectionProfile` authenticates the *Hub* call (platform
session cookie in the browser, or the app's API key in local dev) and routes to
the `targetId`.

## The GitHub Hub SDK dependency

Use **`@auditlogic/hub-sdk-github-github`** — the dedicated, lightweight Hub SDK
for the GitHub module (v2 stack, `axios@1`). It ships clean subpath exports, so
no deep paths: the client (`GithubHubImpl`, `OrganizationApi`) is the package
root, and the models (`Organization`, `Repository`) are `.../github/model`. It
needs `@zerobias-org/util-connector` (the `HubConnector` base) at runtime.

> Do **not** use `@auditlogic/module-github-github-client-ts` (6.x, v1 stack —
> `axios@0.27`, `@auditmation/*`; forces a dual-stack install + a critical vuln),
> nor the full `@auditlogic/module-github-github` module package (bundles the
> server impl + octokit). The Hub SDK is the browser client.
>
> Note: the SDK's published `peerDependencies` are stale (`^1.x`) while its real
> runtime deps are all v2 stack, so the app sets `legacy-peer-deps=true` in
> [`.npmrc`](../.npmrc) to let the install resolve (CI and local both need it).
> This is being corrected upstream in `auditlogic/module`; the flag can be
> dropped once the SDK's peerDeps are fixed.

## Prerequisite

A GitHub **connection must already exist in the current org** (created in the
portal). With no connection, the chain runs but lists nothing — the discovery
hops just return empty.
