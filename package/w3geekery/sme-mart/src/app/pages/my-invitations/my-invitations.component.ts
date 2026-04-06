import { Component, inject, signal, computed, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RfpInvitationService } from '../../core/services/rfp-invitation.service';
import { SmeMartProjectService } from '../../core/services/sme-mart-project.service';
import { ImpersonationService } from '../../core/services/impersonation.service';
import type { RfpInvitation, SmeMartProject } from '../../core/models';
import { InvitationDeclineDialogComponent } from './invitation-decline-dialog.component';

type StatusFilter = 'all' | 'pending' | 'accepted' | 'requested';

@Component({
  selector: 'app-my-invitations',
  standalone: true,
  imports: [
    MatCardModule,
    MatChipsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    DatePipe,
    TitleCasePipe,
    RouterLink,
  ],
  templateUrl: './my-invitations.component.html',
  styleUrl: './my-invitations.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyInvitationsComponent implements OnInit {
  private readonly rfpInvitationService = inject(RfpInvitationService);
  private readonly projectService = inject(SmeMartProjectService);
  private readonly impersonation = inject(ImpersonationService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  readonly loading = signal(false);
  readonly invitations = signal<RfpInvitation[]>([]);
  readonly projects = signal<Map<string, SmeMartProject>>(new Map());
  readonly statusFilter = signal<StatusFilter>('all');

  readonly filteredInvitations = computed(() => {
    const all = this.invitations();
    const filter = this.statusFilter();

    if (filter === 'all') return all;
    return all.filter(inv => inv.status === filter);
  });

  async ngOnInit(): Promise<void> {
    await this.loadInvitations();
  }

  private async loadInvitations(): Promise<void> {
    this.loading.set(true);
    try {
      const vendorOrgId = this.impersonation.effectiveOrgId();
      if (!vendorOrgId) {
        this.snackBar.open('Unable to determine your organization', 'Dismiss', { duration: 5000 });
        return;
      }

      const invitations = await this.rfpInvitationService.listByVendorOrg(vendorOrgId);
      this.invitations.set(invitations);

      // Load project details for each invitation
      const projectMap = new Map<string, SmeMartProject>();
      for (const inv of invitations) {
        if (!projectMap.has(inv.projectId)) {
          try {
            const project = await this.projectService.getProject(inv.projectId);
            if (project) {
              projectMap.set(inv.projectId, project);
            }
          } catch {
            // Project may not be loadable
          }
        }
      }
      this.projects.set(projectMap);
    } catch (err: any) {
      this.snackBar.open(`Failed to load invitations: ${err.message}`, 'Dismiss', { duration: 5000 });
    } finally {
      this.loading.set(false);
    }
  }

  async acceptInvitation(invitationId: string): Promise<void> {
    try {
      await this.rfpInvitationService.acceptInvitation(invitationId);
      // TODO: Notification — invitation accepted to buyer
      this.snackBar.open('Invitation accepted', 'OK', { duration: 3000 });
      await this.loadInvitations();
    } catch (err: any) {
      this.snackBar.open(`Failed to accept invitation: ${err.message}`, 'Dismiss', { duration: 5000 });
    }
  }

  openDeclineDialog(invitation: RfpInvitation): void {
    const ref = this.dialog.open(InvitationDeclineDialogComponent, {
      width: '400px',
      data: { invitation },
    });

    ref.afterClosed().subscribe(async (result) => {
      if (result && result.confirmed) {
        await this.declineInvitation(invitation.id, result.reason);
      }
    });
  }

  private async declineInvitation(invitationId: string, reason?: string): Promise<void> {
    try {
      await this.rfpInvitationService.declineInvitation(invitationId);
      // TODO: Notification — invitation declined to buyer
      this.snackBar.open('Invitation declined', 'OK', { duration: 3000 });
      await this.loadInvitations();
    } catch (err: any) {
      this.snackBar.open(`Failed to decline invitation: ${err.message}`, 'Dismiss', { duration: 5000 });
    }
  }

  getProjectTitle(invitationId: string): string {
    const inv = this.invitations().find(i => i.id === invitationId);
    if (!inv) return 'Unknown Project';
    const project = this.projects().get(inv.projectId);
    return project?.title || 'Unknown Project';
  }

  getStatusChipClass(status: string): string {
    switch (status) {
      case 'pending':
        return 'status-pending';
      case 'accepted':
        return 'status-accepted';
      case 'declined':
        return 'status-declined';
      case 'revoked':
        return 'status-revoked';
      case 'expired':
        return 'status-expired';
      case 'requested':
        return 'status-requested';
      default:
        return '';
    }
  }

  setStatusFilter(filter: StatusFilter): void {
    this.statusFilter.set(filter);
  }
}
