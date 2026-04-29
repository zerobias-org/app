# UAT CloudFront Cache Invalidation Playbook

**When to use this:** UAT deploy (e.g. a PR merged `zerobias-org/app:uat`) completed successfully, Slack announcement posted, but `https://uat.zerobias.com/sme-mart/` still shows old code in browser. This is CloudFront serving stale `index.html` from edge cache despite S3 being updated. Different edges can serve different versions (one viewer sees fresh, another sees stale).

**Symptom signatures:**
- Browser shows old UI layout despite successful deploy workflow.
- `view-source` shows `<script src="main-XXXXXXXX.js">` with a hash different from what `curl https://uat.zerobias.com/sme-mart/` returns.
- Some app features update (new code in `main.js` loaded on fresh edge), others don't (old `index.html` references old `main.js`).
- Hard refresh / incognito don't help — it's an edge cache issue, not browser cache.

**Why this is needed:** The `Deploy App` workflow in `zerobias-org/app` does NOT run a CloudFront invalidation step after the S3 sync. Until the CF TTL expires (hours to a day depending on distribution config), edges keep serving cached `index.html`.

## Manual Invalidation — Step-by-Step

### 1. Assume production-poweruser role for the UAT AWS account

UAT lives in the production AWS account (not a separate account).

Open: <https://neverfail.awsapps.com/start/#/?tab=accounts>

Select **production** account → **PowerUserAccess** role → **Management console**.

### 2. Open the UAT CloudFront distribution

Direct link:
<https://us-east-1.console.aws.amazon.com/cloudfront/v4/home?region=us-east-1#/distributions/E23VJPBBDUCHBQ>

(Distribution ID: `E23VJPBBDUCHBQ`)

### 3. Create invalidation

- Click the **Invalidations** tab
- Click **Create invalidation**
- Enter object path: `/*`
- Click **Create invalidation**

Invalidation typically completes in 3-5 minutes. All edges refetch from S3 on next request. Browser will get the latest `index.html` (and thus the latest fingerprinted `main-*.js`).

### Verify after invalidation

```bash
curl -s "https://uat.zerobias.com/sme-mart/?c=$(date +%s)" | grep -oE 'main-[A-Z0-9]+\.js'
```

This should match the hash in your browser's `view-source` after you hard refresh. If they match, cache is consistent.

## Alternative — AWS CLI (if you prefer)

```bash
aws cloudfront create-invalidation \
  --distribution-id E23VJPBBDUCHBQ \
  --paths "/*" \
  --profile <your-poweruser-profile>
```

## Permanent fix — Andrey owns this

Andrey will add a CloudFront invalidation step to the `Deploy App` workflow in `zerobias-org/app` when he gets to it (timing TBD). Until then, manual invalidation per above is the workflow.

Don't file new tickets or nudge — Clark said it's fine as-is until Andrey gets around to it.

## Related

- Deploy workflow source: `zerobias-org/app/.github/workflows/` (S3 sync step uploads to `app-uat-zerobias.com/sme-mart/` but has no invalidation step)
- S3 bucket: `app-uat-zerobias.com`
- CloudFront distribution: `E23VJPBBDUCHBQ` (UAT)
