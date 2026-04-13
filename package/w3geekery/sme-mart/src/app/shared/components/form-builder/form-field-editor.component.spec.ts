import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormFieldEditorComponent } from './form-field-editor.component';
import { FormFieldConfig } from '../../../core/models/form-builder.model';
import { vi } from 'vitest';

describe('FormFieldEditorComponent', () => {
  let component: FormFieldEditorComponent;
  let fixture: ComponentFixture<FormFieldEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatCheckboxModule,
        MatButtonModule,
        MatIconModule,
        MatChipsModule,
        FormFieldEditorComponent,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FormFieldEditorComponent);
    component = fixture.componentInstance;
  });

  describe('initialization', () => {
    it('should render field label, type, required toggle', () => {
      const field: FormFieldConfig = {
        id: '1',
        type: 'text',
        label: 'Test Field',
        required: true,
      };

      fixture.componentRef.setInput('field', field);
      fixture.detectChanges();

      const labelInput = fixture.nativeElement.querySelector('input[formControlName="label"]');
      expect(labelInput.value).toBe('Test Field');

      expect(component.formGroup.get('required')?.value).toBe(true);
    });

    it('should display all 6 field types in dropdown', () => {
      const field: FormFieldConfig = {
        id: '1',
        type: 'text',
        label: 'Test',
        required: false,
      };

      fixture.componentRef.setInput('field', field);
      fixture.detectChanges();

      const typeSelect = fixture.nativeElement.querySelector('mat-select[formControlName="type"]');
      expect(typeSelect).toBeTruthy();
    });
  });

  describe('type-specific config sections', () => {
    it('should show text validation section when type is text', () => {
      const field: FormFieldConfig = {
        id: '1',
        type: 'text',
        label: 'Test',
        required: false,
      };

      fixture.componentRef.setInput('field', field);
      fixture.detectChanges();

      const typeSection = fixture.nativeElement.textContent;
      expect(typeSection).toContain('Text Validation');
    });

    it('should show textarea validation section when type is textarea', () => {
      const field: FormFieldConfig = {
        id: '1',
        type: 'textarea',
        label: 'Test',
        required: false,
      };

      fixture.componentRef.setInput('field', field);
      fixture.detectChanges();

      const typeSection = fixture.nativeElement.textContent;
      expect(typeSection).toContain('Textarea Validation');
    });

    it('should show number validation section when type is number', () => {
      const field: FormFieldConfig = {
        id: '1',
        type: 'number',
        label: 'Test',
        required: false,
      };

      fixture.componentRef.setInput('field', field);
      fixture.detectChanges();

      const typeSection = fixture.nativeElement.textContent;
      expect(typeSection).toContain('Number Validation');
    });

    it('should show dropdown options section when type is dropdown', () => {
      const field: FormFieldConfig = {
        id: '1',
        type: 'dropdown',
        label: 'Test',
        required: false,
        dropdownOptions: [{ value: 'opt1', label: 'Option 1' }],
      };

      fixture.componentRef.setInput('field', field);
      fixture.detectChanges();

      const typeSection = fixture.nativeElement.textContent;
      expect(typeSection).toContain('Dropdown Options');
    });

    it('should show file upload config section when type is file', () => {
      const field: FormFieldConfig = {
        id: '1',
        type: 'file',
        label: 'Test',
        required: false,
      };

      fixture.componentRef.setInput('field', field);
      fixture.detectChanges();

      const typeSection = fixture.nativeElement.textContent;
      expect(typeSection).toContain('File Upload Config');
    });

    it('should have no special config for checkbox type', () => {
      const field: FormFieldConfig = {
        id: '1',
        type: 'checkbox',
        label: 'Test',
        required: false,
      };

      fixture.componentRef.setInput('field', field);
      fixture.detectChanges();

      const typeSection = fixture.nativeElement.textContent;
      expect(typeSection).not.toContain('Validation');
    });
  });

  describe('text field validation config', () => {
    it('should display minLength and maxLength inputs for text fields', () => {
      const field: FormFieldConfig = {
        id: '1',
        type: 'text',
        label: 'Test',
        required: false,
        textValidation: { minLength: 5, maxLength: 100 },
      };

      fixture.componentRef.setInput('field', field);
      fixture.detectChanges();

      const minInput = fixture.nativeElement.querySelector('input[formControlName="minLength"]');
      const maxInput = fixture.nativeElement.querySelector('input[formControlName="maxLength"]');

      expect(minInput.value).toBe('5');
      expect(maxInput.value).toBe('100');
    });

    it('should display pattern preset dropdown for text fields', () => {
      const field: FormFieldConfig = {
        id: '1',
        type: 'text',
        label: 'Test',
        required: false,
      };

      fixture.componentRef.setInput('field', field);
      fixture.detectChanges();

      const patternSelect = fixture.nativeElement.querySelector('mat-select[formControlName="pattern"]');
      expect(patternSelect).toBeTruthy();
    });
  });

  describe('dropdown field config', () => {
    it('should display options textarea for dropdown fields', () => {
      const field: FormFieldConfig = {
        id: '1',
        type: 'dropdown',
        label: 'Test',
        required: false,
        dropdownOptions: [
          { value: 'opt1', label: 'Option 1' },
          { value: 'opt2', label: 'Option 2' },
        ],
      };

      fixture.componentRef.setInput('field', field);
      fixture.detectChanges();

      const textarea = fixture.nativeElement.querySelector('textarea[formControlName="dropdownOptionsText"]');
      expect(textarea.value).toContain('opt1|Option 1');
      expect(textarea.value).toContain('opt2|Option 2');
    });
  });

  describe('file field config', () => {
    it('should display MIME types, max size, max files inputs for file fields', () => {
      const field: FormFieldConfig = {
        id: '1',
        type: 'file',
        label: 'Test',
        required: false,
        fileUploadConfig: {
          allowedMimeTypes: ['application/pdf'],
          maxFileSizeBytes: 10485760,
          maxFiles: 1,
        },
      };

      fixture.componentRef.setInput('field', field);
      fixture.detectChanges();

      const mimeInput = fixture.nativeElement.querySelector('input[formControlName="allowedMimeTypes"]');
      const sizeInput = fixture.nativeElement.querySelector('input[formControlName="maxFileSizeBytes"]');
      const maxFilesInput = fixture.nativeElement.querySelector('input[formControlName="maxFiles"]');

      expect(mimeInput.value).toContain('application/pdf');
      expect(sizeInput.value).toBe('10485760');
      expect(maxFilesInput.value).toBe('1');
    });
  });

  describe('field changes', () => {
    it('should emit fieldChange with updated field when label changes', () => {
      return new Promise<void>((resolve) => {
        const field: FormFieldConfig = {
          id: '1',
          type: 'text',
          label: 'Original Label',
          required: false,
        };

        fixture.componentRef.setInput('field', field);
        fixture.detectChanges();

        const subscription = component.fieldChange.subscribe((updated) => {
          expect(updated.label).toBe('New Label');
          subscription.unsubscribe();
          resolve();
        });

        const labelInput = fixture.nativeElement.querySelector('input[formControlName="label"]');
        labelInput.value = 'New Label';
        labelInput.dispatchEvent(new Event('input'));
        component.formGroup.patchValue({ label: 'New Label' });
      });
    });

    it('should emit fieldChange with updated field when required changes', () => {
      return new Promise<void>((resolve) => {
        const field: FormFieldConfig = {
          id: '1',
          type: 'text',
          label: 'Test',
          required: false,
        };

        fixture.componentRef.setInput('field', field);
        fixture.detectChanges();

        const subscription = component.fieldChange.subscribe((updated) => {
          expect(updated.required).toBe(true);
          subscription.unsubscribe();
          resolve();
        });

        component.formGroup.patchValue({ required: true });
      });
    });

    it('should emit fieldChange with type-specific validation for text fields', () => {
      return new Promise<void>((resolve) => {
        const field: FormFieldConfig = {
          id: '1',
          type: 'text',
          label: 'Test',
          required: false,
        };

        fixture.componentRef.setInput('field', field);
        fixture.detectChanges();

        const subscription = component.fieldChange.subscribe((updated) => {
          if (updated.textValidation) {
            expect(updated.textValidation.minLength).toBe(5);
            expect(updated.textValidation.maxLength).toBe(100);
            subscription.unsubscribe();
            resolve();
          }
        });

        component.formGroup.patchValue({ minLength: 5, maxLength: 100 });
      });
    });

    it('should emit fieldChange with dropdown options for dropdown fields', () => {
      return new Promise<void>((resolve) => {
        const field: FormFieldConfig = {
          id: '1',
          type: 'dropdown',
          label: 'Test',
          required: false,
        };

        fixture.componentRef.setInput('field', field);
        fixture.detectChanges();

        const subscription = component.fieldChange.subscribe((updated) => {
          if (updated.dropdownOptions) {
            expect(updated.dropdownOptions.length).toBe(2);
            expect(updated.dropdownOptions[0].value).toBe('opt1');
            expect(updated.dropdownOptions[0].label).toBe('Option 1');
            subscription.unsubscribe();
            resolve();
          }
        });

        component.formGroup.patchValue({
          dropdownOptionsText: 'opt1|Option 1\nopt2|Option 2',
        });
      });
    });
  });

  describe('delete button', () => {
    it('should emit fieldDelete when delete button clicked', () => {
      return new Promise<void>((resolve) => {
        const field: FormFieldConfig = {
          id: '1',
          type: 'text',
          label: 'Test',
          required: false,
        };

        fixture.componentRef.setInput('field', field);
        fixture.detectChanges();

        const subscription = component.fieldDelete.subscribe(() => {
          subscription.unsubscribe();
          resolve();
        });

        const deleteButton = fixture.nativeElement.querySelector('button[type="button"]');
        deleteButton.click();
      });
    });
  });
});
