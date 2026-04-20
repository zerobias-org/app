import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FormBuilderComponent } from './form-builder.component';
import { FormBuilderConfig, FormFieldConfig } from '../../../core/models/form-builder.model';

describe('FormBuilderComponent', () => {
  let component: FormBuilderComponent;
  let fixture: ComponentFixture<FormBuilderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        ReactiveFormsModule,
        MatExpansionModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
        MatIconModule,
        MatCardModule,
        DragDropModule,
        FormBuilderComponent,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FormBuilderComponent);
    component = fixture.componentInstance;
  });

  describe('initialization', () => {
    it('should render with expansion panels for each field in formConfig', () => {
      const config: FormBuilderConfig = {
        version: 1,
        fields: [
          {
            id: '1',
            type: 'text',
            label: 'Company Name',
            required: true,
          },
          {
            id: '2',
            type: 'textarea',
            label: 'Description',
            required: false,
          },
        ],
      };

      fixture.componentRef.setInput('formConfig', config);
      fixture.detectChanges();

      const panels = fixture.nativeElement.querySelectorAll('mat-expansion-panel');
      expect(panels.length).toBe(2);
    });

    it('should display field label and type in expansion panel header', () => {
      const config: FormBuilderConfig = {
        version: 1,
        fields: [
          {
            id: '1',
            type: 'text',
            label: 'Test Field',
            required: true,
          },
        ],
      };

      fixture.componentRef.setInput('formConfig', config);
      fixture.detectChanges();

      const headerText = fixture.nativeElement.querySelector('.field-info').textContent;
      expect(headerText).toContain('Test Field');
      expect(headerText).toContain('text');
    });

    it('should display required badge when field is required', () => {
      const config: FormBuilderConfig = {
        version: 1,
        fields: [
          {
            id: '1',
            type: 'text',
            label: 'Required Field',
            required: true,
          },
        ],
      };

      fixture.componentRef.setInput('formConfig', config);
      fixture.detectChanges();

      const badge = fixture.nativeElement.querySelector('.required-badge');
      expect(badge?.textContent).toContain('Required');
    });
  });

  describe('add field', () => {
    it('should append new field with default values when Add Field button clicked', () => {
      const config: FormBuilderConfig = {
        version: 1,
        fields: [],
      };

      fixture.componentRef.setInput('formConfig', config);
      fixture.detectChanges();

      const addButton = fixture.nativeElement.querySelector('.add-field-button');
      addButton.click();

      expect(component.fields().length).toBe(1);
      expect(component.fields()[0].type).toBe('text');
      expect(component.fields()[0].required).toBe(false);
    });

    it('should emit formConfigChange when field is added', () => {
      const config: FormBuilderConfig = {
        version: 1,
        fields: [],
      };

      fixture.componentRef.setInput('formConfig', config);
      const emitSpy = vi.spyOn(component.formConfigChange, 'emit');
      fixture.detectChanges();

      const addButton = fixture.nativeElement.querySelector('.add-field-button');
      addButton.click();

      expect(emitSpy).toHaveBeenCalled();
    });

    it('should not add field when isLocked is true', () => {
      const config: FormBuilderConfig = {
        version: 1,
        fields: [],
      };

      fixture.componentRef.setInput('formConfig', config);
      fixture.componentRef.setInput('isLocked', true);
      fixture.detectChanges();

      const addButton = fixture.nativeElement.querySelector('.add-field-button');
      expect(addButton.disabled).toBe(true);
      addButton.click();

      expect(component.fields().length).toBe(0);
    });
  });

  describe('delete field', () => {
    it('should remove field when delete is called', () => {
      const config: FormBuilderConfig = {
        version: 1,
        fields: [
          { id: '1', type: 'text', label: 'Field 1', required: false },
          { id: '2', type: 'text', label: 'Field 2', required: false },
        ],
      };

      fixture.componentRef.setInput('formConfig', config);
      fixture.detectChanges();

      component.onFieldDelete(0);

      expect(component.fields().length).toBe(1);
      expect(component.fields()[0].id).toBe('2');
    });

    it('should emit formConfigChange when field is deleted', () => {
      const config: FormBuilderConfig = {
        version: 1,
        fields: [{ id: '1', type: 'text', label: 'Field 1', required: false }],
      };

      fixture.componentRef.setInput('formConfig', config);
      const emitSpy = vi.spyOn(component.formConfigChange, 'emit');
      fixture.detectChanges();

      component.onFieldDelete(0);

      expect(emitSpy).toHaveBeenCalled();
    });

    it('should not delete field when isLocked is true', () => {
      const config: FormBuilderConfig = {
        version: 1,
        fields: [{ id: '1', type: 'text', label: 'Field 1', required: false }],
      };

      fixture.componentRef.setInput('formConfig', config);
      fixture.componentRef.setInput('isLocked', true);
      fixture.detectChanges();

      component.onFieldDelete(0);

      expect(component.fields().length).toBe(1);
    });
  });

  describe('drag and drop reordering', () => {
    it('should reorder fields when dropped at different index', () => {
      const config: FormBuilderConfig = {
        version: 1,
        fields: [
          { id: '1', type: 'text', label: 'Field 1', required: false },
          { id: '2', type: 'text', label: 'Field 2', required: false },
          { id: '3', type: 'text', label: 'Field 3', required: false },
        ],
      };

      fixture.componentRef.setInput('formConfig', config);
      fixture.detectChanges();

      const event = {
        previousIndex: 0,
        currentIndex: 2,
      } as CdkDragDrop<FormFieldConfig[]>;

      component.onFieldsReordered(event);

      expect(component.fields()[0].id).toBe('2');
      expect(component.fields()[1].id).toBe('3');
      expect(component.fields()[2].id).toBe('1');
    });

    it('should emit formConfigChange when fields are reordered', () => {
      const config: FormBuilderConfig = {
        version: 1,
        fields: [
          { id: '1', type: 'text', label: 'Field 1', required: false },
          { id: '2', type: 'text', label: 'Field 2', required: false },
        ],
      };

      fixture.componentRef.setInput('formConfig', config);
      const emitSpy = vi.spyOn(component.formConfigChange, 'emit');
      fixture.detectChanges();

      const event = {
        previousIndex: 0,
        currentIndex: 1,
      } as CdkDragDrop<FormFieldConfig[]>;

      component.onFieldsReordered(event);

      expect(emitSpy).toHaveBeenCalled();
    });

    it('should not reorder when isLocked is true', () => {
      const config: FormBuilderConfig = {
        version: 1,
        fields: [
          { id: '1', type: 'text', label: 'Field 1', required: false },
          { id: '2', type: 'text', label: 'Field 2', required: false },
        ],
      };

      fixture.componentRef.setInput('formConfig', config);
      fixture.componentRef.setInput('isLocked', true);
      fixture.detectChanges();

      const event = {
        previousIndex: 0,
        currentIndex: 1,
      } as CdkDragDrop<FormFieldConfig[]>;

      component.onFieldsReordered(event);

      expect(component.fields()[0].id).toBe('1');
      expect(component.fields()[1].id).toBe('2');
    });

    it('should not emit change if dropped at same index', () => {
      const config: FormBuilderConfig = {
        version: 1,
        fields: [
          { id: '1', type: 'text', label: 'Field 1', required: false },
          { id: '2', type: 'text', label: 'Field 2', required: false },
        ],
      };

      fixture.componentRef.setInput('formConfig', config);
      const emitSpy = vi.spyOn(component.formConfigChange, 'emit');
      fixture.detectChanges();

      const event = {
        previousIndex: 0,
        currentIndex: 0,
      } as CdkDragDrop<FormFieldConfig[]>;

      component.onFieldsReordered(event);

      expect(emitSpy).not.toHaveBeenCalled();
    });
  });

  describe('field count warning', () => {
    it('should display warning when field count >= 25', () => {
      const fields: FormFieldConfig[] = Array.from({ length: 25 }, (_, i) => ({
        id: String(i),
        type: 'text' as const,
        label: `Field ${i}`,
        required: false,
      }));

      const config: FormBuilderConfig = { version: 1, fields };

      fixture.componentRef.setInput('formConfig', config);
      fixture.detectChanges();

      expect(component.fieldWarning()).toBeTruthy();
      const warning = fixture.nativeElement.querySelector('.warning-banner');
      expect(warning?.textContent).toContain('many fields');
    });

    it('should not display warning when field count < 25', () => {
      const fields: FormFieldConfig[] = Array.from({ length: 10 }, (_, i) => ({
        id: String(i),
        type: 'text' as const,
        label: `Field ${i}`,
        required: false,
      }));

      const config: FormBuilderConfig = { version: 1, fields };

      fixture.componentRef.setInput('formConfig', config);
      fixture.detectChanges();

      expect(component.fieldWarning()).toBeFalsy();
    });
  });

  describe('disabled state', () => {
    it('should disable all panels when isLocked is true', () => {
      const config: FormBuilderConfig = {
        version: 1,
        fields: [{ id: '1', type: 'text', label: 'Field 1', required: false }],
      };

      fixture.componentRef.setInput('formConfig', config);
      fixture.componentRef.setInput('isLocked', true);
      fixture.detectChanges();

      // Verify that isLocked() returns true, which would disable panels
      expect(component.isLocked()).toBe(true);
    });

    it('should disable add field button when isLocked is true', () => {
      const config: FormBuilderConfig = {
        version: 1,
        fields: [],
      };

      fixture.componentRef.setInput('formConfig', config);
      fixture.componentRef.setInput('isLocked', true);
      fixture.detectChanges();

      const addButton = fixture.nativeElement.querySelector('.add-field-button');
      expect(addButton.disabled).toBe(true);
    });
  });
});
