import { Component, inject, signal, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ProviderProfilesService } from '../../core/services/provider-profiles.service';
import { ImpersonationService } from '../../core/services/impersonation.service';
import { StarRating } from '../../shared/components/star-rating/star-rating.component';
import type { ProviderDetailRow } from '../../core/models';

@Component({
  selector: 'app-my-profile-overview',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSelectModule,
    MatSnackBarModule,
    StarRating,
  ],
  templateUrl: './my-profile-overview.component.html',
  styleUrl: './my-profile-overview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyProfileOverview implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly impersonation = inject(ImpersonationService);
  private readonly providerProfiles = inject(ProviderProfilesService);
  private readonly snackBar = inject(MatSnackBar);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly profile = signal<ProviderDetailRow | null>(null);
  readonly initials = signal('');

  readonly form = this.fb.group({
    display_name: ['', Validators.required],
    headline: [''],
    about: [''],
    hourly_rate: [''],
    availability_status: ['available'],
    response_time: [''],
  });

  async ngOnInit() {
    try {
      const userId = this.impersonation.effectiveUserId();
      const detail = await this.providerProfiles.getProviderByUserId(userId);
      if (detail) {
        this.profile.set(detail);
        this.initials.set(this.getInitials(detail.display_name));
        this.form.patchValue({
          display_name: detail.display_name,
          headline: detail.headline || '',
          about: detail.about || '',
          hourly_rate: detail.hourly_rate || '',
          availability_status: detail.availability_status,
          response_time: detail.response_time || '',
        });
      }
    } catch (err) {
      console.warn('[MyProfileOverview] Failed to load profile:', err);
    } finally {
      this.loading.set(false);
    }
  }

  async onSave(): Promise<void> {
    const p = this.profile();
    if (!p || this.form.invalid) return;

    this.saving.set(true);
    try {
      await this.providerProfiles.updateProfile(p.id, this.form.value as any);
      this.snackBar.open('Profile saved', 'OK', { duration: 3000 });
    } catch (err) {
      console.error('[MyProfileOverview] Save failed:', err);
      this.snackBar.open('Failed to save profile', 'OK', { duration: 5000 });
    } finally {
      this.saving.set(false);
    }
  }

  private getInitials(name: string): string {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
  }
}
