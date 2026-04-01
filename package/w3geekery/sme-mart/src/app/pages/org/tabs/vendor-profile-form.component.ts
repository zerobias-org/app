import {
  Component,
  inject,
  input,
  output,
  signal,
  computed,
  ChangeDetectionStrategy,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import type {
  MarketplaceProfileItem,
  SectionType,
  CreateMarketplaceProfileItemRequest,
  CorporateIdentityData,
  AttestationData,
  InsuranceData,
  ReferenceData,
  PersonnelData,
  FinancialData,
} from '../../../core/models/marketplace-profile-item.model';

type SectionData =
  | CorporateIdentityData
  | AttestationData
  | InsuranceData
  | ReferenceData
  | PersonnelData
  | FinancialData;

@Component({
  selector: 'app-vendor-profile-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatSelectModule,
    MatCardModule,
  ],
  templateUrl: './vendor-profile-form.component.html',
  styleUrl: './vendor-profile-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VendorProfileForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);

  // Input signals (per director FLAG-3)
  readonly mode = input<'create' | 'edit'>('create');
  readonly section = input<SectionType>('corporate_identity');
  readonly item = input<MarketplaceProfileItem | null>(null);

  // Output signals
  readonly save = output<CreateMarketplaceProfileItemRequest>();
  readonly close = output<void>();

  // Form state
  readonly form = signal<FormGroup | null>(null);
  readonly submitting = signal(false);

  // Computed: is item expired
  readonly isItemExpired = computed(() => {
    const item = this.item();
    if (!item?.expires_at) return false;
    return new Date(item.expires_at) < new Date();
  });

  ngOnInit(): void {
    this.form.set(this.createForm());
    // Populate form if in edit mode
    if (this.mode() === 'edit') {
      this.populateForm();
    }
  }

  private createForm(): FormGroup {
    const section = this.section();
    const baseFields = {
      name: ['', Validators.required],
      description: [''],
    };

    switch (section) {
      case 'corporate_identity':
        return this.fb.group({
          ...baseFields,
          legalEntityName: ['', Validators.required],
          businessType: [''],
          foundedYear: [''],
          yearsInBusiness: [''],
          certifications: [''],
          numberOfEmployees: [''],
        });

      case 'attestation':
        return this.fb.group({
          ...baseFields,
          serviceType: ['', Validators.required],
          yearsExperience: ['', Validators.required],
          clientCount: [''],
          avgProjectDuration: [''],
          certifications: [''],
          specializations: [''],
        });

      case 'insurance':
        return this.fb.group({
          ...baseFields,
          policyNumber: ['', Validators.required],
          carrier: ['', Validators.required],
          coverageType: [''],
          coverageAmount: ['', Validators.required],
          effectiveDate: ['', Validators.required],
          expirationDate: ['', Validators.required],
          limits: [''],
          deductible: [''],
        });

      case 'reference':
        return this.fb.group({
          ...baseFields,
          clientName: ['', Validators.required],
          contactPerson: ['', Validators.required],
          email: ['', [Validators.required, Validators.email]],
          phone: [''],
          projectType: [''],
          projectDuration: [''],
          outcome: [''],
        });

      case 'personnel':
        return this.fb.group({
          ...baseFields,
          name: ['', Validators.required],
          title: ['', Validators.required],
          yearsExperience: ['', Validators.required],
          specialization: [''],
          credentials: [''],
          certifications: [''],
        });

      case 'financial':
        return this.fb.group({
          ...baseFields,
          annualRevenue: ['', Validators.required],
          profitMargin: [''],
          employeeCount: [''],
          yearsOperating: [''],
          revenueGrowth: [''],
        });

      default:
        return this.fb.group(baseFields);
    }
  }

  private populateForm(): void {
    const item = this.item();
    if (!item) return;

    try {
      // Director FLAG-2: item.data is a string (JSON) — parse it before template use
      let data: SectionData;
      if (typeof item.data === 'string') {
        data = JSON.parse(item.data) as SectionData;
      } else {
        data = item.data as SectionData;
      }

      const formValue = this.mapItemToForm(item, data);
      const fg = this.form();
      if (fg) {
        fg.patchValue(formValue);
      }
    } catch (err) {
      console.error('[VendorProfileForm] Failed to parse item data:', err);
    }
  }

  private mapItemToForm(
    item: MarketplaceProfileItem,
    data: SectionData
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {
      name: item.name,
      description: item.description || '',
    };

    // Handle array fields: join with ', '
    for (const [key, value] of Object.entries(data)) {
      if (Array.isArray(value)) {
        result[key] = value.join(', ');
      } else {
        result[key] = value;
      }
    }

    // Handle dates: format as YYYY-MM-DD for mat-datepicker
    if (item.section === 'insurance' && item.expires_at) {
      result['expirationDate'] = new Date(item.expires_at);
    }

    return result;
  }

  onSubmit(): void {
    const fg = this.form();
    if (!fg || fg.invalid) {
      this.snackBar.open('Please fill in all required fields', 'OK');
      return;
    }

    this.submitting.set(true);

    try {
      const request = this.mapFormToRequest(fg.value);
      this.save.emit(request);
    } catch (err) {
      console.error('[VendorProfileForm] Failed to map form to request:', err);
      this.snackBar.open('Failed to save form data', 'OK');
    } finally {
      this.submitting.set(false);
    }
  }

  private mapFormToRequest(
    formValue: Record<string, unknown>
  ): CreateMarketplaceProfileItemRequest {
    const section = this.section();
    const data = this.mapFormToData(formValue, section);

    return {
      section,
      name: formValue['name'] as string,
      description: (formValue['description'] as string) || undefined,
      data,
      expiresAt:
        section === 'insurance'
          ? this.formatDateForIso(formValue['expirationDate'])
          : undefined,
      status: 'active',
    };
  }

  private mapFormToData(
    formValue: Record<string, unknown>,
    section: SectionType
  ): SectionData {
    const baseData = {
      name: formValue['name'],
      description: formValue['description'],
    };

    // Parse array fields back from comma-separated strings
    const parseArrayField = (value: unknown): string[] => {
      if (!value) return [];
      const str = typeof value === 'string' ? value.trim() : '';
      return str
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);
    };

    switch (section) {
      case 'corporate_identity':
        return {
          legalEntityName: formValue['legalEntityName'] as string,
          businessType: (formValue['businessType'] as string) || '',
          foundedYear: this.parseNumber(formValue['foundedYear']),
          yearsInBusiness: this.parseNumber(formValue['yearsInBusiness']),
          certifications: parseArrayField(formValue['certifications']),
          numberOfEmployees: this.parseNumber(formValue['numberOfEmployees']),
        } as CorporateIdentityData;

      case 'attestation':
        return {
          serviceType: formValue['serviceType'] as string,
          yearsExperience: this.parseNumber(formValue['yearsExperience']),
          clientCount: this.parseNumber(formValue['clientCount']),
          avgProjectDuration: (formValue['avgProjectDuration'] as string) || '',
          certifications: parseArrayField(formValue['certifications']),
          specializations: parseArrayField(formValue['specializations']),
        } as AttestationData;

      case 'insurance':
        return {
          policyNumber: formValue['policyNumber'] as string,
          carrier: formValue['carrier'] as string,
          coverageType: (formValue['coverageType'] as string) || '',
          coverageAmount: this.parseNumber(formValue['coverageAmount']),
          effectiveDate: this.formatDateForIso(formValue['effectiveDate']),
          expirationDate: this.formatDateForIso(formValue['expirationDate']),
          limits: (formValue['limits'] as string) || '',
          deductible: this.parseNumber(formValue['deductible']),
        } as InsuranceData;

      case 'reference':
        return {
          clientName: formValue['clientName'] as string,
          contactPerson: formValue['contactPerson'] as string,
          email: formValue['email'] as string,
          phone: (formValue['phone'] as string) || '',
          projectType: (formValue['projectType'] as string) || '',
          projectDuration: (formValue['projectDuration'] as string) || '',
          outcome: (formValue['outcome'] as string) || '',
        } as ReferenceData;

      case 'personnel':
        return {
          name: formValue['name'] as string,
          title: formValue['title'] as string,
          yearsExperience: this.parseNumber(formValue['yearsExperience']),
          specialization: (formValue['specialization'] as string) || '',
          credentials: parseArrayField(formValue['credentials']),
          certifications: parseArrayField(formValue['certifications']),
        } as PersonnelData;

      case 'financial':
        return {
          annualRevenue: this.parseNumber(formValue['annualRevenue']),
          profitMargin: this.parseNumber(formValue['profitMargin']),
          employeeCount: this.parseNumber(formValue['employeeCount']),
          yearsOperating: this.parseNumber(formValue['yearsOperating']),
          revenueGrowth: formValue['revenueGrowth'] ? this.parseNumber(formValue['revenueGrowth']) : undefined,
        } as FinancialData;

      default:
        return baseData as unknown as SectionData;
    }
  }

  private parseNumber(value: unknown): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string' && value.trim()) return parseFloat(value);
    return 0;
  }

  private formatDateForIso(value: unknown): string {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (value instanceof Date) {
      return value.toISOString().split('T')[0];
    }
    return '';
  }

  onCancel(): void {
    this.close.emit();
  }
}
