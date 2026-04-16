import { Injectable, inject, signal, computed } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ZerobiasClientApp, ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import type { dana } from '@zerobias-com/zerobias-sdk';
import { SwitchingOrgDialogComponent } from '../../shared/dialogs/switching-org-dialog/switching-org-dialog.component';

@Injectable({ providedIn: 'root' })
export class OrgSwitcherService {
  private readonly app = inject(ZerobiasClientApp);
  private readonly clientApi = inject(ZerobiasClientApi);
  private readonly dialog = inject(MatDialog);

  // Raw org list from SDK (unfiltered)
  private readonly rawOrgs = signal<dana.Org[]>([]);

  // Alphabetically sorted org list exposed to components
  readonly orgs$ = computed(() => {
    return this.rawOrgs().sort((a, b) => a.name.localeCompare(b.name));
  });

  constructor() {
    this.loadOrgs();
  }

  /**
   * Load org list from SDK and update rawOrgs signal
   * Uses listMyOrgs() which returns the orgs the current user is a member of
   */
  private async loadOrgs(): Promise<void> {
    try {
      const orgs = await this.clientApi.danaClient.getMeApi().listMyOrgs();
      this.rawOrgs.set(orgs || []);
    } catch (error) {
      console.error('[OrgSwitcherService] Failed to load orgs:', error);
      this.rawOrgs.set([]);
    }
  }

  /**
   * Switch to the specified organization
   * Opens a blocking dialog, calls SDK selectOrg, and triggers hard reload on success
   * No-op if the org is already the current org
   */
  async switchTo(org: dana.Org): Promise<void> {
    // Get current org ID
    const currentOrgId = this.app.getCurrentOrgId();

    // No-op if switching to the same org
    if (`${org.id}` === `${currentOrgId}`) {
      return;
    }

    // Open blocking spinner dialog
    const dialogRef = this.dialog.open(SwitchingOrgDialogComponent, {
      width: '400px',
      disableClose: true,
      data: {
        orgName: org.name,
      },
    });

    try {
      // Call SDK selectOrg with post-switch callback
      await this.app.selectOrg(org, () => {
        // Close dialog
        dialogRef.close();

        // Hard reload to clear all in-memory caches
        window.location.reload();
      });
    } catch (error) {
      // Close dialog on error
      dialogRef.close();
      console.error('Organization switch failed:', error);
      // TODO: Show error toast to user (future error handling phase)
    }
  }

}
