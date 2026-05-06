import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { OnboardingBootstrapShellComponent } from './onboarding-bootstrap-shell.component';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('OnboardingBootstrapShellComponent', () => {
  let component: OnboardingBootstrapShellComponent;
  let fixture: ComponentFixture<OnboardingBootstrapShellComponent>;
  let router: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    // Create mock router
    router = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [OnboardingBootstrapShellComponent, MatProgressSpinnerModule, MatButtonModule],
      providers: [{ provide: Router, useValue: router }],
    }).compileComponents();

    fixture = TestBed.createComponent(OnboardingBootstrapShellComponent);
    component = fixture.componentInstance;
  });

  it('Test 1: Component initializes with isLoading=true by default', () => {
    fixture.detectChanges();
    expect(component.isLoading).toBe(true);
    expect(component.errorMessage).toBeNull();
  });

  it('Test 2: Query param ?error=bootstrap-failed sets errorMessage and isLoading=false', () => {
    // Mock window.location.search
    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      value: { search: '?error=bootstrap-failed' },
      writable: true,
      configurable: true,
    });

    try {
      component.ngOnInit();

      expect(component.isLoading).toBe(false);
      expect(component.errorMessage).toContain('encountered an issue');
    } finally {
      Object.defineProperty(window, 'location', {
        value: originalLocation,
        writable: true,
        configurable: true,
      });
    }
  });

  it('Test 3: dismissError() calls router.navigate to /login', () => {
    component.dismissError();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('Test 4: Template shows spinner during loading, hides on error', () => {
    // Test 1: Loading state shows spinner
    component.isLoading = true;
    component.errorMessage = null;
    fixture.detectChanges();
    let spinnerEl = fixture.nativeElement.querySelector('mat-progress-spinner');
    expect(spinnerEl).toBeTruthy();

    // Test 2: Error state shows error message, no spinner
    component.isLoading = false;
    component.errorMessage = 'Test error';
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();

    spinnerEl = fixture.nativeElement.querySelector('mat-progress-spinner');
    expect(spinnerEl).toBeFalsy();

    const errorEl = fixture.nativeElement.querySelector('.error-text');
    expect(errorEl).toBeTruthy();
    expect(errorEl.textContent).toContain('Test error');
  });

  it('Test 5: Error message is rendered when errorMessage is set', () => {
    component.isLoading = false;
    component.errorMessage = 'Custom error message';
    fixture.detectChanges();

    const errorEl = fixture.nativeElement.querySelector('.error-text');
    expect(errorEl.textContent).toContain('Custom error message');
  });
});
