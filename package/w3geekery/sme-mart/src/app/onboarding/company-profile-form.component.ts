import {
  Component,
  inject,
  OnInit,
  ChangeDetectionStrategy,
  signal,
} from '@angular/core';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormControl,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ZerobiasClientApp } from '@zerobias-com/zerobias-client';
import { MarketplaceProfileService } from '../core/services/marketplace-profile.service';
import { CompanyInfoStruct } from './company-info.model';

/**
 * Custom validators for company profile form fields
 */
const urlValidator = (control: FormControl): { [key: string]: boolean } | null => {
  if (!control.value) return null;
  const httpsUrlRegex = /^https:\/\/.+\..+/;
  return httpsUrlRegex.test(control.value) ? null : { pattern: true };
};

const emailValidator = (
  control: FormControl
): { [key: string]: boolean } | null => {
  if (!control.value) return null;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(control.value) ? null : { email: true };
};

const minValidator = (min: number) => (
  control: FormControl
): { [key: string]: boolean } | null => {
  if (control.value === null || control.value === undefined || control.value === '')
    return null;
  return control.value >= min ? null : { min: true };
};

@Component({
  selector: 'app-company-profile-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatAutocompleteModule,
  ],
  templateUrl: './company-profile-form.component.html',
  styleUrl: './company-profile-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyProfileFormComponent implements OnInit {
  private readonly service = inject(MarketplaceProfileService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);
  private readonly zbApp = inject(ZerobiasClientApp);

  // State signals
  form = signal<FormGroup>(new FormGroup({}));
  isLoading = signal(true);
  loadError = signal<string | null>(null);
  isSaving = signal(false);
  originalSnapshot = signal<Partial<CompanyInfoStruct> | null>(null);

  // Pre-fill markers
  preFilledFields = signal<Set<string>>(new Set());

  ngOnInit(): void {
    this.initializeForm();
  }

  private async initializeForm(): Promise<void> {
    try {
      const orgId = this.zbApp.getCurrentOrgId();
      if (!orgId) {
        this.loadError.set('Unable to determine organization. Please refresh and try again.');
        this.isLoading.set(false);
        this.snackBar.open('Error: Organization not found', 'Dismiss', {
          duration: 5000,
        });
        return;
      }

      // Read pre-fill from service
      const preFilledData = await this.service.readProfileForOrg(orgId);
      this.originalSnapshot.set(preFilledData);

      // Build form with validators
      const newForm = this.createFormGroup();
      newForm.patchValue(preFilledData);

      // Track which fields were pre-filled
      const preFilled = new Set<string>();
      Object.keys(preFilledData).forEach(key => {
        const value = (preFilledData as any)[key];
        if (value !== undefined && value !== null && value !== '') {
          if (typeof value === 'object') {
            // Handle nested objects
            Object.keys(value).forEach(nestedKey => {
              const nestedValue = (value as any)[nestedKey];
              if (nestedValue !== undefined && nestedValue !== null && nestedValue !== '') {
                preFilled.add(`${key}.${nestedKey}`);
              }
            });
          } else {
            preFilled.add(key);
          }
        }
      });
      this.preFilledFields.set(preFilled);

      this.form.set(newForm);
      this.isLoading.set(false);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'Failed to load profile data';
      this.loadError.set(errorMsg);
      this.isLoading.set(false);
      this.snackBar.open(`Error: ${errorMsg}`, 'Dismiss', { duration: 5000 });
    }
  }

  private createFormGroup(): FormGroup {
    return this.fb.group({
      legalName: ['', [Validators.required]],
      dba: [''],
      logoUrl: ['', [urlValidator]],
      shortBlurb: ['', [Validators.maxLength(500)]],
      longDescription: ['', [Validators.maxLength(5000)]],
      primaryContact: this.fb.group({
        userId: [''],
        name: [''],
        email: ['', [emailValidator]],
      }),
      website: ['', [urlValidator]],
      hqLocation: this.fb.group({
        street: [''],
        city: [''],
        state: [''],
        country: [''],
        postalCode: [''],
      }),
      yearsInBusiness: ['', [minValidator(0)]],
      employeeCount: [''],
    });
  }

  isPreFilled(fieldName: string): boolean {
    return this.preFilledFields().has(fieldName);
  }

  async onSave(): Promise<void> {
    const currentForm = this.form();
    if (currentForm.invalid) {
      this.snackBar.open('Please fix validation errors before saving', 'Dismiss', {
        duration: 3000,
      });
      return;
    }

    this.isSaving.set(true);

    try {
      const orgId = this.zbApp.getCurrentOrgId();
      if (!orgId) {
        throw new Error('Organization ID not found');
      }

      const originalState = this.originalSnapshot() || {};
      const currentState = currentForm.value;

      await this.service.save(orgId, currentState, originalState);

      this.snackBar.open('Profile saved successfully!', 'Dismiss', {
        duration: 3000,
      });

      // Navigate to projects board
      await this.router.navigate(['/projects']);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'Failed to save profile';
      this.snackBar.open(`Error: ${errorMsg}`, 'Dismiss', { duration: 5000 });
      console.error('[PROFILE_SAVE_FAILURE]', error);
    } finally {
      this.isSaving.set(false);
    }
  }

  async onSkip(): Promise<void> {
    // Skip without saving — no onboarding_complete marker written
    await this.router.navigate(['/projects']);
  }

  async onRetryLoad(): Promise<void> {
    this.loadError.set(null);
    this.isLoading.set(true);
    await this.initializeForm();
  }
}
