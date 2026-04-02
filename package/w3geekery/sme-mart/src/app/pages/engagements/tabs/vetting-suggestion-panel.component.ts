import {
  Component, input, signal, computed, inject, ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';

import { ZbResourceStatusComponent } from '@zerobias-org/ngx-library';
import { EngagementVettingItem } from '../../../core/models';
import { VendorProfileService } from '../../../core/services/vendor-profile.service';
import { VettingService, PilotCompletionSuggestion } from '../../../core/services/vetting.service';
import { EngagementContextService } from '../../../core/services/engagement-context.service';
import { MarketplaceProfileItem } from '../../../core/models/marketplace-profile-item.model';
import {
  getSuggestableSection,
  canSuggestForVettingType,
} from '../../../core/utilities/section-mapping.utility';
import {
  isExpired,
  isExpiringSoon,
} from '../../../core/utilities/expiration.utility';

@Component({
  selector: 'app-vetting-suggestion-panel',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatCardModule,
    ZbResourceStatusComponent,
  ],
  templateUrl: './vetting-suggestion-panel.component.html',
  styleUrl: './vetting-suggestion-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VettingSuggestionPanelComponent {
  private readonly vendorProfile = inject(VendorProfileService);
  private readonly vetting = inject(VettingService);
  private readonly ctx = inject(EngagementContextService);

  readonly vettingItem = input.required<EngagementVettingItem>();
  readonly onAttach = input.required<(item: MarketplaceProfileItem) => Promise<void>>();
  readonly onDetach = input.required<() => Promise<void>>();

  readonly loading = signal(false);
  readonly expanded = signal(false);
  readonly profileItems = signal<MarketplaceProfileItem[]>([]);
  readonly attachInProgress = signal(false);
  readonly detachInProgress = signal(false);

  // ── Computed properties ──

  readonly canSuggest = computed(() =>
    canSuggestForVettingType(this.vettingItem().vetting_type),
  );

  readonly suggestedItems = computed(() => {
    const section = getSuggestableSection(this.vettingItem().vetting_type);
    if (!section) return [];
    return this.profileItems().filter(item => item.section === section);
  });

  readonly isAttached = computed(() => !!this.vettingItem().profile_item_id);

  readonly attachedItem = computed(() => {
    const itemId = this.vettingItem().profile_item_id;
    if (!itemId) return null;
    return this.profileItems().find(item => item.id === itemId) || null;
  });

  readonly attachedItemExpired = computed(() => {
    const item = this.attachedItem();
    return item ? isExpired(item) : false;
  });

  // ── Pilot Completion Suggestion (Plan 077 Task 3) ──

  readonly pilotSuggestion = this.vetting.pilotCompletionSuggestion;

  // ── Lifecycle ──

  async loadProfileItems(): Promise<void> {
    if (!this.canSuggest() || this.profileItems().length > 0) return;
    this.loading.set(true);
    try {
      const orgId = this.ctx.engagement()?.buyer_zerobias_org_id;
      if (!orgId) return;
      const items = await this.vendorProfile.listProfileItems(orgId);
      this.profileItems.set(items);
    } catch (err) {
      console.error('[VettingSuggestionPanel] Failed to load profile items:', err);
    } finally {
      this.loading.set(false);
    }
  }

  // ── Actions ──

  async onSuggestionItemAttach(item: MarketplaceProfileItem): Promise<void> {
    this.attachInProgress.set(true);
    try {
      await this.onAttach()(item);
      this.expanded.set(false);  // Close panel after attach
    } catch (err) {
      console.error('[VettingSuggestionPanel] Failed to attach item:', err);
    } finally {
      this.attachInProgress.set(false);
    }
  }

  async onLinkedItemDetach(): Promise<void> {
    this.detachInProgress.set(true);
    try {
      await this.onDetach()();
    } catch (err) {
      console.error('[VettingSuggestionPanel] Failed to detach item:', err);
    } finally {
      this.detachInProgress.set(false);
    }
  }

  toggleExpanded(): void {
    this.expanded.set(!this.expanded());
    if (this.expanded()) {
      this.loadProfileItems();
    }
  }

  dismissPilotSuggestion(): void {
    this.vetting.clearPilotCompletionSuggestion();
  }

  // ── Helpers ──

  isExpiredStatus(item: MarketplaceProfileItem): boolean {
    return isExpired(item);
  }

  isExpiringSoonStatus(item: MarketplaceProfileItem): boolean {
    return isExpiringSoon(item) && !isExpired(item);
  }
}
