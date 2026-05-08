import { Component, ChangeDetectionStrategy, OnInit, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ZerobiasClientApp, ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import { ZerobiasClientOrgIdService } from '@zerobias-com/zerobias-angular-client';
import { Hostname } from '@zerobias-org/types-core-js';
import { firstValueFrom } from 'rxjs';
import { PlatformEngagementProvisioner } from '../../../core/services/platform-engagement-provisioner.service';

type Status = 'unknown' | 'provisioned' | 'not-provisioned' | 'in-progress' | 'error';
type DryRunStatus = 'idle' | 'in-progress' | 'success' | 'failed';

interface ResolvedInputs {
  orgPartyId: string;
  adminUserPrincipalId: string;
  adminUserPartyId: string;
}

interface OrgRow {
  id: string;
  name: string;
  slug?: string;
  adminGroupId?: string;
  status: Status;
  errorMessage?: string;
  dryRunStatus: DryRunStatus;
  dryRunReport?: ResolvedInputs;
  dryRunError?: string;
}

/**
 * Admin Provisioning Tab — manual platform-engagement provisioning surface.
 *
 * UX gate: Provision is disabled until a successful Dry Run for that row.
 * Dry Run does the cross-org context switch + party resolution and stops
 * before invoking the recipe — so admins can verify the resolved UUIDs
 * (org-party for R, admin user-party for A) without writing any data.
 *
 * On Provision click, the recipe re-resolves inputs (in case state changed
 * between dry-run and click) before running ensurePlatformEngagement.
 *
 * Cross-org context-switch sequence:
 *   1. Save current dana-org-id (W3Geekery for SME Mart admins).
 *   2. `switchOrgContext(targetOrgId)` — flips orgIdService sessionStorage so
 *      the SDK request interceptor stamps `dana-org-id: <targetOrgId>` on
 *      outgoing calls. Also calls platform `dana.Org.selectOrg` (sets
 *      server-side cookie — only effective in prod where cookie domain
 *      matches) and `reconnectWithOrgId` (aligns SDK config). Skips initApp
 *      so the UI elsewhere keeps showing the original org.
 *   3. Fetch the target org's org-party (R) and admin user-party (A) — these
 *      lookups REQUIRE target context (parties are per-org).
 *   4. (Provision only) `switchOrgContext(originalOrgId)` — switch BACK to
 *      W3Geekery before running the recipe. Steps C/E call `Pipeline.receive`
 *      against the W3Geekery-owned SME Marketplace DEV pipeline; that
 *      pipeline is not visible from any other org's scope. The recipe stamps
 *      the target org's IDs into the payload (buyerZerobiasOrgId, etc.) —
 *      those are data, not request scope.
 *   5. (Provision only) Call `ensurePlatformEngagement` with the resolved
 *      parties; runs in W3Geekery context.
 *   6. ALWAYS switch back to the original org-id in finally (idempotent
 *      restore — paranoid against partial-execution paths).
 *
 * Scope (2026-05-06): provisioning is admin-only, manual. No race protection,
 * no backend health pre-flight — see BACKLOG `ORG-SELF-PROVISIONING` for the
 * hardening that's needed before end users can self-provision.
 *
 * Future: this surface will be redundant once ZBUI-PROVISIONING-ACTION ships
 * (governance app gets the same affordance, no need to log into sme-mart).
 */
@Component({
  selector: 'app-org-provisioning-tab',
  standalone: true,
  imports: [
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSnackBarModule,
  ],
  templateUrl: './org-provisioning-tab.component.html',
  styleUrls: ['./org-provisioning-tab.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrgProvisioningTabComponent implements OnInit {
  private readonly app = inject(ZerobiasClientApp);
  private readonly clientApi = inject(ZerobiasClientApi);
  private readonly orgIdService = inject(ZerobiasClientOrgIdService);
  private readonly provisioner = inject(PlatformEngagementProvisioner);
  private readonly snackBar = inject(MatSnackBar);

  readonly rows = signal<OrgRow[]>([]);
  readonly isLoading = signal(true);
  readonly displayedColumns = ['name', 'id', 'status', 'action'];

  async ngOnInit(): Promise<void> {
    await this.loadOrgs();
  }

  async loadOrgs(): Promise<void> {
    this.isLoading.set(true);
    try {
      const orgs = await firstValueFrom(this.app.getOrgs());
      const list = (orgs ?? []) as Array<{
        id?: unknown;
        name?: unknown;
        slug?: unknown;
        adminGroupId?: unknown;
      }>;
      const initial: OrgRow[] = list.map(o => ({
        id: String(o.id ?? ''),
        name: String(o.name ?? '(unnamed)'),
        slug: o.slug ? String(o.slug) : undefined,
        adminGroupId: o.adminGroupId ? String(o.adminGroupId) : undefined,
        status: 'unknown',
        dryRunStatus: 'idle',
      }));
      this.rows.set(initial);

      // Probe each org's provisioning status. Sequential to keep load light;
      // hydra tag-search is one network call per org.
      for (const row of initial) {
        const provisioned = await this.provisioner.isOrgProvisioned(row.id, row.name, row.slug);
        this.updateRow(row.id, { status: provisioned ? 'provisioned' : 'not-provisioned' });
      }
    } catch (err) {
      console.error('[ORG_PROVISIONING_TAB] Failed to load orgs', err);
      this.snackBar.open('Failed to load organizations', 'Dismiss', { duration: 5000 });
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Dry Run — resolves all UUIDs the recipe needs and reports back. No writes.
   * On success, captures the resolved inputs on the row and unlocks the
   * Provision button. On failure, captures the error and keeps Provision locked.
   */
  async dryRun(row: OrgRow): Promise<void> {
    if (!row.adminGroupId) {
      this.updateRow(row.id, {
        dryRunStatus: 'failed',
        dryRunError: `${row.name} has no adminGroupId`,
      });
      this.snackBar.open(
        `Dry run failed: ${row.name} has no adminGroupId`,
        'Dismiss',
        { duration: 5000 },
      );
      return;
    }

    const originalOrgId = this.app.getCurrentOrgId();
    if (!originalOrgId) {
      this.snackBar.open('Cannot resolve current org — refresh and retry', 'Dismiss', { duration: 5000 });
      return;
    }

    this.updateRow(row.id, { dryRunStatus: 'in-progress', dryRunError: undefined });

    try {
      await this.switchOrgContext(row.id);
      const resolved = await this.resolveInputsInTargetContext(row);
      this.updateRow(row.id, {
        dryRunStatus: 'success',
        dryRunReport: resolved,
        dryRunError: undefined,
      });
      this.snackBar.open(
        `Dry run OK: ${row.name} — slug ${row.slug || '(slugify fallback)'}, ` +
        `org-party ${resolved.orgPartyId.slice(0, 8)}…, ` +
        `admin user ${resolved.adminUserPrincipalId.slice(0, 8)}… (party ${resolved.adminUserPartyId.slice(0, 8)}…)`,
        'Dismiss',
        { duration: 8000 },
      );
    } catch (err) {
      const message = (err as Error)?.message ?? 'Unknown error';
      this.updateRow(row.id, {
        dryRunStatus: 'failed',
        dryRunReport: undefined,
        dryRunError: message,
      });
      this.snackBar.open(`Dry run failed: ${message}`, 'Dismiss', { duration: 8000 });
    } finally {
      // Always restore — UI elsewhere reads orgIdService too.
      try {
        await this.switchOrgContext(originalOrgId);
      } catch (restoreErr) {
        console.error('[ORG_PROVISIONING_TAB] Failed to restore original org context after dry run', restoreErr);
      }
    }
  }

  async provisionOrg(row: OrgRow): Promise<void> {
    // Gate: require a successful dry run for THIS row.
    if (row.dryRunStatus !== 'success') {
      this.snackBar.open(
        'Run Dry Run first to verify the inputs before provisioning.',
        'Dismiss',
        { duration: 5000 },
      );
      return;
    }
    if (!row.adminGroupId) {
      this.snackBar.open(
        `Cannot provision ${row.name}: org has no adminGroupId`,
        'Dismiss',
        { duration: 5000 },
      );
      return;
    }

    const originalOrgId = this.app.getCurrentOrgId();
    if (!originalOrgId) {
      this.snackBar.open('Cannot resolve current org — refresh and retry', 'Dismiss', { duration: 5000 });
      return;
    }

    this.updateRow(row.id, { status: 'in-progress', errorMessage: undefined });

    try {
      await this.switchOrgContext(row.id);
      // Re-resolve at click time in case state changed since dry run.
      const resolved = await this.resolveInputsInTargetContext(row);

      // Switch BACK to original (W3Geekery) context before running the recipe.
      // Steps C and E call Pipeline.receive against the W3Geekery-owned SME
      // Marketplace DEV pipeline; that pipeline is not visible from any other
      // org's scope and the call 404s with "No such Pipeline" if we're still
      // in target context. The recipe stamps the target org's IDs into the
      // payload (buyerZerobiasOrgId, etc.) — those are data, not request scope.
      await this.switchOrgContext(originalOrgId);

      const result = await this.provisioner.ensurePlatformEngagement({
        currentOrgId: row.id,
        currentOrgName: row.name,
        currentOrgSlug: row.slug,
        buyerUserId: resolved.adminUserPrincipalId,
        assignedPartyId: resolved.orgPartyId,
        accountablePartyId: resolved.adminUserPartyId,
      });

      this.snackBar.open(
        result.created
          ? `Provisioned ${row.name} (engagement ${result.engagementId})`
          : `${row.name} was already provisioned`,
        'Dismiss',
        { duration: 5000 },
      );
      this.updateRow(row.id, { status: 'provisioned' });
    } catch (err) {
      const message = (err as Error)?.message ?? 'Unknown error';
      this.updateRow(row.id, { status: 'error', errorMessage: message });
      this.snackBar.open(`Provisioning failed: ${message}`, 'Dismiss', { duration: 8000 });
    } finally {
      // ALWAYS restore the original org context, even on error.
      try {
        await this.switchOrgContext(originalOrgId);
      } catch (restoreErr) {
        console.error('[ORG_PROVISIONING_TAB] Failed to restore original org context', restoreErr);
        this.snackBar.open(
          'Warning: failed to restore original org context — refresh the page',
          'Dismiss',
          { duration: 8000 },
        );
      }
    }
  }

  async refresh(): Promise<void> {
    await this.loadOrgs();
  }

  private updateRow(id: string, patch: Partial<OrgRow>): void {
    this.rows.update(rows => rows.map(r => (r.id === id ? { ...r, ...patch } : r)));
  }

  /**
   * Org context switch — flips the SDK header that the server actually reads.
   *
   * Server precedence for `dana-org-id` (per dana RequestContext.ts):
   *   query param -> request header -> cookie
   *
   * The SDK's request interceptor stamps the `dana-org-id` header by reading
   * `orgIdService.getCurrentOrgId()`, which reads **sessionStorage** first
   * (`zb-current-dana-org-id`). So the only move that actually flips the
   * header is `orgIdService.setCurrrenOrgId(orgId)`. Cookie-based fixes
   * are irrelevant when the header is set — the header wins.
   *
   * We also call `clientApi.reconnectWithOrgId` (aligns SDK connect config)
   * and `dana.Org.selectOrg` (sets server-side cookie via Set-Cookie — only
   * effective in prod where cookie Domain matches). Both are scaffolding for
   * correctness; the sessionStorage update is what makes it work.
   *
   * Skips `initApp` — that would trigger a heavyweight UI reinit. Callers
   * MUST restore the original orgId in their own finally block, otherwise
   * the rest of the app continues operating in the target org's scope.
   *
   * Verified empirically 2026-05-07: only the sessionStorage update flips
   * server scope. Other steps are no-ops in local dev.
   */
  private async switchOrgContext(orgId: string): Promise<void> {
    this.orgIdService.setCurrrenOrgId(orgId);
    await this.clientApi.reconnectWithOrgId(orgId);
    try {
      await this.clientApi.danaClient
        .getOrgApi()
        .selectOrg(this.clientApi.toUUID(orgId), new Hostname(window.location.hostname));
    } catch (err) {
      // Platform selectOrg failure is not fatal in local dev (cookie domain
      // mismatch makes the response cookie undeliverable anyway). Log and
      // continue — the sessionStorage update + SDK reconnect are sufficient
      // for the request header to carry the right org-id.
      console.warn('[ORG_PROVISIONING_TAB] platform.selectOrg failed (non-fatal in local dev)', err);
    }
  }

  /**
   * Resolve org-party and admin user-party in TARGET org context.
   * Caller MUST have already called `switchOrgContext(targetOrgId)` and is
   * responsible for restoring the original context in their finally block.
   */
  private async resolveInputsInTargetContext(row: OrgRow): Promise<ResolvedInputs> {
    if (!row.adminGroupId) {
      throw new Error(`${row.name} has no adminGroupId`);
    }
    const orgPartyId = await this.fetchOrgParty(row.name);
    const admin = await this.fetchAdminUser(row.adminGroupId, row.name);
    return {
      orgPartyId,
      adminUserPrincipalId: admin.userPrincipalId,
      adminUserPartyId: admin.userPartyId,
    };
  }

  /**
   * Fetch the target org's org-party. Caller must have already switched
   * dana-org-id to the target org via reconnectWithOrgId.
   */
  private async fetchOrgParty(orgName: string): Promise<string> {
    type SdkPaged = { items?: Array<{ id?: unknown; partyType?: unknown }> };
    const result = await this.clientApi.platformClient
      .getPartyApi()
      .list(1, 5, undefined, undefined, undefined, 'org' as never) as unknown as SdkPaged;
    const orgParty = result?.items?.find(p => String(p.partyType) === 'org');
    if (!orgParty?.id) {
      throw new Error(`No org-party found for ${orgName}`);
    }
    return String(orgParty.id);
  }

  /**
   * Pick a USER admin from the target org's adminGroup, then resolve their
   * party in the target org context. Caller must have already switched
   * dana-org-id to the target org via reconnectWithOrgId.
   *
   * Multi-admin orgs: picks the FIRST USER member (skipping SERVICE_ACCOUNTs).
   * No admin-picker UI yet — see ORG-SELF-PROVISIONING backlog item.
   */
  private async fetchAdminUser(
    adminGroupId: string,
    orgName: string,
  ): Promise<{ userPrincipalId: string; userPartyId: string }> {
    type GroupMember = { id?: unknown; type?: unknown };
    type SdkPaged = { items?: GroupMember[] };
    const groupResult = await this.clientApi.hydraClient
      .getGroupApi()
      .listGroupMembers(this.clientApi.toUUID(adminGroupId), 1, 50) as unknown as SdkPaged;
    const adminUser = groupResult?.items?.find(m => String(m.type) === 'USER');
    if (!adminUser?.id) {
      throw new Error(`No admin user found in ${orgName}'s admin group`);
    }
    const userPrincipalId = String(adminUser.id);

    // Resolve party in target org context (we are already reconnected).
    type Party = { id?: unknown };
    const party = await this.clientApi.platformClient
      .getPartyApi()
      .get(this.clientApi.toUUID(userPrincipalId)) as unknown as Party;
    if (!party?.id) {
      throw new Error(`No party found for admin user ${userPrincipalId} in ${orgName}`);
    }
    return { userPrincipalId, userPartyId: String(party.id) };
  }
}
