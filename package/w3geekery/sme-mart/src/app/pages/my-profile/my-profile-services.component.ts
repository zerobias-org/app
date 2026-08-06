import { Component, inject, signal, computed, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ZbEmptyStateContainerComponent } from '@zerobias-org/ngx-library';
import { ServiceOfferingsService } from '../../core/services/service-offerings.service';
import { ProviderProfilesService } from '../../core/services/provider-profiles.service';
import { ImpersonationService } from '../../core/services/impersonation.service';
import {
  KINDS_BY_FAMILY,
  type VendorListing,
  type VendorListingFamily,
  type VendorListingKind,
} from '../../core/models';

const FAMILY_LABELS: Record<VendorListingFamily, string> = {
  SERVICE: 'Service',
  LICENSED_GOOD: 'Licensed Good',
  PRODUCTIZED: 'Productized',
};

const KIND_LABELS: Record<VendorListingKind, string> = {
  BESPOKE_SERVICE: 'Bespoke Service',
  FRAMEWORK: 'Framework',
  ASSESSOR_LOGIC: 'Assessor Logic',
  BOM: 'Bill of Materials',
  FEATURE_PACK: 'Feature Pack',
  APP: 'Application',
  AGENT: 'Agent',
};

@Component({
  selector: 'app-my-profile-services',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSnackBarModule,
    ZbEmptyStateContainerComponent,
  ],
  templateUrl: './my-profile-services.component.html',
  styleUrl: './my-profile-services.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyProfileServices implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly impersonation = inject(ImpersonationService);
  private readonly serviceOfferings = inject(ServiceOfferingsService);
  private readonly providerProfiles = inject(ProviderProfilesService);
  private readonly snackBar = inject(MatSnackBar);

  readonly loading = signal(true);
  readonly services = signal<VendorListing[]>([]);
  readonly showForm = signal(false);
  readonly saving = signal(false);
  private ownerId = '';

  /**
   * Price and pricing type are GONE, not relocated. VendorListing stores no money -
   * pricing lives in the Ledger and `offers` carries pointers to it. There is no Offer
   * shape to write against yet, so this form creates a listing without offers and the
   * seller prices it once the Ledger surface exists.
   */
  readonly form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    summary: [''],
    family: ['SERVICE' as VendorListingFamily, Validators.required],
    kind: ['BESPOKE_SERVICE' as VendorListingKind, Validators.required],
    deliveryTime: [''],
  });

  readonly families = (Object.keys(FAMILY_LABELS) as VendorListingFamily[]).map(value => ({
    value,
    label: FAMILY_LABELS[value],
  }));

  private readonly selectedFamily = toSignal(this.form.controls.family.valueChanges, {
    initialValue: this.form.controls.family.value,
  });

  /** Kind is constrained by family - each kind belongs to exactly one family. */
  readonly availableKinds = computed(() =>
    KINDS_BY_FAMILY[this.selectedFamily()].map(value => ({ value, label: KIND_LABELS[value] })),
  );

  readonly kindLabel = (kind: VendorListingKind): string => KIND_LABELS[kind];

  async ngOnInit() {
    try {
      const userId = this.impersonation.effectiveUserId();
      const detail = await this.providerProfiles.getProviderByUserId(userId);
      if (detail) {
        this.ownerId = detail.id;
        const listings = await this.serviceOfferings.getServicesByProvider(detail.id);
        this.services.set(listings);
      }
    } catch (err) {
      console.warn('[MyProfileServices] Failed to load:', err);
    } finally {
      this.loading.set(false);
    }
  }

  /** Reset kind whenever family changes - the previous kind may not belong to the new family. */
  onFamilyChange(family: VendorListingFamily): void {
    this.form.controls.kind.setValue(KINDS_BY_FAMILY[family][0]);
  }

  toggleForm(): void {
    this.showForm.update((v) => !v);
    if (!this.showForm()) this.form.reset();
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid || !this.ownerId) return;

    this.saving.set(true);
    try {
      const { title, summary, family, kind, deliveryTime } = this.form.getRawValue();
      const created = await this.serviceOfferings.createService(this.ownerId, {
        title,
        summary: summary || null,
        family,
        kind,
        deliveryTime: deliveryTime || null,
        active: true,
      });
      this.services.update((list) => [...list, created]);
      this.showForm.set(false);
      this.form.reset();
      this.snackBar.open('Listing created', 'OK', { duration: 3000 });
    } catch (err) {
      console.error('[MyProfileServices] Create failed:', err);
      this.snackBar.open('Failed to create listing', 'OK', { duration: 5000 });
    } finally {
      this.saving.set(false);
    }
  }

  async onDelete(listing: VendorListing): Promise<void> {
    try {
      await this.serviceOfferings.deleteService(listing.id);
      this.services.update((list) => list.filter((s) => s.id !== listing.id));
      this.snackBar.open('Listing deleted', 'OK', { duration: 3000 });
    } catch (err) {
      console.error('[MyProfileServices] Delete failed:', err);
      this.snackBar.open('Failed to delete listing', 'OK', { duration: 5000 });
    }
  }
}
