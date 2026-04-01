import {
  Component, inject, signal, computed, ChangeDetectionStrategy, OnInit,
} from '@angular/core';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ZbResourceStatusComponent } from '@zerobias-org/ngx-library';
import { EngagementContextService } from '../../../core/services/engagement-context.service';
import { VettingService } from '../../../core/services/vetting.service';
import { VendorProfileService } from '../../../core/services/vendor-profile.service';
import type {
  EngagementVettingItem,
  VettingStatus,
  VettingDirection,
  VettingSummary,
  VettingGateStatus,
} from '../../../core/models';
import type { MarketplaceProfileItem } from '../../../core/models/marketplace-profile-item.model';
import { VETTING_STATUS_TRANSITIONS } from '../../../core/models';
import { isExpired } from '../../../core/utilities/expiration.utility';
import { VettingItemDialogComponent } from '../../../shared/components/vetting-item-dialog/vetting-item-dialog.component';
import { VettingSuggestionPanelComponent } from './vetting-suggestion-panel.component';

@Component({
  selector: 'app-vetting-tab',
  standalone: true,
  imports: [
    DatePipe,
    TitleCasePipe,
    RouterModule,
    MatExpansionModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatMenuModule,
    MatTooltipModule,
    ZbResourceStatusComponent,
    VettingSuggestionPanelComponent,
  ],
  templateUrl: './vetting-tab.component.html',
  styleUrl: './vetting-tab.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VettingTab implements OnInit {
  private readonly ctx = inject(EngagementContextService);
  private readonly vetting = inject(VettingService);
  private readonly vendorProfile = inject(VendorProfileService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly loading = signal(true);
  readonly items = signal<EngagementVettingItem[]>([]);

  readonly engagementId = this.ctx.engagement()?.id || '';

  // ── Grouped views ──

  readonly buyerRequires = computed(() =>
    this.items().filter(i => i.direction === 'buyer_requires'),
  );

  readonly providerRequires = computed(() =>
    this.items().filter(i => i.direction === 'provider_requires'),
  );

  // ── Progress & gate ──

  readonly buyerProgress = computed(() => this.calcProgress(this.buyerRequires()));
  readonly providerProgress = computed(() => this.calcProgress(this.providerRequires()));

  readonly summary = signal<VettingSummary | null>(null);
  readonly gateStatus = computed<VettingGateStatus>(() => this.summary()?.gateStatus ?? 'not_started');
  readonly requiredRemaining = computed(() => this.summary()?.requiredRemaining ?? 0);
  readonly rejectedOrExpiredCount = computed(() =>
    (this.summary()?.rejected ?? 0) + (this.summary()?.expired ?? 0),
  );

  async ngOnInit(): Promise<void> {
    if (!this.engagementId) return;
    await this.loadItems();
  }

  async loadItems(): Promise<void> {
    this.loading.set(true);
    try {
      const result = await this.vetting.initializeVetting(this.engagementId);
      this.items.set(result);
      const summaryResult = await this.vetting.getVettingSummary(this.engagementId);
      this.summary.set(summaryResult);
    } catch (err) {
      console.error('[VettingTab] Failed to load vetting items:', err);
    } finally {
      this.loading.set(false);
    }
  }

  // ── Status transitions ──

  getNextStatuses(item: EngagementVettingItem): VettingStatus[] {
    return VETTING_STATUS_TRANSITIONS[item.status] ?? [];
  }

  async onStatusChange(item: EngagementVettingItem, newStatus: VettingStatus): Promise<void> {
    try {
      await this.vetting.updateVettingItem(item.id, { status: newStatus });
      await this.loadItems();
      this.snackBar.open(`Status updated to ${this.formatStatus(newStatus)}`, '', { duration: 2000 });
    } catch (err: any) {
      this.snackBar.open(err.message || 'Failed to update status', 'OK', { duration: 4000 });
    }
  }

  // ── Profile item suggestions (D-09, D-11) ──

  readonly expiredAttachments = computed(() =>
    this.items()
      .filter(item => item.profile_item_id && isExpired({ expires_at: item.expires_at }))
      .map(item => ({
        itemId: item.id,
        profileItemId: item.profile_item_id || '',
        name: item.name,
      })),
  );

  attachProfileItem(vettingItemId: string, profileItem: MarketplaceProfileItem): Promise<void> {
    return (async () => {
      try {
        await this.vetting.updateVettingItem(vettingItemId, {
          profile_item_id: profileItem.id,
        });
        await this.loadItems();
        this.snackBar.open(`Attached: ${profileItem.name}`, '', { duration: 2000 });
      } catch (err: any) {
        this.snackBar.open(err.message || 'Failed to attach profile item', 'OK', { duration: 4000 });
      }
    })();
  }

  detachProfileItem(vettingItemId: string): Promise<void> {
    return (async () => {
      try {
        await this.vetting.updateVettingItem(vettingItemId, {
          profile_item_id: null,
        });
        await this.loadItems();
        this.snackBar.open('Profile item detached', '', { duration: 2000 });
      } catch (err: any) {
        this.snackBar.open(err.message || 'Failed to detach profile item', 'OK', { duration: 4000 });
      }
    })();
  }

  // Helper to get callback functions for suggestion panel
  getAttachCallback(vettingItemId: string): (item: MarketplaceProfileItem) => Promise<void> {
    return (item: MarketplaceProfileItem) => this.attachProfileItem(vettingItemId, item);
  }

  getDetachCallback(vettingItemId: string): () => Promise<void> {
    return () => this.detachProfileItem(vettingItemId);
  }

  // ── Add item ──

  openAddDialog(direction: VettingDirection): void {
    const ref = this.dialog.open(VettingItemDialogComponent, {
      width: '500px',
      data: { direction },
    });

    ref.afterClosed().subscribe(async (result) => {
      if (!result) return;
      try {
        await this.vetting.addVettingItem(this.engagementId, result);
        await this.loadItems();
        this.snackBar.open('Vetting item added', '', { duration: 2000 });
      } catch (err) {
        this.snackBar.open('Failed to add item', 'OK', { duration: 4000 });
      }
    });
  }

  // ── Delete ──

  async onDelete(item: EngagementVettingItem): Promise<void> {
    try {
      await this.vetting.deleteVettingItem(item.id);
      await this.loadItems();
      this.snackBar.open('Item removed', '', { duration: 2000 });
    } catch {
      this.snackBar.open('Failed to remove item', 'OK', { duration: 4000 });
    }
  }

  // ── Helpers ──

  formatStatus(status: string): string {
    return status.replace(/_/g, ' ');
  }

  normalizeStatus(status: string): string {
    return status.toUpperCase().replace(/ /g, '_');
  }

  statusIcon(status: VettingStatus): string {
    switch (status) {
      case 'verified': return 'check_circle';
      case 'waived': return 'remove_circle_outline';
      case 'rejected': return 'cancel';
      case 'expired': return 'schedule';
      case 'submitted': return 'upload_file';
      case 'under_review': return 'pending';
      default: return 'radio_button_unchecked';
    }
  }

  isResolved(status: VettingStatus): boolean {
    return status === 'verified' || status === 'waived';
  }

  private calcProgress(items: EngagementVettingItem[]): { done: number; total: number; percent: number } {
    const total = items.length;
    const done = items.filter(i => this.isResolved(i.status)).length;
    return { done, total, percent: total > 0 ? Math.round((done / total) * 100) : 0 };
  }
}
