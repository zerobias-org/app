import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { MarkdownEditor } from './markdown-editor.component';

describe('MarkdownEditor', () => {
  let component: MarkdownEditor;
  let fixture: ComponentFixture<MarkdownEditor>;
  let debugElement: DebugElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarkdownEditor],
    }).compileComponents();

    fixture = TestBed.createComponent(MarkdownEditor);
    component = fixture.componentInstance;
    debugElement = fixture.debugElement;
    // Don't detect changes yet to avoid async editorRef issues
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty content', () => {
    expect(component.content).toBe('');
  });

  it('should have empty variableNames by default', () => {
    expect(component.variableNames).toEqual([]);
  });

  it('should initialize previewMode as false', () => {
    expect(component.previewMode()).toBe(false);
  });

  it('should filter variables by text', () => {
    component.variableNames = ['buyerOrgName', 'vendorOrgName', 'customField'];
    component.filterVariables('buyer');
    expect(component.filteredVariables()).toEqual(['buyerOrgName']);
  });

  it('should show all variables when filter is empty', () => {
    component.variableNames = ['buyerOrgName', 'vendorOrgName'];
    component.filterVariables('');
    expect(component.filteredVariables()).toEqual(['buyerOrgName', 'vendorOrgName']);
  });

  it('should open variable menu', () => {
    component.variableNames = ['buyerOrgName'];
    component.openVariableMenu();
    expect(component.showVariableMenu()).toBe(true);
    expect(component.filteredVariables()).toEqual(['buyerOrgName']);
  });

  it('should get markdown content', () => {
    const markdown = component.getMarkdown();
    expect(typeof markdown).toBe('string');
  });
});
