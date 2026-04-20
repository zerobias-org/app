import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { vi } from 'vitest';
import { ZerobiasClientApp } from '@zerobias-com/zerobias-client';
import { OrgDocumentTemplatesTabComponent } from './org-document-templates-tab.component';
import { DocumentTemplateService } from '@/core/services';
import { of } from 'rxjs';

describe('OrgDocumentTemplatesTabComponent', () => {
  let component: OrgDocumentTemplatesTabComponent;
  let fixture: ComponentFixture<OrgDocumentTemplatesTabComponent>;
  let mockApp: Partial<ZerobiasClientApp>;
  let mockTemplateService: Partial<DocumentTemplateService>;
  let mockRouter: Partial<Router>;

  beforeEach(async () => {
    mockApp = {
      getCurrentOrg: () => of({ id: 'test-org-id', name: 'Test Org' } as any),
    } as any;

    mockTemplateService = {
      listByOrg: vi.fn().mockResolvedValue([]),
      publish: vi.fn().mockResolvedValue(undefined),
      archive: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    };

    mockRouter = {
      navigate: vi.fn().mockResolvedValue(true),
    };

    await TestBed.configureTestingModule({
      imports: [OrgDocumentTemplatesTabComponent, MatDialogModule],
      providers: [
        { provide: ZerobiasClientApp, useValue: mockApp },
        { provide: DocumentTemplateService, useValue: mockTemplateService },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OrgDocumentTemplatesTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load templates on init', async () => {
    component.orgId.set('test-org-id');
    await component.loadTemplates();
    expect(mockTemplateService.listByOrg).toHaveBeenCalledWith('test-org-id');
  });

  it('should navigate to create template', () => {
    component.createNewTemplate();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/templates', 'new']);
  });

  it('should navigate to edit template', () => {
    const template = { id: 'template-id', name: 'Test Template' } as any;
    component.editTemplate(template);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/templates', 'template-id']);
  });

  it('should get variable count from schema', () => {
    const schema = JSON.stringify([{ name: 'var1' }, { name: 'var2' }]);
    expect(component.getVariableCount(schema)).toBe(2);
  });

  it('should handle invalid variable schema', () => {
    expect(component.getVariableCount('invalid json')).toBe(0);
    expect(component.getVariableCount(null)).toBe(0);
  });

  it('should format date correctly', () => {
    const date = new Date('2026-04-10T00:00:00Z');
    const formatted = component.formatDate(date);
    expect(formatted).toContain('Apr');
    expect(formatted).toMatch(/\d+/); // Has day of month
  });

  it('should get status label', () => {
    expect(component.getStatusLabel('draft')).toBe('Draft');
    expect(component.getStatusLabel('published')).toBe('Published');
    expect(component.getStatusLabel('archived')).toBe('Archived');
  });
});
