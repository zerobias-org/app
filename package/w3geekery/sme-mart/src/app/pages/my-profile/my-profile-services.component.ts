import { Component, inject, signal, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
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
import type { ServiceOffering, PricingType } from '../../core/models';

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
  readonly services = signal<ServiceOffering[]>([]);
  readonly showForm = signal(false);
  readonly saving = signal(false);
  private providerId = '';

  readonly form = this.fb.group({
    title: ['', Validators.required],
    description: [''],
    category: ['', Validators.required],
    pricing_type: ['hourly' as PricingType, Validators.required],
    price: [''],
    delivery_time: [''],
  });

  readonly pricingTypes: { value: PricingType; label: string }[] = [
    { value: 'hourly', label: 'Hourly' },
    { value: 'fixed', label: 'Fixed Price' },
    { value: 'subscription', label: 'Subscription' },
    { value: 'custom', label: 'Custom' },
  ];

  async ngOnInit() {
    try {
      const userId = this.impersonation.effectiveUserId();
      const detail = await this.providerProfiles.getProviderByUserId(userId);
      if (detail) {
        this.providerId = detail.id;
        const svcList = await this.serviceOfferings.getServicesByProvider(detail.id);
        this.services.set(svcList);
      }
    } catch (err) {
      console.warn('[MyProfileServices] Failed to load:', err);
    } finally {
      this.loading.set(false);
    }
  }

  toggleForm(): void {
    this.showForm.update((v) => !v);
    if (!this.showForm()) this.form.reset({ pricing_type: 'hourly' });
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid || !this.providerId) return;

    this.saving.set(true);
    try {
      const data = this.form.value as any;
      data.is_active = true;
      const created = await this.serviceOfferings.createService(this.providerId, data);
      this.services.update((list) => [...list, created]);
      this.showForm.set(false);
      this.form.reset({ pricing_type: 'hourly' });
      this.snackBar.open('Service created', 'OK', { duration: 3000 });
    } catch (err) {
      console.error('[MyProfileServices] Create failed:', err);
      this.snackBar.open('Failed to create service', 'OK', { duration: 5000 });
    } finally {
      this.saving.set(false);
    }
  }

  async onDelete(service: ServiceOffering): Promise<void> {
    try {
      await this.serviceOfferings.deleteService(service.id);
      this.services.update((list) => list.filter((s) => s.id !== service.id));
      this.snackBar.open('Service deleted', 'OK', { duration: 3000 });
    } catch (err) {
      console.error('[MyProfileServices] Delete failed:', err);
      this.snackBar.open('Failed to delete service', 'OK', { duration: 5000 });
    }
  }
}
