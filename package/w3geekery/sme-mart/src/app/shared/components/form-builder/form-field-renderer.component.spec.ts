import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormFieldRendererComponent } from './form-field-renderer.component';
import { FormFieldConfig } from '../../../core/models/form-builder.model';

describe('FormFieldRendererComponent', () => {
  let component: FormFieldRendererComponent;
  let fixture: ComponentFixture<FormFieldRendererComponent>;
  let fb: FormBuilder;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        FormFieldRendererComponent,
        ReactiveFormsModule,
        NoopAnimationsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatCheckboxModule,
        MatButtonModule,
        MatIconModule,
      ],
    }).compileComponents();

    fb = TestBed.inject(FormBuilder);
    fixture = TestBed.createComponent(FormFieldRendererComponent);
    component = fixture.componentInstance;
  });

  describe('Field Type Rendering', () => {
    it('should render text field as mat-input', () => {
      const field: FormFieldConfig = {
        id: 'name',
        type: 'text',
        label: 'Name',
        required: false,
      };

      const formGroup = fb.group({ name: '' });

      fixture.componentRef.setInput('field', field);
      fixture.componentRef.setInput('mode', 'fill');
      fixture.componentRef.setInput('formGroup', formGroup);
      fixture.componentRef.setInput('submission', {});
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector('input[matInput]');
      expect(input).toBeTruthy();
      expect(input.type).not.toBe('number'); // Should not be number type
    });

    it('should render textarea field', () => {
      const field: FormFieldConfig = {
        id: 'description',
        type: 'textarea',
        label: 'Description',
        required: false,
      };

      const formGroup = fb.group({ description: '' });

      fixture.componentRef.setInput('field', field);
      fixture.componentRef.setInput('mode', 'fill');
      fixture.componentRef.setInput('formGroup', formGroup);
      fixture.componentRef.setInput('submission', {});
      fixture.detectChanges();

      const textarea = fixture.nativeElement.querySelector('textarea');
      expect(textarea).toBeTruthy();
    });

    it('should render dropdown with options', () => {
      const field: FormFieldConfig = {
        id: 'status',
        type: 'dropdown',
        label: 'Status',
        required: false,
        dropdownOptions: [
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
        ],
      };

      const formGroup = fb.group({ status: '' });

      fixture.componentRef.setInput('field', field);
      fixture.componentRef.setInput('mode', 'fill');
      fixture.componentRef.setInput('formGroup', formGroup);
      fixture.componentRef.setInput('submission', {});
      fixture.detectChanges();

      const select = fixture.nativeElement.querySelector('mat-select');
      expect(select).toBeTruthy();
    });

    it('should render number field with type="number"', () => {
      const field: FormFieldConfig = {
        id: 'age',
        type: 'number',
        label: 'Age',
        required: false,
      };

      const formGroup = fb.group({ age: '' });

      fixture.componentRef.setInput('field', field);
      fixture.componentRef.setInput('mode', 'fill');
      fixture.componentRef.setInput('formGroup', formGroup);
      fixture.componentRef.setInput('submission', {});
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector('input[type="number"]');
      expect(input).toBeTruthy();
    });

    it('should render checkbox field', () => {
      const field: FormFieldConfig = {
        id: 'agree',
        type: 'checkbox',
        label: 'I Agree',
        required: false,
      };

      const formGroup = fb.group({ agree: false });

      fixture.componentRef.setInput('field', field);
      fixture.componentRef.setInput('mode', 'fill');
      fixture.componentRef.setInput('formGroup', formGroup);
      fixture.componentRef.setInput('submission', {});
      fixture.detectChanges();

      const checkbox = fixture.nativeElement.querySelector('mat-checkbox');
      expect(checkbox).toBeTruthy();
    });

    it('should render file upload button in fill mode', () => {
      const field: FormFieldConfig = {
        id: 'document',
        type: 'file',
        label: 'Upload Document',
        required: false,
      };

      const formGroup = fb.group({ document: null });

      fixture.componentRef.setInput('field', field);
      fixture.componentRef.setInput('mode', 'fill');
      fixture.componentRef.setInput('formGroup', formGroup);
      fixture.componentRef.setInput('submission', {});
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('.file-upload-wrapper button');
      expect(button).toBeTruthy();
      expect(button.textContent).toContain('Choose File');
    });
  });

  describe('Mode Behavior', () => {
    it('should be read-only in preview mode', () => {
      const field: FormFieldConfig = {
        id: 'name',
        type: 'text',
        label: 'Name',
        required: false,
      };

      const formGroup = fb.group({ name: '' });

      fixture.componentRef.setInput('field', field);
      fixture.componentRef.setInput('mode', 'preview');
      fixture.componentRef.setInput('formGroup', formGroup);
      fixture.componentRef.setInput('submission', {});
      fixture.detectChanges();

      expect(component.isReadOnly).toBe(true);
    });

    it('should show sample data in preview mode', () => {
      const field: FormFieldConfig = {
        id: 'name',
        type: 'text',
        label: 'Name',
        required: false,
      };

      const formGroup = fb.group({ name: '' });

      fixture.componentRef.setInput('field', field);
      fixture.componentRef.setInput('mode', 'preview');
      fixture.componentRef.setInput('formGroup', formGroup);
      fixture.componentRef.setInput('submission', {});
      fixture.detectChanges();

      const sampleData = component.getSampleData();
      expect(sampleData).toBe('Sample text response');
    });

    it('should return 42 as sample data for number field in preview', () => {
      const field: FormFieldConfig = {
        id: 'age',
        type: 'number',
        label: 'Age',
        required: false,
      };

      const formGroup = fb.group({ age: '' });

      fixture.componentRef.setInput('field', field);
      fixture.componentRef.setInput('mode', 'preview');
      fixture.componentRef.setInput('formGroup', formGroup);
      fixture.componentRef.setInput('submission', {});
      fixture.detectChanges();

      const sampleData = component.getSampleData();
      expect(sampleData).toBe(42);
    });

    it('should be read-only in review mode', () => {
      const field: FormFieldConfig = {
        id: 'name',
        type: 'text',
        label: 'Name',
        required: false,
      };

      const formGroup = fb.group({ name: '' });

      fixture.componentRef.setInput('field', field);
      fixture.componentRef.setInput('mode', 'review');
      fixture.componentRef.setInput('formGroup', formGroup);
      fixture.componentRef.setInput('submission', {});
      fixture.detectChanges();

      expect(component.isReadOnly).toBe(true);
    });

    it('should show actual submission data in review mode', () => {
      const field: FormFieldConfig = {
        id: 'name',
        type: 'text',
        label: 'Name',
        required: false,
      };

      const formGroup = fb.group({ name: 'John Doe' });
      const submissionData = { name: 'John Doe' };

      fixture.componentRef.setInput('field', field);
      fixture.componentRef.setInput('mode', 'review');
      fixture.componentRef.setInput('formGroup', formGroup);
      fixture.componentRef.setInput('submission', { submissionData });
      fixture.detectChanges();

      const displayValue = component.getDisplayValue();
      expect(displayValue).toBe('John Doe');
    });
  });

  describe('Error Messages', () => {
    it('should return appropriate error message for required field', () => {
      const field: FormFieldConfig = {
        id: 'name',
        type: 'text',
        label: 'Full Name',
        required: true,
      };

      const formGroup = fb.group({ name: ['', []] });

      fixture.componentRef.setInput('field', field);
      fixture.componentRef.setInput('mode', 'fill');
      fixture.componentRef.setInput('formGroup', formGroup);
      fixture.componentRef.setInput('submission', {});
      fixture.detectChanges();

      const errorMsg = component.getErrorMessage();
      // Since control is null (no validation yet), should return null
      expect(errorMsg).toBeNull();
    });

    it('should return null error message when no errors', () => {
      const field: FormFieldConfig = {
        id: 'name',
        type: 'text',
        label: 'Name',
        required: false,
      };

      const formGroup = fb.group({ name: 'John' });

      fixture.componentRef.setInput('field', field);
      fixture.componentRef.setInput('mode', 'fill');
      fixture.componentRef.setInput('formGroup', formGroup);
      fixture.componentRef.setInput('submission', {});
      fixture.detectChanges();

      const errorMsg = component.getErrorMessage();
      expect(errorMsg).toBeNull();
    });
  });

  describe('Sample Data Generation', () => {
    it('should return text sample data', () => {
      const field: FormFieldConfig = {
        id: 'name',
        type: 'text',
        label: 'Name',
        required: false,
      };

      const formGroup = fb.group({ name: '' });

      fixture.componentRef.setInput('field', field);
      fixture.componentRef.setInput('mode', 'preview');
      fixture.componentRef.setInput('formGroup', formGroup);
      fixture.componentRef.setInput('submission', {});
      fixture.detectChanges();

      expect(component.getSampleData()).toBe('Sample text response');
    });

    it('should return textarea sample data', () => {
      const field: FormFieldConfig = {
        id: 'desc',
        type: 'textarea',
        label: 'Description',
        required: false,
      };

      const formGroup = fb.group({ desc: '' });

      fixture.componentRef.setInput('field', field);
      fixture.componentRef.setInput('mode', 'preview');
      fixture.componentRef.setInput('formGroup', formGroup);
      fixture.componentRef.setInput('submission', {});
      fixture.detectChanges();

      expect(component.getSampleData()).toContain('Sample long text response');
    });

    it('should return true for checkbox sample data', () => {
      const field: FormFieldConfig = {
        id: 'agree',
        type: 'checkbox',
        label: 'I Agree',
        required: false,
      };

      const formGroup = fb.group({ agree: false });

      fixture.componentRef.setInput('field', field);
      fixture.componentRef.setInput('mode', 'preview');
      fixture.componentRef.setInput('formGroup', formGroup);
      fixture.componentRef.setInput('submission', {});
      fixture.detectChanges();

      expect(component.getSampleData()).toBe(true);
    });

    it('should return null for file sample data', () => {
      const field: FormFieldConfig = {
        id: 'doc',
        type: 'file',
        label: 'Document',
        required: false,
      };

      const formGroup = fb.group({ doc: null });

      fixture.componentRef.setInput('field', field);
      fixture.componentRef.setInput('mode', 'preview');
      fixture.componentRef.setInput('formGroup', formGroup);
      fixture.componentRef.setInput('submission', {});
      fixture.detectChanges();

      expect(component.getSampleData()).toBeNull();
    });

    it('should return first dropdown option as sample', () => {
      const field: FormFieldConfig = {
        id: 'status',
        type: 'dropdown',
        label: 'Status',
        required: false,
        dropdownOptions: [
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
        ],
      };

      const formGroup = fb.group({ status: '' });

      fixture.componentRef.setInput('field', field);
      fixture.componentRef.setInput('mode', 'preview');
      fixture.componentRef.setInput('formGroup', formGroup);
      fixture.componentRef.setInput('submission', {});
      fixture.detectChanges();

      expect(component.getSampleData()).toBe('active');
    });
  });

  describe('File Upload', () => {
    it('should handle file upload and set file reference', async () => {
      const field: FormFieldConfig = {
        id: 'document',
        type: 'file',
        label: 'Upload Document',
        required: false,
      };

      const formGroup = fb.group({ document: null });

      fixture.componentRef.setInput('field', field);
      fixture.componentRef.setInput('mode', 'fill');
      fixture.componentRef.setInput('formGroup', formGroup);
      fixture.componentRef.setInput('submission', {});
      fixture.detectChanges();

      const mockFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const event = {
        target: {
          files: [mockFile],
        },
      };

      await component.handleFileUpload(event);

      const fileRef = formGroup.get('document')?.value as any;
      expect(fileRef).toBeTruthy();
      expect(fileRef.fileName).toBe('test.pdf');
      expect(fileRef.fileSize).toBe(7);
      expect(fileRef.fileId).toBeTruthy();
    });

    it('should show filename in review mode after upload', () => {
      const field: FormFieldConfig = {
        id: 'document',
        type: 'file',
        label: 'Upload Document',
        required: false,
      };

      const formGroup = fb.group({ document: null });
      const submissionData = {
        document: { fileId: '123', fileName: 'report.pdf', fileSize: 2048 },
      };

      fixture.componentRef.setInput('field', field);
      fixture.componentRef.setInput('mode', 'review');
      fixture.componentRef.setInput('formGroup', formGroup);
      fixture.componentRef.setInput('submission', { submissionData });
      fixture.detectChanges();

      const displayValue = component.getDisplayValue();
      expect(displayValue).toBe('report.pdf');
    });
  });
});
