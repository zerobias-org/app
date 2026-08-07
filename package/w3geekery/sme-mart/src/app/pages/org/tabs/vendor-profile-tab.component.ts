import {
  Component,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { DatePipe } from '@angular/common';
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
import {
  SECTION_CARDINALITY,
  SECTION_LABELS,
  type ClientReferenceRecord,
  type InsuranceCoverageRecord,
  type PersonnelRecord,
  type SectionType,
  type ServiceCapabilityRecord,
  type VendorProfileBundle,
  type VendorProfileRecord,
} from '../../../core/models/vendor-profile.model';
import { VendorProfileForm } from './vendor-profile-form.component';

const SECTION_ORDER: SectionType[] = [
  'corporate_identity',
  'attestation',
  'insurance',
  'personnel',
  'financial',
  'reference',
];

const EMPTY_BUNDLE: VendorProfileBundle = {
  corporate_identity: null,
  financial: null,
  attestation: [],
  insurance: [],
  reference: [],
  personnel: [],
};

/** Days before expiry that a row starts reading as "expiring soon". */
const EXPIRING_SOON_DAYS = 30;

/** A row plus the section it belongs to, for flattened views like the renewal cards. */
export interface SectionRow {
  section: SectionType;
  row: VendorProfileRecord;
}

@Component({
  selector: 'app-vendor-profile-tab',
  standalone: true,
  imports: [
    DatePipe,
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

  readonly bundle = signal<VendorProfileBundle>(EMPTY_BUNDLE);
  readonly sidenavOpen = signal(false);
  readonly formMode = signal<'create' | 'edit'>('create');
  readonly selectedSection = signal<SectionType>('corporate_identity');
  readonly editingItem = signal<VendorProfileRecord | null>(null);
  readonly isLoading = signal(false);
  readonly currentOrgId = signal('');
  readonly currentOrgName = signal('');
  readonly deletingItemId = signal<string | null>(null);
  readonly dismissedRenewalCard = signal(false);

  readonly sections = SECTION_ORDER;
  readonly sectionLabels = SECTION_LABELS;

  /** The two singleton sections render an edit-in-place form, not a list with add. */
  isSingleton(section: SectionType): boolean {
    return SECTION_CARDINALITY[section] === 'one';
  }

  readonly corporateIdentity = computed(() => this.bundle().corporate_identity);
  readonly financialProfile = computed(() => this.bundle().financial);
  readonly attestationItems = computed(() => this.bundle().attestation);
  readonly insuranceItems = computed(() => this.bundle().insurance);
  readonly personnelItems = computed(() => this.bundle().personnel);
  readonly referenceItems = computed(() => this.bundle().reference);

  /**
   * Every row across every section, flattened and tagged with its section.
   *
   * The section travels with the row because the typed rows no longer carry a `section`
   * discriminator the way the blob did — and the renewal cards need it to open the right
   * form. Singletons contribute 0 or 1.
   */
  readonly allRows = computed<SectionRow[]>(() => {
    const b = this.bundle();
    const tag = (section: SectionType, rows: VendorProfileRecord[]): SectionRow[] =>
      rows.map(row => ({ section, row }));
    return [
      ...tag('corporate_identity', b.corporate_identity ? [b.corporate_identity] : []),
      ...tag('financial', b.financial ? [b.financial] : []),
      ...tag('attestation', b.attestation),
      ...tag('insurance', b.insurance),
      ...tag('personnel', b.personnel),
      ...tag('reference', b.reference),
    ];
  });

  readonly expiredItems = computed(() => this.allRows().filter(e => this.isExpired(e.row)));
  readonly expiringSoonItems = computed(() => this.allRows().filter(e => this.isExpiringSoon(e.row)));

  getItemsBySection(section: SectionType): VendorProfileRecord[] {
    const b = this.bundle();
    switch (section) {
      case 'corporate_identity': return b.corporate_identity ? [b.corporate_identity] : [];
      case 'financial': return b.financial ? [b.financial] : [];
      case 'attestation': return b.attestation;
      case 'insurance': return b.insurance;
      case 'personnel': return b.personnel;
      case 'reference': return b.reference;
    }
  }

  getExpiredCount(section: SectionType): number {
    return this.getItemsBySection(section).filter(r => this.isExpired(r)).length;
  }

  ngOnInit(): void {
    this.sub = this.app.getCurrentOrg().subscribe(org => {
      if (org?.id) {
        this.currentOrgId.set(String(org.id));
        this.currentOrgName.set(org.name ?? '');
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
      this.bundle.set(await this.vendorProfileService.loadBundle(this.currentOrgId()));
    } catch (err) {
      console.error('[VendorProfileTab] Failed to load profile:', err);
      this.snackBar.open('Failed to load profile', 'OK');
    } finally {
      this.isLoading.set(false);
    }
  }

  // ── Expiry ────────────────────────────────────────────────────────────────

  /**
   * The date a row expires.
   *
   * The blob carried one `expires_at` for every section. Typed rows do not: only
   * InsuranceCoverage has its own `expiresAt`, while every attestation class carries
   * `verificationExpiresAt` from Verifiable. A row's own expiry wins; verification
   * expiry is the fallback.
   */
  private expiryOf(row: VendorProfileRecord): string | null {
    const own = (row as InsuranceCoverageRecord).expiresAt;
    return own ?? row.verificationExpiresAt ?? null;
  }

  isExpired(row: VendorProfileRecord): boolean {
    const expiry = this.expiryOf(row);
    return expiry ? new Date(expiry) < new Date() : false;
  }

  isExpiringSoon(row: VendorProfileRecord): boolean {
    const expiry = this.expiryOf(row);
    if (!expiry) return false;
    const days = Math.floor((new Date(expiry).getTime() - Date.now()) / 86_400_000);
    return days > 0 && days <= EXPIRING_SOON_DAYS;
  }

  getStatusLabel(row: VendorProfileRecord): string {
    if (this.isExpired(row)) return 'EXPIRED';
    if (this.isExpiringSoon(row)) return 'EXPIRING_SOON';
    return 'ACTIVE';
  }

  // ── Form management ───────────────────────────────────────────────────────

  onWelcomeCardGetStarted(): void {
    this.openAddForm('corporate_identity');
  }

  /** For a singleton section this opens the existing row for edit when there is one. */
  openAddForm(section: SectionType): void {
    const existing = this.isSingleton(section) ? this.getItemsBySection(section)[0] : undefined;
    this.formMode.set(existing ? 'edit' : 'create');
    this.selectedSection.set(section);
    this.editingItem.set(existing ?? null);
    this.sidenavOpen.set(true);
  }

  openEditForm(section: SectionType, row: VendorProfileRecord): void {
    this.formMode.set('edit');
    this.selectedSection.set(section);
    this.editingItem.set(row);
    this.sidenavOpen.set(true);
  }

  async onFormSave(values: Partial<VendorProfileRecord>): Promise<void> {
    const section = this.selectedSection();
    const orgId = this.currentOrgId();
    try {
      if (this.isSingleton(section)) {
        // Read-then-write: the old path minted a fresh id on every save, so editing
        // produced a second row rather than updating the first.
        await this.vendorProfileService.upsertSingleton(
          section as 'corporate_identity' | 'financial',
          orgId,
          values,
        );
      } else {
        const editing = this.editingItem();
        if (this.formMode() === 'edit' && editing) {
          await this.vendorProfileService.updateRow(section, editing, values);
        } else {
          await this.vendorProfileService.createRow(section, orgId, values);
        }
      }

      await this.loadItems();
      this.sidenavOpen.set(false);
      this.snackBar.open('Profile saved', 'OK', { duration: 3000 });
    } catch (err) {
      console.error('[VendorProfileTab] Failed to save:', err);
      this.snackBar.open('Failed to save profile', 'OK');
    }
  }

  onFormClose(): void {
    this.sidenavOpen.set(false);
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  onDeleteItem(row: VendorProfileRecord): void {
    this.deletingItemId.set(row.id);
  }

  async confirmDelete(section: SectionType, row: VendorProfileRecord): Promise<void> {
    try {
      // The D-12/D-13 vetting-reference guard was removed with EngagementVettingItem:
      // the engagements tree that wrote vetting items is gone, so no writer remained and
      // the guard protected nothing.
      await this.vendorProfileService.deleteRow(section, row.id);
      await this.loadItems();
      this.snackBar.open('Deleted', 'OK', { duration: 3000 });
    } catch (err) {
      console.error('[VendorProfileTab] Failed to delete:', err);
      this.snackBar.open('Failed to delete', 'OK');
    } finally {
      this.deletingItemId.set(null);
    }
  }

  cancelDelete(): void {
    this.deletingItemId.set(null);
  }

  dismissRenewalCard(): void {
    this.dismissedRenewalCard.set(true);
  }

  // ── Row display ───────────────────────────────────────────────────────────

  /** Primary line for a row in the section list. Typed reads, no JSON.parse. */
  getItemTitle(section: SectionType, row: VendorProfileRecord): string {
    switch (section) {
      case 'corporate_identity': return (row as { legalName?: string }).legalName ?? 'Corporate identity';
      case 'financial': return 'Financial profile';
      case 'insurance': return (row as InsuranceCoverageRecord).carrier ?? 'Insurance policy';
      case 'personnel': return (row as PersonnelRecord).fullName ?? 'Personnel';
      case 'reference': return (row as ClientReferenceRecord).clientName ?? 'Client reference';
      case 'attestation': return 'Service capability';
    }
  }

  /** Secondary line. Was a JSON.parse of the blob's `data` column. */
  getItemDetail(section: SectionType, row: VendorProfileRecord): string {
    switch (section) {
      case 'insurance': {
        const r = row as InsuranceCoverageRecord;
        return r.policyNumber ? `Policy #${r.policyNumber}` : '';
      }
      case 'personnel':
        return (row as PersonnelRecord).title ?? '';
      case 'attestation': {
        const r = row as ServiceCapabilityRecord;
        return r.yearsExperience != null ? `${r.yearsExperience} years` : '';
      }
      case 'reference':
        return (row as ClientReferenceRecord).projectName ?? '';
      default:
        return '';
    }
  }
}
