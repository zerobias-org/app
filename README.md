# ZeroBias Example / Custom Apps

Example and custom Single-Page Apps that run on the **ZeroBias platform** —
embedded in the portal as iframes, or standalone. This repo builds each app to a
static bundle and deploys it to S3/CloudFront.

Agents & contributors: see **[AGENTS.md](./AGENTS.md)** for the full app-creation
convention, deploy mechanics, and gotchas.

## Where apps live — naming convention

```
package/<org-slug>/<app-name>/
```

- **`<org-slug>`** — the ZeroBias **platform org slug** that owns the app
  (e.g. `zerobias`, `w3geekery`, `raghu`, `miraxr`). It is an **org**, not the
  app's own name. Reuse an existing org folder or add one named for your org's
  slug.
- **`<app-name>`** — the app directory. It must equal the `name` in the app's
  `package.json`, and it becomes the deployed URL path
  (`app-<env>-zerobias.com/<app-name>/`).

Exactly two levels under `package/`. For example:

```
package/zerobias/example-nextjs-v2     # ZeroBias's own v2 reference app
package/w3geekery/sme-mart             # W3Geekery's app
package/raghu/<app-name>               # an app owned by the "raghu" org
```

> Do **not** double-nest or use the app name as the group
> (e.g. `package/auditcrowd/auditcrowd/`). The group segment must be an **org
> slug**. See [AGENTS.md](./AGENTS.md#directory--naming-convention) for why.

## Starting a new app

**Clone the v2 reference:** [`package/zerobias/example-nextjs-v2`](./package/zerobias/example-nextjs-v2/).
It uses the latest Next.js and the **v2** client (`@zerobias-com/zerobias-client`)
+ SDKs, with the correct auth, session, env, and deploy patterns already wired.

```bash
cp -r package/zerobias/example-nextjs-v2 package/<your-org-slug>/<your-app>
# then in the new folder: set package.json "name" + basePath to <your-app>, and
# see its README.md / AGENTS.md.
```

> The older `example-nextjs` and `example-angular` are **v1** (legacy
> `@auditmation` client). Keep them for reference, but don't use them as the
> model for new apps — clone `example-nextjs-v2`.

## Deploy

Pushing to `main` / `uat` / `qa` auto-deploys every changed app to the matching
environment. A commit to `main` is a **production** release. Details, required
files, and the CI pipeline: [AGENTS.md](./AGENTS.md#deploy).
