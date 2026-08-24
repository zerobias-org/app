import {
  Component,
  inject,
  input,
  output,
  signal,
  computed,
  effect,
  ChangeDetectionStrategy,
  OnInit,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import {
  BUSINESS_CLASSIFICATION_LABELS,
  EMPLOYEE_COUNT_LABELS,
  SECTION_CARDINALITY,
  SECTION_LABELS,
  type BusinessClassification,
  type EmployeeCountBand,
  type InsuranceCoverageRecord,
  type SectionType,
  type VendorProfileRecord,
} from '../../../core/models/vendor-profile.model';

/**
 * Side-drawer form for one vendor-profile section.
 *
 * Each section now maps to its own schema class rather than a JSON blob, so the controls
 * are the class's real fields. Three of them are not renames of what the blob collected:
 *
 *   businessType      -> businessClassification   free text  -> closed 7-value enum
 *   numberOfEmployees -> employeeCount            number     -> banded enum
 *   serviceType       -> serviceSegmentId         free text  -> Catalog segment UUID
 *
 * The first two are selects here. The third needs a Catalog picker, which is deliberately
 * NOT built this pass: the QualificationResource/segment picker work is specced separately
 * and a picker over an unloaded catalog demos as broken. The control accepts a segment
 * UUID directly until that lands.
 *
 * `name` is not collected. Every class extends Object, where name is required, so the
 * service derives it from each section's primary field.
 */
@Component({
  selector: 'app-vendor-profile-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatSelectModule,
    MatCheckboxModule,
    MatCardModule,
  ],
  templateUrl: './vendor-profile-form.component.html',
  styleUrl: './vendor-profile-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VendorProfileForm implements OnInit {
  private readonly fb = inject(FormBuilder);

  readonly mode = input<'create' | 'edit'>('create');
  readonly section = input<SectionType>('corporate_identity');
  readonly item = input<VendorProfileRecord | null>(null);
  readonly orgName = input<string>('');

  readonly save = output<Partial<VendorProfileRecord>>();
  readonly close = output<void>();

  readonly form = signal<FormGroup | null>(null);
  readonly submitting = signal(false);

  readonly sectionLabels = SECTION_LABELS;
  readonly businessClassifications = Object.entries(BUSINESS_CLASSIFICATION_LABELS)
    .map(([value, label]) => ({ value: value as BusinessClassification, label }));
  readonly employeeCountBands = Object.entries(EMPLOYEE_COUNT_LABELS)
    .map(([value, label]) => ({ value: value as EmployeeCountBand, label }));

  /** Singleton sections read as "complete your X", not "add an X". */
  readonly isSingleton = computed(() => SECTION_CARDINALITY[this.section()] === 'one');

  readonly heading = computed(() => {
    const label = SECTION_LABELS[this.section()];
    if (this.isSingleton()) return label;
    return this.mode() === 'edit' ? `Edit ${label}` : `Add ${label}`;
  });

  /** Only InsuranceCoverage carries its own expiry; everything else uses verification expiry. */
  readonly isItemExpired = computed(() => {
    const row = this.item();
    if (!row) return false;
    const expiry = (row as InsuranceCoverageRecord).expiresAt ?? row.verificationExpiresAt;
    return expiry ? new Date(expiry) < new Date() : false;
  });

  constructor() {
    // orgName arrives after form init (the parent's getCurrentOrg subscription resolves
    // asynchronously), so seed legalName for a new corporate-identity record once it does.
    // Edit mode is owned by populateForm().
    effect(() => {
      const name = this.orgName();
      if (!name) return;
      if (this.mode() !== 'create') return;
      if (this.section() !== 'corporate_identity') return;
      const control = this.form()?.get('legalName');
      if (control && !control.value) control.setValue(name);
    });
  }

  ngOnInit(): void {
    this.form.set(this.createForm());
    if (this.mode() === 'edit') this.populateForm();
  }

  private createForm(): FormGroup {
    switch (this.section()) {
      case 'corporate_identity':
        return this.fb.group({
          legalName: [this.mode() === 'create' ? this.orgName() : '', Validators.required],
          dba: [''],
          tagline: [''],
          shortDescription: [''],
          longDescription: [''],
          website: [''],
          foundedYear: [null as number | null],
          businessClassification: [null as BusinessClassification | null],
          employeeCount: [null as EmployeeCountBand | null],
        });

      case 'attestation':
        return this.fb.group({
          serviceSegmentId: [''],
          yearsExperience: [null as number | null],
          clientCount: [null as number | null],
          avgProjectDuration: [''],
        });

      case 'insurance':
        return this.fb.group({
          carrier: ['', Validators.required],
          policyNumber: ['', Validators.required],
          coverageType: [''],
          coverageAmount: [null as number | null],
          currency: ['USD'],
          effectiveDate: [null as string | null],
          expiresAt: [null as string | null, Validators.required],
          certificateUrl: [''],
        });

      case 'reference':
        return this.fb.group({
          clientName: ['', Validators.required],
          contactName: ['', Validators.required],
          contactEmail: ['', [Validators.required, Validators.email]],
          contactPhone: [''],
          relationship: [''],
          projectName: [''],
          startDate: [null as string | null],
          endDate: [null as string | null],
          summary: [''],
        });

      case 'personnel':
        return this.fb.group({
          fullName: ['', Validators.required],
          title: ['', Validators.required],
          email: ['', Validators.email],
          specialization: [''],
          bio: [''],
          linkedinUrl: [''],
          isKeyPersonnel: [false],
          backgroundCheckStatus: [''],
        });

      case 'financial':
        return this.fb.group({
          annualRevenue: [null as number | null],
          revenueCurrency: ['USD'],
          creditScore: [null as number | null],
          creditRatingAgency: [''],
          bankName: [''],
          dunsNumber: [''],
          yearEndMonth: [null as number | null],
        });
    }
  }

  /**
   * Fill the form from the row being edited.
   *
   * Reads the typed row directly. The blob version had to JSON.parse a `data` column and
   * hope the shape matched the section.
   */
  private populateForm(): void {
    const row = this.item();
    const fg = this.form();
    if (!row || !fg) return;

    const source = row as unknown as Record<string, unknown>;
    for (const key of Object.keys(fg.controls)) {
      if (key in source && source[key] != null) {
        fg.get(key)?.setValue(source[key]);
      }
    }
  }

  onSubmit(): void {
    const fg = this.form();
    if (!fg || fg.invalid) {
      fg?.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    try {
      // Empty strings become null so an untouched optional control does not write "".
      const raw = fg.getRawValue() as Record<string, unknown>;
      const values = Object.fromEntries(
        Object.entries(raw).map(([k, v]) => [k, v === '' ? null : v]),
      ) as Partial<VendorProfileRecord>;
      this.save.emit(values);
    } finally {
      this.submitting.set(false);
    }
  }

  onCancel(): void {
    this.close.emit();
  }
}
