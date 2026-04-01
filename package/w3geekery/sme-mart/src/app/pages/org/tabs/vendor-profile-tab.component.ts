import {
  Component,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { ZerobiasClientApp } from '@zerobias-com/zerobias-client';
import { ZbResourceStatusComponent } from '@zerobias-org/ngx-library';
import { VendorProfileService } from '../../../core/services/vendor-profile.service';
import type {
  MarketplaceProfileItem,
  SectionType,
  CreateMarketplaceProfileItemRequest,
} from '../../../core/models/marketplace-profile-item.model';
import { VendorProfileForm } from './vendor-profile-form.component';

const SECTION_ORDER: SectionType[] = [
  'corporate_identity',
  'attestation',
  'insurance',
  'personnel',
  'financial',
  'reference',
];

@Component({
  selector: 'app-vendor-profile-tab',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatExpansionModule,
    MatSidenavModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatChipsModule,
    MatCardModule,
    MatProgressSpinnerModule,
    ZbResourceStatusComponent,
    VendorProfileForm,
  ],
  templateUrl: './vendor-profile-tab.component.html',
  styleUrl: './vendor-profile-tab.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VendorProfileTab implements OnInit, OnDestroy {
  private readonly app = inject(ZerobiasClientApp);
  private readonly vendorProfileService = inject(VendorProfileService);
  private readonly snackBar = inject(MatSnackBar);
  private sub?: Subscription;

  // Signals
  readonly items = signal<MarketplaceProfileItem[]>([]);
  readonly sidenavOpen = signal(false);
  readonly formMode = signal<'create' | 'edit'>('create');
  readonly selectedSection = signal<SectionType>('corporate_identity');
  readonly editingItem = signal<MarketplaceProfileItem | null>(null);
  readonly isLoading = signal(false);
  readonly currentOrgId = signal('');
  readonly welcomeCardDismissed = signal(false);
  readonly deletingItemId = signal<string | null>(null);
  readonly dismissedRenewalCard = signal(false);

  // Section order for template
  readonly sections = SECTION_ORDER;

  // Computed signals for section filtering
  readonly corporateIdentityItems = computed(() =>
    this.items().filter(i => i.section === 'corporate_identity')
  );
  readonly attestationItems = computed(() =>
    this.items().filter(i => i.section === 'attestation')
  );
  readonly insuranceItems = computed(() =>
    this.items().filter(i => i.section === 'insurance')
  );
  readonly personnelItems = computed(() =>
    this.items().filter(i => i.section === 'personnel')
  );
  readonly financialItems = computed(() =>
    this.items().filter(i => i.section === 'financial')
  );
  readonly referenceItems = computed(() =>
    this.items().filter(i => i.section === 'reference')
  );

  // Computed signals for expiration status
  readonly expiredItems = computed(() =>
    this.items().filter(i => this.isExpired(i))
  );
  readonly expiringSoonItems = computed(() =>
    this.items().filter(i => this.isExpiringSoon(i))
  );

  // Computed: show welcome card only when empty and not dismissed
  readonly hasAnyItems = computed(() => this.items().length > 0);
  readonly showWelcomeCard = computed(
    () => !this.hasAnyItems() && !this.welcomeCardDismissed()
  );

  // Helper to get items by section
  getItemsBySection(section: SectionType): MarketplaceProfileItem[] {
    return this.items().filter(i => i.section === section);
  }

  // Helper to get expired count for section
  getExpiredCount(section: SectionType): number {
    return this.getItemsBySection(section).filter(i => this.isExpired(i)).length;
  }

  ngOnInit(): void {
    this.sub = this.app.getCurrentOrg().subscribe(org => {
      if (org?.id) {
        this.currentOrgId.set(String(org.id));
        this.loadItems();
      }
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  async loadItems(): Promise<void> {
    this.isLoading.set(true);
    try {
      const orgId = this.currentOrgId();
      const items = await this.vendorProfileService.listProfileItems(orgId);
      this.items.set(items);

      // Auto-dismiss welcome card if items exist
      if (items.length > 0) {
        this.welcomeCardDismissed.set(true);
      }
    } catch (err) {
      console.error('[VendorProfileTab] Failed to load items:', err);
      this.snackBar.open('Failed to load profile items', 'OK');
    } finally {
      this.isLoading.set(false);
    }
  }

  // Expiration helpers
  isExpired(item: MarketplaceProfileItem): boolean {
    if (!item.expires_at) return false;
    return new Date(item.expires_at) < new Date();
  }

  isExpiringSoon(item: MarketplaceProfileItem): boolean {
    if (!item.expires_at) return false;
    const now = new Date();
    const expiryDate = new Date(item.expires_at);
    const daysUntilExpiry = Math.floor(
      (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
  }

  getStatusLabel(item: MarketplaceProfileItem): string {
    if (this.isExpired(item)) return 'EXPIRED';
    if (this.isExpiringSoon(item)) return 'EXPIRING_SOON';
    return 'ACTIVE';
  }

  // Welcome card
  onWelcomeCardGetStarted(): void {
    // Expand first section and open add form
    this.openAddForm('corporate_identity');
  }

  // Form management
  openAddForm(section: SectionType): void {
    this.formMode.set('create');
    this.selectedSection.set(section);
    this.editingItem.set(null);
    this.sidenavOpen.set(true);
  }

  openEditForm(item: MarketplaceProfileItem): void {
    this.formMode.set('edit');
    this.selectedSection.set(item.section);
    this.editingItem.set(item);
    this.sidenavOpen.set(true);
  }

  async onFormSave(request: CreateMarketplaceProfileItemRequest): Promise<void> {
    try {
      const mode = this.formMode();
      const orgId = this.currentOrgId();

      if (mode === 'create') {
        await this.vendorProfileService.createProfileItem(orgId, request);
      } else {
        const itemId = this.editingItem()?.id;
        if (itemId) {
          await this.vendorProfileService.updateProfileItem(itemId, request);
        }
      }

      await this.loadItems();
      this.sidenavOpen.set(false);
      this.snackBar.open('Profile item saved successfully', 'OK', { duration: 3000 });
    } catch (err) {
      console.error('[VendorProfileTab] Failed to save profile item:', err);
      this.snackBar.open('Failed to save profile item', 'OK');
    }
  }

  onFormClose(): void {
    this.sidenavOpen.set(false);
  }

  // Delete management
  onDeleteItem(item: MarketplaceProfileItem): void {
    this.deletingItemId.set(item.id);
  }

  async confirmDelete(item: MarketplaceProfileItem): Promise<void> {
    try {
      await this.vendorProfileService.deleteProfileItem(item.id);
      await this.loadItems();
      this.snackBar.open('Profile item deleted successfully', 'OK', { duration: 3000 });
    } catch (err) {
      console.error('[VendorProfileTab] Failed to delete profile item:', err);
      this.snackBar.open('Failed to delete profile item', 'OK');
    } finally {
      this.deletingItemId.set(null);
    }
  }

  cancelDelete(): void {
    this.deletingItemId.set(null);
  }

  // Renewal card
  dismissRenewalCard(): void {
    this.dismissedRenewalCard.set(true);
  }

  // Helper to get detail for item row display
  getItemDetail(item: MarketplaceProfileItem): string {
    try {
      const data = JSON.parse(item.data);
      switch (item.section) {
        case 'insurance':
          return `Policy #${data.policyNumber}`;
        case 'personnel':
          return data.title;
        case 'attestation':
          return `${data.yearsExperience} years`;
        case 'corporate_identity':
          return data.legalEntityName;
        case 'reference':
          return data.clientName;
        case 'financial':
          return `$${data.annualRevenue}`;
        default:
          return '';
      }
    } catch {
      return '';
    }
  }
}
