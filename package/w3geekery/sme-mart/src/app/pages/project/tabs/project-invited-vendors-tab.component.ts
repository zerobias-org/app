import { Component, inject, signal, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RfpInvitationService } from '../../../core/services/rfp-invitation.service';
import { ProjectContextService } from '../../../core/services/project-context.service';
import type { RfpInvitation } from '../../../core/models';

@Component({
  selector: 'app-project-invited-vendors-tab',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTooltipModule,
    DatePipe,
    FormsModule,
  ],
  templateUrl: './project-invited-vendors-tab.component.html',
  styleUrl: './project-invited-vendors-tab.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectInvitedVendorsTabComponent implements OnInit {
  private readonly ctx = inject(ProjectContextService);

  private readonly rfpInvitationService = inject(RfpInvitationService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  readonly loading = signal(false);
  readonly invitations = signal<RfpInvitation[]>([]);
  readonly newVendorOrgId = signal<string>('');
  readonly invitationMessage = signal<string>('');
  readonly sendingInvite = signal(false);

  async ngOnInit(): Promise<void> {
    await this.loadInvitations();
  }

  private async loadInvitations(): Promise<void> {
    this.loading.set(true);
    try {
      const projectId = this.ctx.project()?.id;
      if (!projectId) {
        this.snackBar.open('Project not found', 'Dismiss', { duration: 3000 });
        return;
      }
      const invitations = await this.rfpInvitationService.listByProject(projectId);
      this.invitations.set(invitations);
    } catch (err: any) {
      this.snackBar.open(`Failed to load invitations: ${err.message}`, 'Dismiss', { duration: 5000 });
    } finally {
      this.loading.set(false);
    }
  }

  async inviteVendor(): Promise<void> {
    const vendorOrgId = this.newVendorOrgId();
    const projectId = this.ctx.project()?.id;

    if (!vendorOrgId) {
      this.snackBar.open('Please select a vendor', 'Dismiss', { duration: 3000 });
      return;
    }

    if (!projectId) {
      this.snackBar.open('Project not found', 'Dismiss', { duration: 3000 });
      return;
    }

    this.sendingInvite.set(true);
    try {
      await this.rfpInvitationService.createInvitation({
        projectId,
        vendorOrgId,
        invitationMessage: this.invitationMessage(),
      });

      // TODO: Notification — invitation sent to vendor
      this.snackBar.open('Invitation sent', 'OK', { duration: 3000 });
      this.newVendorOrgId.set('');
      this.invitationMessage.set('');
      await this.loadInvitations();
    } catch (err: any) {
      this.snackBar.open(`Failed to send invitation: ${err.message}`, 'Dismiss', { duration: 5000 });
    } finally {
      this.sendingInvite.set(false);
    }
  }

  get isProjectOwner(): boolean {
    const project = this.ctx.project();
    return !!project;
  }

  async revokeInvitation(invitationId: string): Promise<void> {
    try {
      await this.rfpInvitationService.revokeInvitation(invitationId);
      // TODO: Notification — invitation revoked to vendor
      this.snackBar.open('Invitation revoked', 'OK', { duration: 3000 });
      await this.loadInvitations();
    } catch (err: any) {
      this.snackBar.open(`Failed to revoke: ${err.message}`, 'Dismiss', { duration: 5000 });
    }
  }

  async approveRequest(invitationId: string): Promise<void> {
    try {
      await this.rfpInvitationService.approveRequest(invitationId);
      // TODO: Notification — request approved to vendor
      this.snackBar.open('Request approved', 'OK', { duration: 3000 });
      await this.loadInvitations();
    } catch (err: any) {
      this.snackBar.open(`Failed to approve request: ${err.message}`, 'Dismiss', { duration: 5000 });
    }
  }

  async declineRequest(invitationId: string): Promise<void> {
    try {
      await this.rfpInvitationService.declineRequest(invitationId);
      // TODO: Notification — request declined to vendor
      this.snackBar.open('Request declined', 'OK', { duration: 3000 });
      await this.loadInvitations();
    } catch (err: any) {
      this.snackBar.open(`Failed to decline request: ${err.message}`, 'Dismiss', { duration: 5000 });
    }
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
}
