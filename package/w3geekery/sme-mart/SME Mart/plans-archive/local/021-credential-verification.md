# Plan 021: Credential Verification (Credly Integration)

**Status:** ~~Cancelled~~ — ZB platform feature, not SME Mart
**Phase:** N/A
**Depends on:** N/A
**Source:** Joe Llamas feedback (2026-02-25) — Joe's team built Credly badge verification.

> **Cancelled (2026-02-25):** Joe clarified that credentials (Credly) should live in the **ZB user profile** as a platform-level feature, not in SME Mart. Joe wants to extend the ZB user profile to include assessments, credentials (Credly), avatar (Ready Player Me), and activity history/memory. SME Mart will **consume** credential data from the ZB platform, not build its own Credly integration. Pending discussion with Kevin at standup (2026-02-26).

---

## Purpose

Verified credential badges on provider profiles. Providers link their Credly account, and SME Mart fetches and displays their earned badges. Buyers see which providers have verified, third-party-issued certifications — not just self-declared expertise.

This is a key trust signal. A provider claiming "SOC 2 auditor" means less than a provider showing a verified ISACA CISA badge from Credly.

## What We Know

1. **Credly is the standard** — Credly (by Pearson) is the dominant digital credential platform for professional certifications
2. **Badges are public** — Credly badge data is accessible via API for users who have public profiles
3. **Joe's team has built this** — they have a working integration, sending implementation details
4. **Badges displayed on provider profiles** — visual badge images with issuer, date earned, verification link
5. **Used as a trust signal** — verified credentials complement self-declared skills and assessment results

## Credly API Research

### Public Badge API

Credly provides a public API for accessing badge data for users with public profiles:

```
GET https://www.credly.com/users/{username}/badges
Accept: application/json
```

Returns badge metadata: name, issuer, image URL, description, skills, issue date, expiration.

### Alternative: Credly's Acclaim API (Authenticated)

For deeper integration, Credly offers the Acclaim API (requires API key from Credly):

```
GET https://api.credly.com/v1/obi/badges
Authorization: Bearer {api_key}
```

This provides more control: search by email, verify specific badges, get badge metadata.

### Which Approach?

| Approach | Pros | Cons |
|----------|------|------|
| **Public profile scrape** | No API key needed, works today | Requires public profile, limited data |
| **Acclaim API** | Full access, verify by email, richer data | Needs API key from Credly, may have costs |
| **Provider self-link** | Provider pastes badge URL, we verify | Manual, but simplest to build |

**Recommended start: Provider self-link + public verification.** Provider adds their Credly profile URL or specific badge URLs. SME Mart fetches badge metadata from Credly's public API to verify and display. Upgrade to Acclaim API later if needed.

## Architecture

### Data Model (new Neon tables)

```sql
-- Provider's linked Credly credentials
CREATE TABLE provider_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
  -- Credential source
  source VARCHAR(50) NOT NULL DEFAULT 'credly',    -- 'credly', 'manual', 'assessment'
  -- Credly-specific fields
  credly_badge_id VARCHAR(255),                     -- Credly's badge template ID
  credly_badge_url VARCHAR(500),                    -- Full URL to the badge on Credly
  credly_username VARCHAR(255),                     -- Provider's Credly username
  -- Badge display data (cached from Credly API)
  badge_name VARCHAR(255) NOT NULL,
  badge_description TEXT,
  badge_image_url VARCHAR(500),                     -- Credly badge image (hosted by Credly)
  issuer_name VARCHAR(255),                         -- e.g., "ISACA", "CompTIA", "(ISC)²"
  issuer_image_url VARCHAR(500),
  -- Dates
  issued_at TIMESTAMP,
  expires_at TIMESTAMP,                             -- NULL = no expiration
  -- Skills/tags from the credential (Credly provides these)
  skills JSONB DEFAULT '[]',                        -- ["Risk Management", "SOC 2", "Audit"]
  -- Verification
  verification_status VARCHAR(20) DEFAULT 'pending',
    -- 'pending', 'verified', 'expired', 'revoked', 'failed'
  verified_at TIMESTAMP,
  last_checked_at TIMESTAMP,
  -- Metadata
  is_visible BOOLEAN DEFAULT true,                  -- Provider can hide specific badges
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Link credentials to ZeroBias Catalog items (optional enrichment)
CREATE TABLE credential_catalog_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credential_id UUID NOT NULL REFERENCES provider_credentials(id) ON DELETE CASCADE,
  catalog_type VARCHAR(50) NOT NULL,                -- 'skill', 'framework', 'product'
  catalog_item_id VARCHAR(255) NOT NULL,
  catalog_item_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Neon VIEWs

```sql
-- For provider cards: credential badges summary
CREATE VIEW v_provider_credentials AS
SELECT
  pc.provider_id,
  COALESCE(
    json_agg(json_build_object(
      'id', pc.id,
      'badgeName', pc.badge_name,
      'badgeImageUrl', pc.badge_image_url,
      'issuerName', pc.issuer_name,
      'issuedAt', pc.issued_at,
      'expiresAt', pc.expires_at,
      'verificationStatus', pc.verification_status,
      'source', pc.source
    ) ORDER BY pc.sort_order, pc.issued_at DESC)
    FILTER (WHERE pc.is_visible = true AND pc.verification_status = 'verified'),
    '[]'
  ) AS verified_credentials,
  COUNT(*) FILTER (WHERE pc.verification_status = 'verified' AND pc.is_visible = true) AS credential_count
FROM provider_credentials pc
GROUP BY pc.provider_id;
```

### Services

```typescript
// credential.service.ts
@Injectable({ providedIn: 'root' })
export class CredentialService {
  // Provider actions
  addCredlyBadge(providerId: string, badgeUrl: string): Observable<ProviderCredential>
  linkCredlyProfile(providerId: string, credlyUsername: string): Observable<ProviderCredential[]>
  removeCredential(credentialId: string): Observable<void>
  toggleVisibility(credentialId: string, visible: boolean): Observable<void>
  reorderCredentials(providerId: string, orderedIds: string[]): Observable<void>

  // Display
  getProviderCredentials(providerId: string): Observable<ProviderCredential[]>
  getVerifiedCredentials(providerId: string): Observable<ProviderCredential[]>  // Verified + visible only

  // Verification (called after adding a badge)
  verifyCredential(credentialId: string): Observable<VerificationResult>
  refreshCredential(credentialId: string): Observable<ProviderCredential>  // Re-check with Credly

  // Credly API integration
  fetchCredlyProfile(username: string): Observable<CredlyBadge[]>
  fetchCredlyBadge(badgeUrl: string): Observable<CredlyBadge>

  // Admin
  listAllCredentials(filters?: CredentialFilters): Observable<ProviderCredential[]>
  bulkVerify(credentialIds: string[]): Observable<VerificationResult[]>
  getCredentialStats(): Observable<CredentialStats>

  // Catalog linking
  linkToCatalog(credentialId: string, catalogType: string, catalogItemId: string): Observable<void>
  getCredentialCatalogLinks(credentialId: string): Observable<CredentialCatalogLink[]>
}
```

### Credly Integration Service

```typescript
// credly-api.service.ts
@Injectable({ providedIn: 'root' })
export class CredlyApiService {
  // Fetch badge data from Credly's public endpoints
  // NOTE: This runs client-side. If CORS is an issue, may need a
  // Hub Module or serverless proxy. TBD based on Credly API behavior.

  fetchPublicProfile(username: string): Observable<CredlyProfile> {
    // GET https://www.credly.com/users/{username}/badges.json
    // Parse response into CredlyBadge[]
  }

  fetchBadgeMetadata(badgeUrl: string): Observable<CredlyBadgeMetadata> {
    // Extract badge ID from URL
    // GET https://www.credly.com/badges/{badgeId}.json
    // Parse: name, description, image, issuer, skills, dates
  }

  verifyBadgeExists(badgeUrl: string): Observable<boolean> {
    // HEAD request to check badge URL is valid and public
  }
}
```

### UI Components

#### Provider-Facing (My Profile)

| Component | Purpose |
|-----------|---------|
| `MyCredentialsComponent` | Manage credentials: add from Credly, toggle visibility, reorder |
| `AddCredentialDialog` | Dialog: paste Credly badge URL or enter Credly username to import all |
| `CredentialCardComponent` | Single credential display with badge image, issuer, status, actions |
| `CredlyImportComponent` | After entering Credly username: shows all public badges, provider selects which to import |

#### Display (Provider Cards & Profiles)

| Component | Purpose |
|-----------|---------|
| `CredentialBadgeChipComponent` | Small badge chip for provider cards (image + name, compact) |
| `CredentialBadgeListComponent` | Full credential display for provider detail page (image, issuer, date, skills) |
| `VerifiedBadgeIcon` | Small checkmark/shield icon indicating credential is Credly-verified |

#### Admin

| Component | Purpose |
|-----------|---------|
| `AdminCredentialsComponent` | List all provider credentials, filter by status, bulk verify |
| `CredentialDetailDialog` | View full credential data, Credly source link, verification history |

#### Integration Points (Existing Components)

| Existing Component | Change |
|-------------------|--------|
| `ProviderCard` | Add credential badge chips (top 3 verified, "+N more" if many) |
| `ProviderDetail` | Add "Verified Credentials" section between expertise and services |
| `ProfileSidebar` | Add "My Credentials" nav item |
| `AdminPanel` | Add "Credentials" tab |
| `v_provider_directory` | Update to JOIN with `v_provider_credentials` |
| `v_provider_detail` | Update to include credential data |

### Routes

```typescript
// My profile sub-route
{ path: 'my-profile/credentials', component: MyCredentialsComponent },

// Admin sub-route
{ path: 'admin/credentials', component: AdminCredentialsComponent },
```

### Provider Flow

```
Provider navigates to My Profile → Credentials
  → Clicks "Add from Credly"
  → Option A: Paste a specific badge URL
    → System fetches badge metadata from Credly
    → Shows preview (image, name, issuer, date)
    → Provider confirms → saves to provider_credentials
    → Background verification runs

  → Option B: Enter Credly username
    → System fetches all public badges for that user
    → Shows list with checkboxes
    → Provider selects which to import
    → Bulk save → background verification for each

Verification:
  → System checks badge URL is valid and public on Credly
  → Extracts badge metadata (name, issuer, image, skills, dates)
  → Sets verification_status = 'verified'
  → Caches image URL and metadata locally
  → Badge appears on provider profile with verified checkmark

Periodic refresh (future):
  → Cron/scheduled check of verified credentials
  → Detects: expired, revoked, profile made private
  → Updates verification_status accordingly
```

### Display Priority on Provider Cards

Provider cards have limited space. Display logic for credential badges:

```typescript
// Show top 3 credentials by priority:
// 1. Most relevant to the page context (if on an RFP, match RFP skills)
// 2. Most prestigious issuers (ISACA, CompTIA, (ISC)², AWS, etc.)
// 3. Most recently earned
// Show "+N more" chip if provider has additional credentials
```

## CORS Consideration

Credly's public API may not have CORS headers for browser-side requests. If so, options:

1. **Hub Module proxy** — route Credly API calls through a Generic SQL function or custom Hub Module
2. **Serverless function** — Vercel/Cloudflare worker as a proxy (temporary, like current Vercel setup)
3. **Server-side caching** — fetch and cache badge data server-side, serve from our DB
4. **OEmbed** — Credly supports OEmbed for badge display (simpler but less control)

**Most likely:** We cache all badge data in `provider_credentials` after initial fetch. Display always comes from our DB, not live Credly calls. Refresh on demand or periodic schedule.

## Open Questions (Awaiting Joe's Doc)

1. **Credly API access** — does Joe's team use the public API or the authenticated Acclaim API?
2. **Badge verification depth** — just check URL exists, or verify the badge belongs to that specific user?
3. **Non-Credly credentials** — support for other credential platforms (Coursera, LinkedIn Learning, custom)?
4. **Manual credentials** — can providers add non-Credly certifications manually (with admin approval)?
5. **Catalog auto-linking** — can we automatically map Credly badge skills to ZeroBias Catalog items?
6. **Badge expiration handling** — visual indicator for expiring-soon credentials? Auto-hide expired?
7. **Trust tiers** — should Credly-verified badges look different from self-declared certifications?

## Verification

1. Provider can add a Credly badge URL and see it verified
2. Provider can import multiple badges from Credly username
3. Verified badges display on provider cards (compact chips)
4. Verified badges display on provider detail (full view with issuer, date)
5. Unverified/expired badges show appropriate status
6. Provider can hide/show individual credentials
7. Admin can see all credentials and verification statuses
8. Provider cards show top 3 credentials with "+N more"

---

## Dependencies

- Joe's LLM doc with Credly implementation details (AWAITING)
- New Neon tables (2 tables, 1 VIEW)
- CORS testing with Credly's public API
- Credly badge image hosting (they host, we link — verify CDN access)
