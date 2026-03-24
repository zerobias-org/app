import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { AiLoadingPanel } from './ai-loading-panel.component';

describe('AiLoadingPanel', () => {
  let fixture: ComponentFixture<AiLoadingPanel>;
  let component: AiLoadingPanel;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AiLoadingPanel],
    }).compileComponents();

    fixture = TestBed.createComponent(AiLoadingPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display default message when none provided', () => {
    const header = fixture.nativeElement.querySelector('.loading-header h3');
    expect(header.textContent).toContain('Generating bid draft...');
  });

  it('should display custom message', () => {
    fixture.componentRef.setInput('message', 'Analyzing requirements...');
    fixture.detectChanges();

    const header = fixture.nativeElement.querySelector('.loading-header h3');
    expect(header.textContent).toContain('Analyzing requirements...');
  });

  it('should display percent complete', () => {
    fixture.componentRef.setInput('percent', 42);
    fixture.detectChanges();

    const detail = fixture.nativeElement.querySelector('.loading-detail');
    expect(detail.textContent).toContain('42%');
  });

  it('should default percent to 0', () => {
    const detail = fixture.nativeElement.querySelector('.loading-detail');
    expect(detail.textContent).toContain('0%');
  });

  it('should emit cancelled when cancel button is clicked', () => {
    const spy = vi.fn();
    component.cancelled.subscribe(spy);

    const cancelBtn = fixture.nativeElement.querySelector('.cancel-btn');
    cancelBtn.click();

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should contain a progress bar', () => {
    const progressBar = fixture.nativeElement.querySelector('mat-progress-bar');
    expect(progressBar).toBeTruthy();
  });

  it('should contain a spinner', () => {
    const spinner = fixture.nativeElement.querySelector('mat-spinner');
    expect(spinner).toBeTruthy();
  });

  it('should show info text about AI generation', () => {
    const info = fixture.nativeElement.querySelector('.loading-info p');
    expect(info.textContent).toContain('analyzing the RFP requirements');
  });
});
