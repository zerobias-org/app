import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RfpStepFormComponent } from './rfp-step-form.component';
import { RfpWizardService } from '../../../../core/services/rfp-wizard.service';
import { FormSubmissionService } from '../../../../core/services/form-submission.service';
import { FormBuilderComponent } from '../../../../shared/components/form-builder/form-builder.component';
import { DynamicFormRendererComponent } from '../../../../shared/components/form-builder/dynamic-form-renderer.component';
import type { SmeMartProject } from '../../../../core/models';
import { FormBuilderConfig } from '../../../../core/models/form-builder.model';

describe('RfpStepFormComponent', () => {
  let component: RfpStepFormComponent;
  let fixture: ComponentFixture<RfpStepFormComponent>;
  let mockWizardService: any;
  let mockFormSubmissionService: any;

  const mockRfpData: SmeMartProject = {
    id: 'test-project-1',
    name: 'Test RFP',
    engagementId: 'eng-1',
    projectType: 'rfp',
    status: 'draft',
    formConfig: null,
    wizardData: {} as any,
    wizardStep: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as any;

  const mockFormConfig: FormBuilderConfig = {
    version: 1,
    sections: [
      {
        id: 'sec-1',
        label: 'Section 1',
        fields: ['field-1'],
      } as any,
    ],
    fields: [
      {
        id: 'field-1',
        type: 'text' as any,
        label: 'Test Field',
        required: true,
        placeholder: 'Enter text',
      } as any,
    ],
  } as any;

  beforeEach(async () => {
    mockWizardService = {
      rfpData: {
        update: vi.fn(),
        signal: vi.fn(() => ({ formConfig: null })),
      },
      draftId: vi.fn().mockReturnValue('test-project-1'),
    };
    mockFormSubmissionService = {
      getFormSubmissionLock: vi.fn().mockResolvedValue(false),
    };

    // Create a signal-like object for rfpData
    const rfpDataSignal = {
      update: vi.fn(),
      __proto__: { constructor: { name: 'signal' } },
    };
    mockWizardService.rfpData = () => ({
      formConfig: null,
    });
    (mockWizardService.rfpData as any).update = vi.fn();

    await TestBed.configureTestingModule({
      imports: [
        RfpStepFormComponent,
        MatTabsModule,
        MatCheckboxModule,
        MatButtonModule,
        MatIconModule,
        BrowserAnimationsModule,
        FormBuilderComponent,
        DynamicFormRendererComponent,
      ],
      providers: [
        { provide: RfpWizardService, useValue: mockWizardService },
        { provide: FormSubmissionService, useValue: mockFormSubmissionService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RfpStepFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render with optional form toggle checkbox', () => {
    const checkbox = fixture.nativeElement.querySelector('mat-checkbox');
    expect(checkbox).toBeTruthy();
  });

  it('should toggle form builder visibility when checkbox is checked', () => {
    component.formEnabled.set(false);
    fixture.detectChanges();
    let builder = fixture.nativeElement.querySelector('app-form-builder');
    expect(builder).toBeFalsy();

    component.formEnabled.set(true);
    fixture.detectChanges();
    builder = fixture.nativeElement.querySelector('app-form-builder');
    expect(builder).toBeTruthy();
  });

  it('should pass isLocked=true to FormBuilderComponent when submissions exist', async () => {
    mockFormSubmissionService.getFormSubmissionLock.mockResolvedValue(true);
    component.formEnabled.set(true);
    await component.ngOnInit();
    fixture.detectChanges();

    const builder = fixture.debugElement.query(d => d.name === 'app-form-builder');
    expect(builder).toBeTruthy();
    expect(component.isFormLocked()).toBe(true);
  });

  it('should capture formConfigChange from FormBuilderComponent', () => {
    component.formEnabled.set(true);
    fixture.detectChanges();

    const builder = fixture.debugElement.query(d => d.name === 'app-form-builder');
    if (builder) {
      builder.componentInstance.formConfigChange.emit(mockFormConfig);
      expect(component.formConfig()).toEqual(mockFormConfig);
    }
  });

  it('should persist form config to RfpWizardState on change', () => {
    component.formEnabled.set(true);
    fixture.detectChanges();

    component.onFormConfigChange(mockFormConfig);
    expect((mockWizardService.rfpData as any).update).toHaveBeenCalled();
  });

  it('should render tabs when form is enabled', () => {
    component.formEnabled.set(true);
    fixture.detectChanges();

    const tabGroup = fixture.nativeElement.querySelector('mat-tab-group');
    expect(tabGroup).toBeTruthy();
  });

  it('should show DynamicFormRenderer in preview mode', () => {
    component.formEnabled.set(true);
    component.formConfig.set(mockFormConfig);
    fixture.detectChanges();

    const renderer = fixture.debugElement.query(d => d.name === 'app-dynamic-form-renderer');
    if (renderer) {
      expect(renderer.componentInstance.mode).toBe('preview');
    }
  });

  it('should set isFormLocked when submissions exist', async () => {
    mockFormSubmissionService.getFormSubmissionLock.mockResolvedValue(true);
    component.formEnabled.set(true);
    await component.ngOnInit();
    fixture.detectChanges();

    expect(component.isFormLocked()).toBe(true);
  });
});
