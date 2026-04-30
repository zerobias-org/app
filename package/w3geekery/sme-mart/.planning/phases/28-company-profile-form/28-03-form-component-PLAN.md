---
phase: 28-company-profile-form
plan: 03
type: execute
wave: 2
depends_on:
  - 28-01
  - 28-02
files_modified:
  - src/app/onboarding/company-profile-form.component.ts
  - src/app/onboarding/company-profile-form.component.html
  - src/app/onboarding/company-profile-form.component.scss
  - src/app/onboarding/company-profile-form.component.spec.ts
autonomous: true
requirements:
  - CP-01
  - CP-03
  - CP-06
user_setup: []

must_haves:
  truths:
    - "Form renders all 16 user-facing sections as form controls"
    - "Pre-filled fields display '(pre-filled from platform)' annotation"
    - "Empty fields with no fallback display '(please provide)' hint"
    - "Skip-for-now button routes to /projects without writing data"
    - "All required validators applied (non-empty legal_name, URL format for website/logo_url, RFC5322 email, etc.)"
  artifacts:
    - path: "src/app/onboarding/company-profile-form.component.ts"
      provides: "Standalone component, reactive forms, org-id resolution, form binding"
      exports: ["CompanyProfileFormComponent"]
    - path: "src/app/onboarding/company-profile-form.component.html"
      provides: "Form template with 16 sections, pre-fill annotations, error messages"
      contains: ["matInput", "formControlName", "matError", "ngIf"]
    - path: "src/app/onboarding/company-profile-form.component.scss"
      provides: "Styling (ngx-library defaults + minimal custom)"
      contains: ["scss"]
    - path: "src/app/onboarding/company-profile-form.component.spec.ts"
      provides: "Unit tests for CP-01, CP-03, CP-06"
      exports: ["(test suite)"]
  key_links:
    - from: "company-profile-form.component.ts"
      to: "marketplace-profile.service.ts"
      via: "inject(), readProfileForOrg(), save()"
    - from: "company-profile-form.component.ts"
      to: "company-info-sections.ts + company-info.model.ts"
      via: "constant + type imports"
    - from: "company-profile-form.component.html"
      to: "ngx-library form components"
      via: "<input matInput>, <textarea matInput>, <mat-select>"
---

<objective>
Build the standalone form component that users interact with. Form mounts with pre-fills from MarketplaceProfileService, binds a reactive FormGroup, supports editing, save, and skip flows.

Purpose: Complete Phase 28's user-facing surface; ready for Phase 27 to wire the routing guard and test integration.
Output: Component + template + styles + unit tests covering CP-01 (form renders), CP-03 (please-provide hints), CP-06 (skip flow).
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/ROADMAP.md
@.planning/REQUIREMENTS.md
@.planning/phases/28-company-profile-form/28-CONTEXT.md
@.planning/phases/28-company-profile-form/28-RESEARCH.md
@.planning/director/COMPANY-INFO-CONVENTION.md
@src/app/pages/org/tabs/vendor-profile-form.component.ts (reference for form patterns; read only, do NOT copy vendor sections)
@src/app/app.config.ts (ZerobiasClientApp DI)
@./CLAUDE.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create CompanyProfileFormComponent (TS) with pre-fill + form binding</name>
  <files>src/app/onboarding/company-profile-form.component.ts</files>
  <read_first>
    - src/app/core/services/marketplace-profile.service.ts (just created)
    - .planning/director/COMPANY-INFO-CONVENTION.md (field types, validation rules)
    - .planning/phases/28-company-profile-form/28-RESEARCH.md (form layout strategy)
    - .planning/phases/28-company-profile-form/28-CONTEXT.md (Claude's discretion: nested FormGroups)
    - src/app/pages/org/tabs/vendor-profile-form.component.ts (form pattern reference; not vendor sections)
    - ./CLAUDE.md (Angular 21: inject(), input()/output(), standalone, suffix naming)
  </read_first>
  <action>
    Create `src/app/onboarding/company-profile-form.component.ts` (standalone, Angular 21 patterns):
    
    **Class decorator:**
    ```typescript
    @Component({
      selector: 'app-company-profile-form',
      standalone: true,
      imports: [
        CommonModule,
        ReactiveFormsModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
        MatFormFieldModule,
        MatProgressSpinnerModule,
        // ngx-library components as needed
      ],
      templateUrl: './company-profile-form.component.html',
      styleUrl: './company-profile-form.component.scss',
    })
    ```
    
    **Constructor (DI via inject, no constructor params per Angular 21):**
    ```typescript
    constructor(
      private service = inject(MarketplaceProfileService),
      private router = inject(Router),
      private snackBar = inject(MatSnackBar),
      private cdr = inject(ChangeDetectorRef),
    ) {}
    ```
    
    OR use `private service = inject(MarketplaceProfileService);` inside the class.
    
    **Lifecycle:**
    
    1. **ngOnInit:**
       - Get currentOrgId from `inject(ZerobiasClientApp).getCurrentOrgId()`
       - Call `service.readProfileForOrg(orgId)` → resolve pre-fill CompanyInfoStruct
       - Build form: `this.form = new FormGroup({ ... })` with nested FormGroups for primaryContact and hqLocation
       - Apply all validators per COMPANY-INFO-CONVENTION.md (required for legalName, URL validators for logoUrl/website, email validator for primaryContact.email, etc.)
       - Snapshot pre-fill: `this.originalSnapshot = this.form.value;`
       - On load error: show snackbar, disable form, offer retry
    
    2. **Form structure (reactive FormGroup with nested groups):**
       ```typescript
       this.form = new FormGroup({
         legalName: new FormControl('', [Validators.required]),
         dba: new FormControl(''),
         logoUrl: new FormControl('', [urlValidator]),
         shortBlurb: new FormControl(''),
         longDescription: new FormControl(''),
         primaryContact: new FormGroup({
           userId: new FormControl(''),
           name: new FormControl(''),
           email: new FormControl('', [emailValidator]),
         }),
         website: new FormControl('', [urlValidator]),
         hqLocation: new FormGroup({
           street: new FormControl(''),
           city: new FormControl(''),
           state: new FormControl(''),
           country: new FormControl(''),
           postalCode: new FormControl(''),
         }),
         yearsInBusiness: new FormControl('', [minValidator(0)]),
         employeeCount: new FormControl(''),
       });
       ```
    
    3. **Save handler:**
       - Snapshot original state at mount (after pre-fill resolves)
       - On save click:
         - Validate form (if invalid, show errors, don't proceed)
         - Call `service.save(orgId, form.value, originalSnapshot)`
         - On success: show snackbar "Profile saved!", navigate to /projects
         - On error: show snackbar with error message, offer retry
    
    4. **Skip-for-now handler:**
       - Click skip: `router.navigate(['/projects'])` immediately
       - Do NOT call service.save()
    
    **Field annotations (CP-03):**
    - Track which fields were pre-filled (from MPI or org fallback) vs empty
    - Template will render "(pre-filled from platform)" label next to pre-filled fields
    - Template will render "(please provide)" placeholder for empty fields with no fallback
    
    **Validators (per COMPANY-INFO-CONVENTION.md):**
    - `legal_name`: Validators.required
    - `logo_url` + `website`: custom URL validator (HTTPS pattern)
    - `primary_contact.email`: custom email validator (RFC5322)
    - `years_in_business`: custom number validator (≥ 0)
    - `employee_count`: custom select validator (one of allowlist)
    - `short_blurb`: custom max-length validator (≤ 500)
    - `long_description`: custom max-length validator (≤ 5000)
    
    **Error handling:**
    - Form-level validation errors: display matError under each field
    - Save-level errors (Network, Pipeline): snackbar + enable retry button
    - Org-id undefined at mount: snackbar + error message
  </action>
  <verify>
    <automated>grep -q "@Component" src/app/onboarding/company-profile-form.component.ts && grep -q "export class CompanyProfileFormComponent" src/app/onboarding/company-profile-form.component.ts</automated>
  </verify>
  <done>Component class created, implements OnInit, has form binding, pre-fill snapshot logic, save/skip handlers, org-id resolution via inject().</done>
</task>

<task type="auto">
  <name>Task 2: Create template (HTML) with 16 form sections and annotations</name>
  <files>src/app/onboarding/company-profile-form.component.html</files>
  <read_first>
    - src/app/onboarding/company-profile-form.component.ts (just created, form structure)
    - .planning/director/COMPANY-INFO-CONVENTION.md (field labels, descriptions)
    - .planning/phases/28-company-profile-form/28-RESEARCH.md (ngx-library components, layout strategy)
    - src/app/pages/org/tabs/vendor-profile-form.component.html (form layout reference; adapt for company_info)
  </read_first>
  <action>
    Create `src/app/onboarding/company-profile-form.component.html` with:
    
    **Structure:**
    ```html
    <div class="company-profile-form">
      <!-- Loading state -->
      <mat-spinner *ngIf="isLoading"></mat-spinner>
      
      <!-- Error state -->
      <div *ngIf="loadError" class="error-banner">
        <p>{{ loadError }}</p>
        <button mat-raised-button (click)="onRetryLoad()">Retry</button>
      </div>
      
      <!-- Form sections (grouped by logical category) -->
      <form [formGroup]="form" *ngIf="!isLoading && !loadError">
        
        <!-- Section: Company Basics -->
        <fieldset>
          <legend>Company Basics</legend>
          
          <!-- legal_name (required) -->
          <mat-form-field>
            <mat-label>Legal Business Name *</mat-label>
            <input matInput formControlName="legalName">
            <mat-hint *ngIf="isPreFilled('legalName')">(pre-filled from platform)</mat-hint>
            <mat-error *ngIf="form.get('legalName')?.hasError('required')">Required</mat-error>
          </mat-form-field>
          
          <!-- dba (optional) -->
          <mat-form-field>
            <mat-label>DBA / Doing Business As</mat-label>
            <input matInput formControlName="dba" placeholder="please provide">
            <mat-hint *ngIf="!isPreFilled('dba')">(please provide)</mat-hint>
          </mat-form-field>
          
          <!-- logo_url (optional, URL) -->
          <mat-form-field>
            <mat-label>Logo URL</mat-label>
            <input matInput formControlName="logoUrl" type="url" placeholder="https://...">
            <mat-hint *ngIf="isPreFilled('logoUrl')">(pre-filled from platform)</mat-hint>
            <mat-hint *ngIf="!isPreFilled('logoUrl')">(please provide)</mat-hint>
            <mat-error *ngIf="form.get('logoUrl')?.hasError('pattern')">Must be valid HTTPS URL</mat-error>
          </mat-form-field>
          
          <!-- short_blurb (optional, ≤ 500) -->
          <mat-form-field>
            <mat-label>Short Blurb (Company Tagline)</mat-label>
            <textarea matInput formControlName="shortBlurb" rows="2" placeholder="please provide"></textarea>
            <mat-hint>Max 500 characters</mat-hint>
            <mat-error *ngIf="form.get('shortBlurb')?.hasError('maxLength')">Max 500 chars</mat-error>
          </mat-form-field>
          
          <!-- long_description (optional, ≤ 5000) -->
          <mat-form-field>
            <mat-label>Company Description</mat-label>
            <textarea matInput formControlName="longDescription" rows="4" placeholder="please provide"></textarea>
            <mat-hint>Max 5000 characters (markdown allowed)</mat-hint>
            <mat-error *ngIf="form.get('longDescription')?.hasError('maxLength')">Max 5000 chars</mat-error>
          </mat-form-field>
        </fieldset>
        
        <!-- Section: Primary Contact -->
        <fieldset formGroupName="primaryContact">
          <legend>Primary Contact</legend>
          
          <!-- primary_contact.user_id (member picker) -->
          <mat-form-field>
            <mat-label>Contact Person</mat-label>
            <input matInput formControlName="userId" placeholder="Select from org members..." 
                   (focus)="onPrimaryContactFocus()" [matAutocomplete]="memberAutocomplete">
            <mat-autocomplete #memberAutocomplete="matAutocomplete" [displayWith]="displayMember">
              <mat-option *ngFor="let member of filteredMembers$ | async" [value]="member.id" 
                         (onSelectionChange)="onMemberSelected(member)">
                {{ member.name }}
              </mat-option>
            </mat-autocomplete>
            <mat-hint *ngIf="!isPreFilled('primaryContact.userId')">(please provide)</mat-hint>
          </mat-form-field>
          
          <!-- primary_contact.name (read-only or derived) -->
          <mat-form-field>
            <mat-label>Name</mat-label>
            <input matInput formControlName="name" readonly>
            <mat-hint *ngIf="isPreFilled('primaryContact.name')">(auto-filled from selected member)</mat-hint>
          </mat-form-field>
          
          <!-- primary_contact.email (read-only or derived) -->
          <mat-form-field>
            <mat-label>Email</mat-label>
            <input matInput formControlName="email" type="email" readonly>
            <mat-hint *ngIf="isPreFilled('primaryContact.email')">(auto-filled from selected member)</mat-hint>
            <mat-error *ngIf="form.get('primaryContact')?.get('email')?.hasError('email')">Valid email required</mat-error>
          </mat-form-field>
        </fieldset>
        
        <!-- Section: Website -->
        <fieldset>
          <legend>Web Presence</legend>
          
          <!-- website (optional, URL) -->
          <mat-form-field>
            <mat-label>Website</mat-label>
            <input matInput formControlName="website" type="url" placeholder="https://...">
            <mat-hint *ngIf="!isPreFilled('website')">(please provide)</mat-hint>
            <mat-error *ngIf="form.get('website')?.hasError('pattern')">Must be valid HTTPS URL</mat-error>
          </mat-form-field>
        </fieldset>
        
        <!-- Section: Headquarters Location -->
        <fieldset formGroupName="hqLocation">
          <legend>Headquarters Location</legend>
          
          <!-- hq_location.street -->
          <mat-form-field>
            <mat-label>Street Address</mat-label>
            <input matInput formControlName="street" placeholder="please provide">
          </mat-form-field>
          
          <!-- hq_location.city -->
          <mat-form-field>
            <mat-label>City</mat-label>
            <input matInput formControlName="city" placeholder="please provide">
          </mat-form-field>
          
          <!-- hq_location.state -->
          <mat-form-field>
            <mat-label>State/Region</mat-label>
            <input matInput formControlName="state" placeholder="please provide">
          </mat-form-field>
          
          <!-- hq_location.country -->
          <mat-form-field>
            <mat-label>Country</mat-label>
            <input matInput formControlName="country" placeholder="please provide">
          </mat-form-field>
          
          <!-- hq_location.postal_code -->
          <mat-form-field>
            <mat-label>Postal/ZIP Code</mat-label>
            <input matInput formControlName="postalCode" placeholder="please provide">
          </mat-form-field>
        </fieldset>
        
        <!-- Section: Company Profile -->
        <fieldset>
          <legend>Company Profile</legend>
          
          <!-- years_in_business -->
          <mat-form-field>
            <mat-label>Years in Business</mat-label>
            <input matInput formControlName="yearsInBusiness" type="number" min="0" placeholder="please provide">
            <mat-error *ngIf="form.get('yearsInBusiness')?.hasError('min')">Must be ≥ 0</mat-error>
          </mat-form-field>
          
          <!-- employee_count (select from allowlist) -->
          <mat-form-field>
            <mat-label>Employee Count</mat-label>
            <mat-select formControlName="employeeCount">
              <mat-option value="">-- please provide --</mat-option>
              <mat-option value="1-10">1-10</mat-option>
              <mat-option value="11-50">11-50</mat-option>
              <mat-option value="51-200">51-200</mat-option>
              <mat-option value="201-500">201-500</mat-option>
              <mat-option value="500+">500+</mat-option>
            </mat-select>
          </mat-form-field>
        </fieldset>
        
        <!-- Form actions -->
        <div class="form-actions">
          <button mat-raised-button color="primary" (click)="onSave()" [disabled]="form.invalid || isSaving">
            <span *ngIf="!isSaving">Save Profile</span>
            <span *ngIf="isSaving"><mat-spinner diameter="20"></mat-spinner> Saving...</span>
          </button>
          <button mat-stroked-button (click)="onSkip()">Skip for Now</button>
        </div>
      </form>
    </div>
    ```
    
    **Template logic:**
    - `isLoading`: show spinner during pre-fill load
    - `loadError`: show error banner if pre-fill fails
    - `isSaving`: disable save button while saving
    - `isPreFilled(fieldName)`: helper method to show "(pre-filled from platform)" annotation
    - `onRetryLoad()`: retry loading pre-fill
    - `onSave()`: call service.save(), show success/error snackbar, navigate to /projects
    - `onSkip()`: navigate to /projects without saving
    - `onPrimaryContactFocus()`: fetch org members for autocomplete
    - `onMemberSelected(member)`: auto-fill name + email when user selects a member
    
    **Styling strategy:**
    - Use ngx-library form defaults (Material wrapping)
    - Fieldsets for visual grouping
    - Minimal custom CSS (spacing, section dividers)
  </action>
  <verify>
    <automated>grep -c "<mat-form-field>" src/app/onboarding/company-profile-form.component.html | grep -E "^(1[6-9]|[2-9][0-9])$"</automated>
  </verify>
  <done>Template file created with 16+ form-field sections, pre-fill annotations, error messages, save/skip buttons.</done>
</task>

<task type="auto">
  <name>Task 3: Create component styles (SCSS)</name>
  <files>src/app/onboarding/company-profile-form.component.scss</files>
  <read_first>
    - src/app/onboarding/company-profile-form.component.html (just created)
    - .planning/phases/28-company-profile-form/28-RESEARCH.md (minimal custom CSS recommendation)
  </read_first>
  <action>
    Create `src/app/onboarding/company-profile-form.component.scss` with:
    
    ```scss
    .company-profile-form {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }
    
    fieldset {
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid #e0e0e0;
      
      legend {
        font-size: 1.1rem;
        font-weight: 600;
        margin-bottom: 1rem;
      }
    }
    
    mat-form-field {
      display: block;
      margin-bottom: 1.5rem;
      width: 100%;
    }
    
    .form-actions {
      display: flex;
      gap: 1rem;
      margin-top: 2rem;
      
      button {
        min-width: 150px;
      }
    }
    
    .error-banner {
      background-color: #ffebee;
      border-left: 4px solid #f44336;
      padding: 1rem;
      margin-bottom: 1rem;
      
      p {
        margin: 0 0 0.5rem 0;
        color: #c62828;
      }
    }
    
    mat-spinner {
      margin: 2rem auto;
    }
    ```
    
    Keep it minimal — rely on Material defaults via ngx-library's `provideZbDefaults()` and `ZB_FORM_FIELD_DEFAULTS`.
  </action>
  <verify>
    <automated>test -f src/app/onboarding/company-profile-form.component.scss && wc -l < src/app/onboarding/company-profile-form.component.scss | grep -E "^[5-9][0-9]$"</automated>
  </verify>
  <done>SCSS file created with fieldset grouping, form-field spacing, error-banner styling, minimal custom CSS.</done>
</task>

<task type="auto">
  <name>Task 4: Write unit tests for CompanyProfileFormComponent (CP-01, CP-03, CP-06)</name>
  <files>src/app/onboarding/company-profile-form.component.spec.ts</files>
  <read_first>
    - src/app/onboarding/company-profile-form.component.ts (just created)
    - .planning/phases/28-company-profile-form/28-VALIDATION.md (test map)
    - .planning/phases/28-company-profile-form/28-RESEARCH.md (mock setup)
  </read_first>
  <action>
    Create `src/app/onboarding/company-profile-form.component.spec.ts` with three describe blocks:
    
    **1. describe('renders all 16 form sections (CP-01)')**
    
    One test case:
    - `it('renders legal_name, dba, logo_url, short_blurb, long_description, primary_contact.*, website, hq_location.*, years_in_business, employee_count')` 
      - Create component
      - Verify DOM has 16 form-field elements (or grep for "mat-form-field" count)
      - Verify each expected formControlName is bound (legal_name, dba, logoUrl, shortBlurb, etc.)
    
    **2. describe('pre-fill annotations (CP-03)')**
    
    Two test cases:
    - `it('renders (pre-filled from platform) annotation for fields with existing MPI records')`
      - Mock service.readProfileForOrg() → return struct with legal_name, logo_url pre-filled
      - Mount component
      - Assert DOM contains "(pre-filled from platform)" text next to those fields
      - Assert edit is allowed (fields not readonly)
    
    - `it('renders (please provide) hint for empty fields')`
      - Mock service.readProfileForOrg() → return struct with empty short_blurb, website, etc.
      - Mount component
      - Assert DOM contains "(please provide)" placeholder or hint next to those fields
    
    **3. describe('skip-for-now flow (CP-06)')**
    
    One test case:
    - `it('skip routes to /projects without calling service.save()')`
      - Mock router.navigate()
      - Mock service.save() to track calls
      - Click skip button
      - Assert router.navigate(['/projects']) called
      - Assert service.save() NOT called
  </action>
  <verify>
    <automated>npm test -- --include='src/app/onboarding/company-profile-form.component.spec.ts' --watch=false --browsers=ChromeHeadless</automated>
  </verify>
  <done>Test file created, covers CP-01 (16 sections rendered), CP-03 (pre-fill annotations), CP-06 (skip flow), all passing.</done>
</task>

</tasks>

<verification>
- [ ] `npm test -- --include='src/app/onboarding/company-profile-form.component.spec.ts' --watch=false --browsers=ChromeHeadless` passes
- [ ] `tsc --noEmit -p tsconfig.json` shows no type errors
- [ ] Template renders 16 form-field elements (one per user-facing section)
- [ ] Pre-fill snapshot captured after form init
- [ ] Save handler calls service.save(orgId, current, original) with correct arguments
- [ ] Skip handler routes to /projects without calling service.save()
- [ ] Validators applied correctly (required legal_name, URL patterns, email, etc.)
- [ ] (please provide) hints rendered for empty fields
- [ ] (pre-filled from platform) annotations rendered for pre-filled fields
</verification>

<success_criteria>
- Component file: Standalone, Angular 21 patterns (inject, reactive forms, no constructor injection)
- Template file: 16+ form sections, pre-fill/please-provide annotations, save/skip buttons, error messages
- Styles file: Minimal custom CSS, fieldset grouping, Material defaults via ngx-library
- Test file: CP-01 (16 sections), CP-03 (annotations), CP-06 (skip flow) all covered and passing
- Ready for Plan 04 (wiring into app.routes.ts) and Plan 05 (routing integration test)
</success_criteria>

<output>
After completion, create `.planning/phases/28-company-profile-form/28-03-SUMMARY.md`
</output>
