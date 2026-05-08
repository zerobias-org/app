import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PlatformEngagementSetupComponent } from './platform-engagement-setup.component';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('PlatformEngagementSetupComponent', () => {
  let component: PlatformEngagementSetupComponent;
  let fixture: ComponentFixture<PlatformEngagementSetupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlatformEngagementSetupComponent, MatButtonModule, MatIconModule],
    }).compileComponents();

    fixture = TestBed.createComponent(PlatformEngagementSetupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the holding-page heading', () => {
    const heading = fixture.nativeElement.querySelector('h1');
    expect(heading).toBeTruthy();
    expect(heading.textContent).toContain('being set up');
  });

  it('refresh() triggers window.location.reload()', () => {
    const reloadSpy = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: reloadSpy },
      writable: true,
      configurable: true,
    });

    component.refresh();

    expect(reloadSpy).toHaveBeenCalled();
  });

  it('does not render a spinner (no auto-fire provisioning)', () => {
    const spinnerEl = fixture.nativeElement.querySelector('mat-progress-spinner');
    expect(spinnerEl).toBeFalsy();
  });
});
