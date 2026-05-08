import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import { CreateTagBody, TagSearchBody } from '@zerobias-com/hydra-sdk';
import { Nmtoken } from '@zerobias-org/types-core-js';
import { PipelineWriteService } from './pipeline-write.service';
import { GraphqlReadService } from './graphql-read.service';
import { slugify } from '../utils/slug';

/** Tag type used for the platform-engagement marketplace tag */
const TAG_TYPE = 'marketplace';

/**
 * Supply-side slug used in the engagement-identity tag name.
 * Per DECISIONS.md "Engagement Tag Naming: Identity Tag (`{supply}-to-{demand}`)" (2026-05-07).
 * For the platform engagement, supply = ZeroBias.
 */
const PLATFORM_SUPPLY_SLUG = 'zerobias';

/**
 * Marketplace operator org UUID — owns all sme-mart.eng.* identity tags.
 * Today this is W3Geekery (the org currently running SME Mart). When SME Mart graduates
 * into the ZB platform, flip this to ZeroBias. Externalize to env config at that time
 * (BACKLOG: marketplace-operator-config). Hardcoded here for now per Clark direction
 * 2026-05-07 — env plumbing deferred.
 */
const MARKETPLACE_OPERATOR_ORG_ID = 'cd7105df-523d-5392-9f9a-3f83d3f30107'; // W3Geekery

/**
 * Display strings for the auto-provisioned Engagement record + its child Project.
 * Easy-to-change so verbiage iterates without hunting through the recipe body.
 * Both follow the supply-to-demand arrow convention from DECISIONS.md.
 */
const platformEngagementDescription = (orgName: string) =>
  `Platform Services Engagement: ZeroBias ➡️ ${orgName}`;
const PLATFORM_PROJECT_NAME = 'ZeroBias Platform';
const platformProjectDescription = (orgName: string) =>
  `${orgName}'s gateway into ZeroBias — tasks, notes, and communication tied to the ZeroBias ➡️ ${orgName} platform engagement live here.`;

/**
 * PlatformEngagementProvisioner provisions the org's "platform engagement" — the
 * (org <-> ZeroBias) engagement for platform services, distinct from the org's
 * vendor engagements with marketplace providers.
 *
 * 5-call recipe (Steps A–E):
 *   A. Create hydra marketplace Tag for the engagement
 *   B. Create platform coordination Task assigned to the user
 *   C. Push the Engagement entity (tagged + task-linked)
 *   D. Tag the coordination Task with the engagement tag
 *   E. Push the engagement's "ZeroBias Platform" project
 *
 * Each step has an idempotency probe to detect and skip already-created resources,
 * enabling failure-resumable provisioning on retry.
 *
 * Per Phase 27 CONTEXT.md.
 */
@Injectable({ providedIn: 'root' })
export class PlatformEngagementProvisioner {
  private readonly clientApi = inject(ZerobiasClientApi);
  private readonly pipelineWrite = inject(PipelineWriteService);
  private readonly graphqlRead = inject(GraphqlReadService);
  private readonly snackBar = inject(MatSnackBar);

  /**
   * Read-only: returns true iff the org has a provisioned platform engagement.
   *
   * Authoritative signal is the hydra marketplace Tag named
   * `sme-mart.eng.zerobias-to-{orgSlug}` (per DECISIONS.md 2026-05-07 identity-tag
   * convention: `{supply}-to-{demand}`). Tag is owned by the marketplace operator
   * org (today W3Geekery) so probes from any operator-admin session resolve
   * correctly. Hydra is independent of AuditgraphDB, so this probe is decoupled
   * from GQL boundary failures.
   *
   * Slug source (in order): platform-canonical `orgSlug` from `Org.slug`, or
   * `slugify(orgName)` fallback. Platform slug is preferred because it's
   * lowercased nmtoken with no whitespace/punctuation surprises (e.g.
   * "Brian Hierholzer Inc." -> platform=`brianhierholzer`, fallback=`brian-hierholzer-inc`).
   *
   * Returns `false` on probe error — caller treats "no tag found" and "probe
   * failed" the same: route the user to the holding page; do not auto-create.
   *
   * Used by `onboardingGuard` to decide whether the user can use the app.
   * NEVER triggers any create — pure read.
   */
  async isOrgProvisioned(orgId: string, orgName: string, orgSlug?: string): Promise<boolean> {
    if (!orgId || !orgName) return false;
    const slug = orgSlug || slugify(orgName);
    const tagName = `sme-mart.eng.${PLATFORM_SUPPLY_SLUG}-to-${slug}`;
    try {
      const body = new TagSearchBody();
      body.name = tagName;
      const result = await this.clientApi.hydraClient
        .getTagApi()
        .searchTags(1, 1, undefined, body);
      return !!(result && result.items && result.items.length > 0);
    } catch (err) {
      console.warn('[PLATFORM_ENGAGEMENT_PROBE_FAILED]', { orgId, error: err });
      return false;
    }
  }

  /**
   * Ensures the target Org has a platform engagement.
   * Idempotent: fires at most once per Org. Failure-resumable: retries detect partial state.
   *
   * RACI on the coordination Task (verified 2026-05-06 via UAT smoke test):
   *   - assigned    = target org's org-party (R: org collectively responsible — surfaces in Boundary Manager)
   *   - accountable = target org's admin user-party (A: human signs off — surfaces in Governance with boundary filter)
   *   - approvers   = []                                                       (C)
   *   - notified    = []                                                       (I; accountable surfacing covers it)
   *
   * @param input.currentOrgId — Buyer org UUID
   * @param input.currentOrgName — Buyer org display name (for tag/task/engagement strings)
   * @param input.currentOrgSlug — Buyer org slug (preferred); falls back to slugify(orgName)
   * @param input.buyerUserId — Buyer-side admin user principal UUID (stamped on engagement.buyerZerobiasUserId)
   * @param input.assignedPartyId — Party UUID for task `assigned` (R) — typically the target org's org-party
   * @param input.accountablePartyId — Party UUID for task `accountable` (A) — typically the buyer-side admin user's party
   * @returns { engagementId, projectId, created: boolean }
   * @throws Error if any step fails after snackbar
   */
  async ensurePlatformEngagement(input: {
    currentOrgId: string;
    currentOrgName: string;
    currentOrgSlug?: string;
    buyerUserId: string;
    assignedPartyId: string;
    accountablePartyId: string;
  }): Promise<{ engagementId: string; projectId: string; created: boolean }> {
    const {
      currentOrgId,
      currentOrgName,
      currentOrgSlug,
      buyerUserId,
      assignedPartyId,
      accountablePartyId,
    } = input;

    // Step 0: Discovery query — check if platform engagement already exists
    const existing = await this.graphqlRead.query<{
      id: string;
      tag: Array<{ value: string }>;
    }>('Engagement', ['id', 'tag'], {
      filters: { buyerZerobiasOrgId: `.eq.${currentOrgId}` },
    });

    if (existing && existing.items && existing.items.length >= 1) {
      return { engagementId: existing.items[0].id, projectId: '', created: false };
    }

    const orgSlug = currentOrgSlug || slugify(currentOrgName);

    // Step A: Create hydra tag
    const tagId = await this.ensureTag(orgSlug, currentOrgId, currentOrgName);

    // Step B: Create coordination task with proper RACI
    const taskId = await this.ensureTask(currentOrgName, currentOrgId, assignedPartyId, accountablePartyId);

    // Step C: Ingest Engagement
    const engagementId = await this.ensureEngagement(currentOrgName, currentOrgId, buyerUserId, tagId, taskId);

    // Step D: Tag the task with the engagement tag
    await this.ensureTaskTagged(taskId, tagId);

    // Step E: Ingest SmeMartProject
    const projectId = await this.ensureProject(currentOrgName, engagementId, tagId);

    return { engagementId, projectId, created: true };
  }

  /**
   * Step A: Create or reuse a hydra Tag for the engagement.
   *
   * Tag name follows the {supply}-to-{demand} identity convention (DECISIONS.md
   * 2026-05-07). Tag ownerId is the marketplace operator org (W3Geekery today)
   * so that probes from any operator-admin session resolve correctly — the prior
   * scheme owned tags by the customer org, which made cross-customer probes blind.
   */
  private async ensureTag(orgSlug: string, _orgId: string, orgName: string): Promise<string> {
    const tagName = `sme-mart.eng.${PLATFORM_SUPPLY_SLUG}-to-${orgSlug}`;
    try {
      // Probe: does tag already exist?
      const body = new TagSearchBody();
      body.name = tagName;
      const existing = await this.clientApi.hydraClient
        .getTagApi()
        .searchTags(1, 1, undefined, body);

      if (existing && existing.items && existing.items.length > 0) {
        return String(existing.items[0].id);
      }

      // Create — per DECISIONS.md "Marketplace tagType Is Preferred" + 2026-05-07 ownership rule.
      const createBody = new CreateTagBody(
        tagName,
        undefined, // id — auto-generated
        `Marketplace tag for the platform-services engagement: ZeroBias ➡️ ${orgName}.`,
        MARKETPLACE_OPERATOR_ORG_ID as never,
        new Nmtoken(TAG_TYPE),
      );

      const created = await this.clientApi.hydraClient.getTagApi().createTag(createBody);

      return String(created.id);
    } catch (err) {
      console.warn('[PLATFORM_ENGAGEMENT_FAILURE]', {
        step: 'A',
        callSiteTag: 'platform-engagement:ensure-tag',
        error: err,
      });
      this.snackBar.open('Setup in progress — please retry in a moment.', 'Dismiss', {
        duration: 5000,
      });
      throw err;
    }
  }

  /**
   * Step B: Create the engagement coordination Task (meta-tracker).
   *
   * RACI: assigned = org-party (R), accountable = user-party (A). C and I empty.
   * See class-level docstring for verified surfacing behavior across platform views.
   */
  private async ensureTask(
    orgName: string,
    orgId: string,
    assignedPartyId: string,
    accountablePartyId: string,
  ): Promise<string> {
    try {
      const taskName = `Engagement coordination — ${orgName} <- ZeroBias`;

      const created = await this.clientApi.platformClient.getTaskApi().create({
        activityId: 'e15830c8-4274-4d67-bf9b-c22b60001e32' as never, // global aha1
        ownerId: orgId as never,
        name: taskName,
        description: `Parent task for all ZeroBias ➡️ ${orgName} platform-engagement coordination.`,
        priority: 500,
        assigned: assignedPartyId as never,        // R
        accountable: accountablePartyId as never,   // A
        approvers: [],                              // C
        notified: [],                               // I
        links: [],
      } as never);

      return String(created.id);
    } catch (err) {
      console.warn('[PLATFORM_ENGAGEMENT_FAILURE]', {
        step: 'B',
        callSiteTag: 'platform-engagement:ensure-task',
        error: err,
      });
      this.snackBar.open('Setup in progress — please retry in a moment.', 'Dismiss', {
        duration: 5000,
      });
      throw err;
    }
  }

  /**
   * Step C: Ingest the Engagement record via Pipeline.
   */
  private async ensureEngagement(
    orgName: string,
    currentOrgId: string,
    currentUserId: string,
    tagId: string,
    taskId: string,
  ): Promise<string> {
    const engagementId = crypto.randomUUID();
    const dateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    try {
      const engagement = {
        id: engagementId,
        name: `${orgName} <- ZeroBias`,
        description: platformEngagementDescription(orgName),
        buyerZerobiasUserId: currentUserId,
        buyerZerobiasOrgId: currentOrgId,
        status: 'in_progress',
        engagementTag: 'platform-engagement',
        zerobiasTagId: tagId,
        zerobiasTaskId: taskId,
        dateCreated: dateStr,
        dateLastModified: dateStr,
        tag: [{ value: tagId }], // Per AR-06: Object.tag at ingest time
      };

      await this.pipelineWrite.pushEntities(
        'Engagement',
        [engagement],
        [],
        'platform-engagement:create-engagement',
      );

      return engagementId;
    } catch (err) {
      // pushEntities already logs [PIPELINE_WRITE_FAILURE]; just handle presentation
      this.snackBar.open('Setup in progress — please retry in a moment.', 'Dismiss', {
        duration: 5000,
      });
      throw err;
    }
  }

  /**
   * Step D: Tag the Engagement Task with the shared engagement Tag.
   */
  private async ensureTaskTagged(taskId: string, tagId: string): Promise<void> {
    try {
      // Probe: does the task already have this tag?
      const task = await this.clientApi.hydraClient
        .getResourceApi()
        .getResource(taskId as never);

      if (task && task.tags && task.tags.some((t: { id: unknown }) => String(t.id) === tagId)) {
        // Already tagged
        return;
      }

      // Tag the task
      await this.clientApi.hydraClient
        .getResourceApi()
        .tagResource(taskId as never, [tagId] as never);
    } catch (err) {
      console.warn('[PLATFORM_ENGAGEMENT_FAILURE]', {
        step: 'D',
        callSiteTag: 'platform-engagement:ensure-task-tagged',
        error: err,
      });
      this.snackBar.open('Setup in progress — please retry in a moment.', 'Dismiss', {
        duration: 5000,
      });
      throw err;
    }
  }

  /**
   * Step E: Ingest the engagement's "ZeroBias Platform" project via Pipeline.
   */
  private async ensureProject(orgName: string, engagementId: string, tagId: string): Promise<string> {
    const projectId = crypto.randomUUID();
    const dateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    try {
      // Probe: check if project for this engagement already exists
      const existing = await this.graphqlRead.query<{ id: string }>(
        'SmeMartProject',
        ['id'],
        {
          filters: {
            engagementId: `.eq.${engagementId}`,
            projectType: `.eq.project`,
          },
        },
      );

      if (existing && existing.items && existing.items.length >= 1) {
        return existing.items[0].id;
      }

      // Create
      const project = {
        id: projectId,
        name: PLATFORM_PROJECT_NAME,
        description: platformProjectDescription(orgName),
        status: 'active',
        projectType: 'project',
        engagementId,
        isInvitationOnly: false,
        wizardStep: 999,
        dateCreated: dateStr,
        dateLastModified: dateStr,
        tag: [{ value: tagId }], // Per AR-06: Object.tag at ingest time
      };

      await this.pipelineWrite.pushEntities(
        'SmeMartProject',
        [project],
        [],
        'platform-engagement:create-project',
      );

      return projectId;
    } catch (err) {
      // pushEntities already logs [PIPELINE_WRITE_FAILURE]; just handle presentation
      this.snackBar.open('Setup in progress — please retry in a moment.', 'Dismiss', {
        duration: 5000,
      });
      throw err;
    }
  }

}
