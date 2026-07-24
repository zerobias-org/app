import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import { ZerobiasClientOrgIdService } from '@zerobias-com/zerobias-angular-client';
import { NewProject } from '@zerobias-com/platform-sdk';
import { PROJECT_TYPE_ID } from '../constants/project-types';

// SDK 2.x (Nic 2026-07-01): a project's tier IS its projectType. The old marketplace
// engagement-identity tag machinery (Step A: TAG_TYPE / MARKETPLACE_OPERATOR_ORG_ID /
// buildEngagementTagName / SME_MART_TIER_PROJECT_TAG_ID) is retired — engagement identity
// is now projectType==engagement + ownerId, and the project tier is projectType==project.

// Project.list() probe page-size. Covers single-engagement orgs (v1.4 norm).
// When D-46 multi-engagement future state lands, switch to pagination loop —
// see BACKLOG PROVISIONER-PROBE-PAGINATION-1.
const PROBE_PAGE_SIZE = 100;

// Step C: engagement-project values (D-32 superseded 2026-05-15, D-33 superseded 2026-05-15)
// New convention: customer-org is the implicit context (engagement card always rendered in owner-org
// scope), so orgName is dropped from the name. The OTHER party's role (provider/client) is the only
// asymmetry that needs to be encoded. For the default platform engagement, ZeroBias Platform is the
// provider. Arrows dropped in favor of corporate prose. Closes BACKLOG-101.
const ENGAGEMENT_PROJECT_NAME = 'Engagement with provider ZeroBias Platform';
const ENGAGEMENT_PROJECT_DESCRIPTION_TEMPLATE = (orgName: string) =>
  `Platform services engagement provided by ZeroBias Platform for ${orgName}.`;

// Step D: project-tier values (depth 2; FIXED per D-50; D-34 locked, D-35 superseded 2026-05-15)
const PROJECT_TIER_NAME = 'ZeroBias Platform'; // D-34 (unchanged)
const PROJECT_TIER_DESCRIPTION_TEMPLATE = (orgName: string) =>
  `${orgName}'s gateway into ZeroBias — tasks, notes, and communication tied to the platform services engagement with ZeroBias Platform live here.`;

// Enum values (locked per MCP describe D-29, INVENTORY.md confirms)
const PROJECT_STATUS = 'active'; // D-29
const PROJECT_VISIBILITY = 'internal'; // D-29 (org-members only)
const PROJECT_MEMBERSHIP_POLICY = 'private'; // D-29 (no auto-join; admin-curated)

/**
 * PlatformEngagementProvisioner provisions the org's "platform engagement" — the
 * (org <-> ZeroBias) engagement for platform services, distinct from the org's
 * vendor engagements with marketplace providers.
 *
 * v3 recipe (3 SDK calls per provisioning; validated empirically on UAT 2026-05-12):
 *   A. Create hydra marketplace Tag for the engagement identity (NEW namespace).
 *   C. Create platform.Project (Engagement, depth 1; FIXED tier per D-50)
 *      — auto-creates default Board; auto-assigns creator as Lead
 *   D. Create child platform.Project (Project tier, depth 2; FIXED tier per D-50)
 *      — tagged with SME_MART_TIER_PROJECT_TAG_ID so the tier is queryable
 *      — auto-creates default Board; auto-assigns creator as Lead (D-48 cascade)
 *
 * Steps F (explicit Board creation) and G (explicit member add) were dropped post-Plan-02
 * once UAT validation 2026-05-12 confirmed platform.Project.create's auto-Board + auto-Lead
 * behaviors obviate them. See DEVIATION-29.5-02-V3 in 29.5-WAVE-2-CLOSE.md.
 *
 * Depth-3+ middle tiers (Workspace/Aperture/Thread per Brian's canonical sketch) are
 * RENAMEABLE and NOT instantiated by v1.4.
 *
 * Each step has an idempotency probe to detect and skip already-created resources,
 * enabling failure-resumable provisioning on retry. All probes use the positional
 * SDK.list() signature + client-side filter — see errata 036 (a) for why object-form
 * .list({tagId, parentId}) was silently ignored by previous versions.
 *
 * NOTE on ownership: the platform-sdk NewProject DTO does NOT accept ownerId
 * (errata 036 (b)). Server derives ownerId from session context (Dana-Org-Id header).
 * The caller's session must be on the buyer org BEFORE calling this method — Phase 31
 * admin-tab work must handle session-switching for cross-org operator provisioning.
 *
 * Per Phase 29.5 CONTEXT.md (D-29..D-37, D-46, D-48, D-49, D-50).
 */
@Injectable({ providedIn: 'root' })
export class PlatformEngagementProvisioner {
  private readonly clientApi = inject(ZerobiasClientApi);
  private readonly orgIdService = inject(ZerobiasClientOrgIdService);
  private readonly snackBar = inject(MatSnackBar);

  /**
   * Flip the SDK's `dana-org-id` session header to the given org.
   *
   * Why this lives in the provisioner: hydra and platform apply session-scope
   * visibility filters that the API request body cannot override. To find an
   * operator-owned tag we must call from the operator session; to create a
   * platform.Project with a given ownerId we must call from that org's
   * session (NewProject DTO has no `ownerId` field — server derives from
   * session). The recipe therefore orchestrates its own scope flips: tag
   * operations run in OPERATOR scope, Project operations in TARGET scope.
   *
   * Callers MUST restore the starting scope in a try/finally; the recipe
   * does this internally but its own callers (admin tab) own their own
   * outer restore.
   *
   * Caller permission caveat: switching scope is a client-side header flip.
   * The SERVER will still reject requests if the calling user isn't a member
   * of the target scope. This works for operator-admin flows (admin who's a
   * member of both operator and target) but NOT for non-operator end users
   * (e.g., a regular target-org user has no operator membership and will
   * 403 on any operator-scope call). For non-operator probes the call site
   * must catch and treat 403 as "unknown" rather than "not provisioned".
   */
  private async setScope(orgId: string): Promise<void> {
    this.orgIdService.setCurrrenOrgId(orgId);
    await this.clientApi.reconnectWithOrgId(orgId);
  }

  /**
   * Read-only: returns true iff the org has a provisioned platform engagement.
   *
   * Authoritative signal is the existence of an Engagement Project (depth 1,
   * parentId==null) whose tagId resolves to a hydra marketplace Tag in either
   * the NEW namespace (`sme-mart.engagement.`) or LEGACY namespace
   * (`sme-mart.eng.`). Probes both namespaces; verifies the Engagement Project
   * actually exists (defends against orphan-tag false-positive: the Brian's-Org
   * case where the tag survived after the Project was deleted).
   *
   * Slug source (in order): platform-canonical `orgSlug` from `Org.slug`, or
   * `slugify(orgName)` fallback. Platform slug is preferred because it's
   * lowercased nmtoken with no whitespace/punctuation surprises (e.g.
   * "Brian Hierholzer Inc." -> platform=`brianhierholzer`, fallback=`brian-hierholzer-inc`).
   *
   * Returns `false` on probe error — caller treats "no tag/project found" and
   * "probe failed" the same: route the user to the holding page; do not auto-create.
   *
   * Used by `onboardingGuard` to decide whether the user can use the app.
   * NEVER triggers any create — pure read.
   */
  async isOrgProvisioned(orgId: string, orgName: string, _orgSlug?: string): Promise<boolean> {
    if (!orgId || !orgName) return false;
    const startingScope = this.orgIdService.getCurrentOrgId();
    try {
      // Authoritative signal: an Engagement Project (parentId==null, projectType==engagement)
      // owned by the org. SDK 2.x identity = projectType + ownerId; the retired marketplace
      // tag and its errata-041 operator-scope probe are gone. platform.Project.list applies
      // session-scope visibility, so probe in TARGET scope.
      await this.setScope(orgId);
      const projects = await this.clientApi.platformClient
        .getProjectApi()
        .list(undefined, PROBE_PAGE_SIZE, undefined, orgId as never);
      const engagementProject = projects?.items?.find(
        (p) => p.parentId == null && String(p.projectTypeId) === PROJECT_TYPE_ID.engagement,
      );
      return !!engagementProject;
    } catch (err) {
      console.warn('[PLATFORM_ENGAGEMENT_PROBE_FAILED]', { orgId, error: err });
      return false;
    } finally {
      // Restore the starting scope. Best-effort — log on failure but don't
      // re-throw (would mask the original return value).
      if (startingScope && startingScope !== this.orgIdService.getCurrentOrgId()) {
        try {
          await this.setScope(startingScope);
        } catch (restoreErr) {
          console.error('[PLATFORM_ENGAGEMENT_SCOPE_RESTORE_FAILED]', restoreErr);
        }
      }
    }
  }

  /**
   * Ensures the target Org has a platform engagement.
   * Idempotent: fires at most once per Org. Failure-resumable: retries detect partial state.
   *
   * Uses the v3 platform.Project recipe (Steps A/C/D, 3 SDK creates).
   * Default Board and Project Lead are auto-created by platform.Project.create.
   *
   * @param input.currentOrgId — Buyer org UUID
   * @param input.currentOrgName — Buyer org display name (for tag/project strings)
   * @param input.currentOrgSlug — Buyer org slug (preferred); falls back to slugify(orgName)
   * @returns { engagementProjectId, projectTierProjectId, created: boolean }
   * @throws Error if any step fails after snackbar
   */
  async ensurePlatformEngagement(input: {
    currentOrgId: string;
    currentOrgName: string;
    currentOrgSlug?: string;
  }): Promise<{ engagementProjectId: string; projectTierProjectId: string; created: boolean }> {
    const { currentOrgId, currentOrgName } = input;
    const startingScope = this.orgIdService.getCurrentOrgId();

    try {
      // Idempotency probe: check if platform engagement already exists.
      // isOrgProvisioned manages its own scope flips internally and restores
      // the starting scope before returning, so the next setScope call below
      // is required (not redundant).
      const isProvisioned = await this.isOrgProvisioned(currentOrgId, currentOrgName);

      if (isProvisioned) {
        return { engagementProjectId: '', projectTierProjectId: '', created: false };
      }

      // Steps C + D: create Engagement Project + Project tier in TARGET scope.
      // SDK 2.x: engagement identity is projectType==engagement + ownerId; the marketplace
      // identity tag (old Step A) is retired — no tag creation / operator-scope hop needed.
      // platform.Project.create has no payload ownerId field; server derives ownership from
      // session (errata 040). Target scope ensures correct ownerId attribution.
      await this.setScope(currentOrgId);

      const engagementProjectId = await this.ensureEngagementProject(
        currentOrgName,
        currentOrgId,
      );

      const projectTierProjectId = await this.ensureProjectTier(
        currentOrgName,
        currentOrgId,
        engagementProjectId,
      );

      return { engagementProjectId, projectTierProjectId, created: true };
    } finally {
      // Restore the caller's starting scope. Caller (admin tab) still owns its
      // outer restore in its own finally — this is the inner safety net.
      if (startingScope && startingScope !== this.orgIdService.getCurrentOrgId()) {
        try {
          await this.setScope(startingScope);
        } catch (restoreErr) {
          console.error('[PLATFORM_ENGAGEMENT_SCOPE_RESTORE_FAILED]', restoreErr);
        }
      }
    }
  }

  /**
   * Step C: Create Engagement Project (depth 1; FIXED tier per D-50).
   *
   * Top-level Project, projectType==engagement (SDK 2.x identity — no marketplace tag).
   * boundaryId is intentionally omitted — Engagement is org-level scope per
   * ENGAGEMENT-BOUNDARY-SCOPE-REVISIT-1 (and D-47 boundary subset chain bug
   * means we cannot rely on boundary inheritance today).
   *
   * Auto-side-effects of platform.Project.create (verified UAT 2026-05-12):
   *   - default Board created (name "{projectName} Board"; v1.4 accepts auto-name)
   *   - creator auto-assigned as Project Lead
   *
   * Idempotent: server-filters Projects by ownerId; client-filters by parentId==null
   * + projectType==engagement.
   */
  private async ensureEngagementProject(
    orgName: string,
    buyerOrgId: string,
  ): Promise<string> {
    try {
      const all = await this.clientApi.platformClient
        .getProjectApi()
        .list(undefined, PROBE_PAGE_SIZE, undefined, buyerOrgId as never);
      // SDK 2.x: identity = projectType==engagement + ownerId (list is ownerId-scoped);
      // the retired marketplace tagId is gone (Nic 2026-07-01).
      const existing = all?.items?.find(
        (p) => p.parentId == null && String(p.projectTypeId) === PROJECT_TYPE_ID.engagement,
      );
      if (existing) {
        return String(existing.id);
      }

      // Construct via NewProject (errata 036 (c)); ownerId server-derived from
      // session (errata 036 (b) — NewProject DTO has no ownerId field).
      const newProject = new NewProject(
        ENGAGEMENT_PROJECT_NAME,
        PROJECT_STATUS as never,
        PROJECT_VISIBILITY as never,
        PROJECT_MEMBERSHIP_POLICY as never,
        ENGAGEMENT_PROJECT_DESCRIPTION_TEMPLATE(orgName),
      );
      newProject.parentId = null;
      newProject.projectTypeId = PROJECT_TYPE_ID.engagement as never;

      const created = await this.clientApi.platformClient
        .getProjectApi()
        .create(newProject);

      return String(created.id);
    } catch (err) {
      console.warn('[PLATFORM_ENGAGEMENT_FAILURE]', {
        step: 'C',
        callSiteTag: 'platform-engagement:ensure-engagement-project',
        error: err,
      });
      this.snackBar.open('Setup in progress — please retry in a moment.', 'Dismiss', {
        duration: 5000,
      });
      throw err;
    }
  }

  /**
   * Step D: Create Project-tier Project (depth 2; FIXED tier per D-50).
   *
   * Child of the Engagement Project. Tagged with SME_MART_TIER_PROJECT_TAG_ID
   * so the tier is queryable via hydra. Display name is the locked constant
   * "ZeroBias Platform" (D-34); description from D-35 with ${orgName} substituted.
   *
   * Per D-50: this is the "Project" tier — NOT "Workspace". Workspace/Aperture/Thread
   * are renameable depth-3+ tiers NOT instantiated by v1.4.
   *
   * Auto-side-effects of platform.Project.create (verified UAT 2026-05-12):
   *   - default Board created (name "ZeroBias Platform Board"; v1.4 accepts auto-name)
   *   - creator auto-assigned as Project Lead (D-48 cascade inherits from parent chain)
   *
   * Idempotent: server-filters Projects by ownerId; client-filters by
   * parentId==engagementProjectId. See errata 036 (a).
   */
  private async ensureProjectTier(
    orgName: string,
    buyerOrgId: string,
    engagementProjectId: string,
  ): Promise<string> {
    try {
      const all = await this.clientApi.platformClient
        .getProjectApi()
        .list(undefined, PROBE_PAGE_SIZE, undefined, buyerOrgId as never);
      const existing = all?.items?.find(
        (p) => p.parentId != null && String(p.parentId) === engagementProjectId,
      );
      if (existing) {
        return String(existing.id);
      }

      // Construct via NewProject (errata 036 (c)); ownerId server-derived (errata 036 (b)).
      const newProject = new NewProject(
        PROJECT_TIER_NAME,
        PROJECT_STATUS as never,
        PROJECT_VISIBILITY as never,
        PROJECT_MEMBERSHIP_POLICY as never,
        PROJECT_TIER_DESCRIPTION_TEMPLATE(orgName),
      );
      newProject.parentId = engagementProjectId as never;
      newProject.projectTypeId = PROJECT_TYPE_ID.project as never;

      const created = await this.clientApi.platformClient
        .getProjectApi()
        .create(newProject);

      return String(created.id);
    } catch (err) {
      console.warn('[PLATFORM_ENGAGEMENT_FAILURE]', {
        step: 'D',
        callSiteTag: 'platform-engagement:ensure-project-tier',
        error: err,
      });
      this.snackBar.open('Setup in progress — please retry in a moment.', 'Dismiss', {
        duration: 5000,
      });
      throw err;
    }
  }
}

// Re-export SME_MART_TIER_PROJECT_TAG_ID from new constants file for caller stability
// (engagements.service and feature-coming-soon need this constant)
export { SME_MART_TIER_PROJECT_TAG_ID } from '../constants/tier-tags';
