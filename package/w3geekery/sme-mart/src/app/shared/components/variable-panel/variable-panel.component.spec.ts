import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { vi } from 'vitest';
import { VariablePanelComponent } from './variable-panel.component';
import { CustomVariable } from '@/core/models';

describe('VariablePanelComponent', () => {
  let component: VariablePanelComponent;
  let fixture: ComponentFixture<VariablePanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        VariablePanelComponent,
        ReactiveFormsModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(VariablePanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty values', () => {
    expect(component.form.get('name')?.value).toBe('');
    expect(component.form.get('label')?.value).toBe('');
    expect(component.form.get('description')?.value).toBe('');
  });

  it('should toggle add form visibility', () => {
    expect(component.showAddForm()).toBe(false);
    component.toggleAddForm();
    expect(component.showAddForm()).toBe(true);
    component.toggleAddForm();
    expect(component.showAddForm()).toBe(false);
  });

  it('should reset form when toggling off', () => {
    component.form.patchValue({
      name: 'testVar',
      label: 'Test Variable',
      description: 'Test',
    });
    component.showAddForm.set(true);
    component.toggleAddForm();

    expect(component.form.get('name')?.value).toBeNull();
    expect(component.form.get('label')?.value).toBeNull();
    expect(component.form.get('description')?.value).toBeNull();
  });

  it('should emit addVariable on submit for new variable', () => {
    const addSpy = vi.fn();
    component.addVariable.subscribe(addSpy);

    component.form.patchValue({
      name: 'projectName',
      label: 'Project Name',
      description: 'Name of the project',
    });

    component.submitVariable();

    expect(addSpy).toHaveBeenCalledWith({
      name: 'projectName',
      label: 'Project Name',
      description: 'Name of the project',
    });
  });

  it('should emit updateVariable on submit for edited variable', () => {
    const updateSpy = vi.fn();
    component.updateVariable.subscribe(updateSpy);

    component.editingIndex.set(1);
    component.form.patchValue({
      name: 'updatedVar',
      label: 'Updated Variable',
      description: 'Updated description',
    });

    component.submitVariable();

    expect(updateSpy).toHaveBeenCalledWith({
      index: 1,
      variable: {
        name: 'updatedVar',
        label: 'Updated Variable',
        description: 'Updated description',
      },
    });
  });

  it('should not submit if form is invalid', () => {
    const addSpy = vi.fn();
    component.addVariable.subscribe(addSpy);

    component.form.patchValue({
      name: '', // Required
      label: '',
    });

    component.submitVariable();

    expect(addSpy).not.toHaveBeenCalled();
  });

  it('should validate variable name pattern', () => {
    const nameControl = component.form.get('name');

    nameControl?.setValue('validName');
    expect(nameControl?.valid).toBe(true);

    nameControl?.setValue('_privateVar');
    expect(nameControl?.valid).toBe(true);

    nameControl?.setValue('var123');
    expect(nameControl?.valid).toBe(true);

    nameControl?.setValue('123invalid');
    expect(nameControl?.valid).toBe(false);

    nameControl?.setValue('invalid-name');
    expect(nameControl?.valid).toBe(false);

    nameControl?.setValue('invalid name');
    expect(nameControl?.valid).toBe(false);
  });

  it('should start edit variable', () => {
    const variable: CustomVariable = {
      name: 'testVar',
      label: 'Test Variable',
      description: 'A test variable',
    };

    component.startEditVariable(0, variable);

    expect(component.editingIndex()).toBe(0);
    expect(component.showAddForm()).toBe(true);
    expect(component.form.get('name')?.value).toBe('testVar');
    expect(component.form.get('label')?.value).toBe('Test Variable');
    expect(component.form.get('description')?.value).toBe('A test variable');
  });

  it('should cancel edit', () => {
    component.editingIndex.set(2);
    component.showAddForm.set(true);
    component.form.patchValue({
      name: 'testVar',
      label: 'Test',
    });

    component.cancelEdit();

    expect(component.editingIndex()).toBeNull();
    expect(component.showAddForm()).toBe(false);
    expect(component.form.get('name')?.value).toBeNull();
  });

  it('should emit deleteVariable', () => {
    const deleteSpy = vi.fn();
    component.removeVariable.subscribe(deleteSpy);

    component.deleteVariable(2);

    expect(deleteSpy).toHaveBeenCalledWith(2);
  });

  it('should reset form after submit', () => {
    component.form.patchValue({
      name: 'testVar',
      label: 'Test',
    });

    component.submitVariable();

    expect(component.form.get('name')?.value).toBeNull();
    expect(component.form.get('label')?.value).toBeNull();
  });

  it('should hide form after submit', () => {
    component.showAddForm.set(true);
    component.form.patchValue({
      name: 'testVar',
      label: 'Test Variable',
    });

    component.submitVariable();

    expect(component.showAddForm()).toBe(false);
  });

  it('should clear editing index after submit', () => {
    component.editingIndex.set(1);
    component.form.patchValue({
      name: 'updatedVar',
      label: 'Updated',
    });

    component.submitVariable();

    expect(component.editingIndex()).toBeNull();
  });
});
