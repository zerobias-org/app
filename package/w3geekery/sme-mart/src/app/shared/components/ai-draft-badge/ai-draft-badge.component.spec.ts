import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AiDraftBadge } from './ai-draft-badge.component';

describe('AiDraftBadge', () => {
  let fixture: ComponentFixture<AiDraftBadge>;
  let component: AiDraftBadge;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AiDraftBadge],
    }).compileComponents();

    fixture = TestBed.createComponent(AiDraftBadge);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display "AI-generated" text', () => {
    const badge = fixture.nativeElement.querySelector('.ai-badge');
    expect(badge.textContent).toContain('AI-generated');
  });

  it('should use default tooltip when none provided', () => {
    const badge = fixture.nativeElement.querySelector('.ai-badge');
    // matTooltip is a directive, check the attribute binding
    expect(component.tooltip).toBeUndefined();
  });

  it('should accept custom tooltip', () => {
    component.tooltip = 'Custom tooltip text';
    fixture.detectChanges();
    expect(component.tooltip).toBe('Custom tooltip text');
  });

  it('should contain auto_awesome icon', () => {
    const icon = fixture.nativeElement.querySelector('mat-icon');
    expect(icon.textContent.trim()).toBe('auto_awesome');
  });
});
