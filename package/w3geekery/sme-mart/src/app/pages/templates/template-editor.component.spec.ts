import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSidenavModule } from '@angular/material/sidenav';
import { vi } from 'vitest';
import { of } from 'rxjs';
import { TemplateEditorComponent } from './template-editor.component';
import { DocumentTemplateService, VariableSubstitutionService } from '@/core/services';
import { DocumentTemplate, CustomVariable } from '@/core/models';
import { MarkdownEditor } from '@/shared/components/markdown-editor/markdown-editor.component';
import { VariablePanelComponent } from '@/shared/components/variable-panel/variable-panel.component';

describe('TemplateEditorComponent', () => {
  let component: TemplateEditorComponent;
  let fixture: ComponentFixture<TemplateEditorComponent>;
  let mockRouter: Partial<Router>;
  let mockActivatedRoute: Partial<ActivatedRoute>;
  let mockDocumentTemplateService: Partial<DocumentTemplateService>;
  let mockVariableSubstitution: Partial<VariableSubstitutionService>;

  beforeEach(async () => {
    mockRouter = {
      navigate: vi.fn().mockResolvedValue(true),
    };

    mockActivatedRoute = {
      paramMap: of({
        get: (key: string) => (key === 'id' ? 'new' : null),
      } as any),
    } as any;

    mockDocumentTemplateService = {
      getById: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: 'new-template-id' }),
      update: vi.fn().mockResolvedValue(undefined),
      publish: vi.fn().mockResolvedValue(undefined),
      archive: vi.fn().mockResolvedValue(undefined),
    };

    mockVariableSubstitution = {
      parseCustomVariables: vi.fn().mockReturnValue([]),
    };

    await TestBed.configureTestingModule({
      imports: [
        TemplateEditorComponent,
        ReactiveFormsModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatIconModule,
        MatToolbarModule,
        MatProgressSpinnerModule,
        MatSlideToggleModule,
        MatSidenavModule,
        MatCardModule,
        MarkdownEditor,
        VariablePanelComponent,
      ],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: DocumentTemplateService, useValue: mockDocumentTemplateService },
        { provide: VariableSubstitutionService, useValue: mockVariableSubstitution },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TemplateEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty values in create mode', () => {
    component.isCreateMode.set(true);
    expect(component.form.get('name')?.value).toBe('');
    expect(component.form.get('description')?.value).toBe('');
    expect(component.form.get('documentType')?.value).toBe('other');
    expect(component.form.get('content')?.value).toBe('');
  });

  it('should mark form as create mode when id is "new"', async () => {
    component.ngOnInit();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.isCreateMode()).toBe(true);
  });

  it('should load template in edit mode', async () => {
    const mockTemplate: DocumentTemplate = {
      id: 'template-123',
      name: 'Test Template',
      description: 'A test template',
      documentType: 'msa',
      content: '# Test Content',
      variableSchema: null,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
      orgId: 'org-123',
      version: 1,
      createdBy: 'user-123',
    };

    // Set up mock to return template-123 ID
    const mockParamMap = {
      get: (key: string) => (key === 'id' ? 'template-123' : null),
    };
    (mockActivatedRoute as any).paramMap = of(mockParamMap);

    (mockDocumentTemplateService.getById as any).mockResolvedValue(mockTemplate);

    component.ngOnInit();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(mockDocumentTemplateService.getById).toHaveBeenCalledWith('template-123');
    expect(component.form.get('name')?.value).toBe('Test Template');
    expect(component.form.get('description')?.value).toBe('A test template');
    expect(component.form.get('documentType')?.value).toBe('msa');
    expect(component.form.get('content')?.value).toBe('# Test Content');
  });

  it('should redirect to templates page if template not found', async () => {
    const mockParamMap = {
      get: (key: string) => (key === 'id' ? 'nonexistent' : null),
    };
    (mockActivatedRoute as any).paramMap = of(mockParamMap);

    (mockDocumentTemplateService.getById as any).mockResolvedValue(null);

    component.ngOnInit();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/org/templates']);
  });

  it('should add custom variable', () => {
    const newVar: CustomVariable = { name: 'testVar', label: 'Test Var', description: 'Test variable' };
    component.addVariable(newVar);

    expect(component.customVariables()).toContainEqual(newVar);
  });

  it('should update custom variable', () => {
    const initialVar: CustomVariable = { name: 'var1', label: 'Var 1', description: 'Initial' };
    component.addVariable(initialVar);

    const updatedVar: CustomVariable = { name: 'var1', label: 'Var 1', description: 'Updated' };
    component.updateVariable(0, updatedVar);

    expect(component.customVariables()[0]).toEqual(updatedVar);
  });

  it('should remove custom variable', () => {
    const var1: CustomVariable = { name: 'var1', label: 'Var 1', description: 'Variable 1' };
    const var2: CustomVariable = { name: 'var2', label: 'Var 2', description: 'Variable 2' };
    component.addVariable(var1);
    component.addVariable(var2);

    component.removeVariable(0);

    expect(component.customVariables().length).toBe(1);
    expect(component.customVariables()[0]).toEqual(var2);
  });

  it('should combine built-in and custom variables in allVariableNames', () => {
    const customVar: CustomVariable = { name: 'customVar', label: 'Custom Var', description: 'Custom' };
    component.customVariables.set([customVar]);
    component['updateVariableNames']();

    const allVars = component.allVariableNames();
    expect(allVars).toContain('buyerOrgName');
    expect(allVars).toContain('vendorOrgName');
    expect(allVars).toContain('engagementTitle');
    expect(allVars).toContain('customVar');
  });

  it('should create template on save in create mode', async () => {
    component.isCreateMode.set(true);
    component.form.patchValue({
      name: 'New Template',
      description: 'Test description',
      documentType: 'nda',
      content: '# Template',
    });

    await component.save();

    expect(mockDocumentTemplateService.create).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/org/templates']);
  });

  it('should update template on save in edit mode', async () => {
    component.isCreateMode.set(false);
    const mockTemplate: DocumentTemplate = {
      id: 'template-123',
      name: 'Original',
      description: 'Original description',
      documentType: 'msa',
      content: '# Original',
      variableSchema: null,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
      orgId: 'org-123',
      version: 1,
      createdBy: 'user-123',
    };
    (component as any).template = mockTemplate;

    component.form.patchValue({
      name: 'Updated Template',
      description: 'Updated description',
      documentType: 'sow',
      content: '# Updated',
    });

    await component.save();

    expect(mockDocumentTemplateService.update).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/org/templates']);
  });

  it('should not save if form is invalid', async () => {
    component.form.patchValue({
      name: '', // Required field empty
      content: '', // Required field empty
    });

    await component.save();

    expect(mockDocumentTemplateService.create).not.toHaveBeenCalled();
    expect(mockRouter.navigate).not.toHaveBeenCalledWith(['/org/templates']);
  });

  it('should publish template', async () => {
    const mockTemplate: DocumentTemplate = {
      id: 'template-123',
      name: 'Test',
      description: 'Test',
      documentType: 'msa',
      content: '# Test',
      variableSchema: null,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
      orgId: 'org-123',
      version: 1,
      createdBy: 'user-123',
    };
    (component as any).template = mockTemplate;

    await component.publish();

    expect(mockDocumentTemplateService.publish).toHaveBeenCalledWith('template-123');
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/org/templates']);
  });

  it('should archive template', async () => {
    const mockTemplate: DocumentTemplate = {
      id: 'template-123',
      name: 'Test',
      description: 'Test',
      documentType: 'msa',
      content: '# Test',
      variableSchema: null,
      status: 'published',
      createdAt: new Date(),
      updatedAt: new Date(),
      orgId: 'org-123',
      version: 1,
      createdBy: 'user-123',
    };
    (component as any).template = mockTemplate;

    await component.archive();

    expect(mockDocumentTemplateService.archive).toHaveBeenCalledWith('template-123');
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/org/templates']);
  });

  it('should cancel and navigate back', () => {
    component.cancel();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/org/templates']);
  });

  it('should get document type label', () => {
    expect(component.getDocumentTypeLabel('msa')).toBe('Master Service Agreement');
    expect(component.getDocumentTypeLabel('nda')).toBe('Non-Disclosure Agreement');
    expect(component.getDocumentTypeLabel('sow')).toBe('Statement of Work');
    expect(component.getDocumentTypeLabel('compliance')).toBe('Compliance Document');
    expect(component.getDocumentTypeLabel('other')).toBe('Other');
    expect(component.getDocumentTypeLabel('unknown')).toBe('unknown');
  });
});
