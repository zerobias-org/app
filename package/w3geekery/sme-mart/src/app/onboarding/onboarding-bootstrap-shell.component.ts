import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';

/**
 * OnboardingBootstrapShellComponent — loading surface displayed while the guard runs
 * the 5-step bootstrap sequence to ensure the org has a default engagement.
 *
 * Surfaces errors gracefully:
 * - If bootstrap succeeds, the guard routes away automatically
 * - If bootstrap fails, the guard routes here with ?error=bootstrap-failed query param
 * - User sees error message + Retry button
 *
 * Per Phase 27 AR-04 (loading surface) and AR-09 (error handling).
 */
@Component({
  selector: 'app-onboarding-bootstrap-shell',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, MatButtonModule],
  templateUrl: './onboarding-bootstrap-shell.component.html',
  styleUrls: ['./onboarding-bootstrap-shell.component.scss'],
})
export class OnboardingBootstrapShellComponent implements OnInit {
  private router = inject(Router);

  isLoading = true;
  errorMessage: string | null = null;

  ngOnInit() {
    // Check for error query param — set by guard on bootstrap failure
    const error = new URLSearchParams(window.location.search).get('error');
    if (error === 'bootstrap-failed') {
      this.isLoading = false;
      this.errorMessage = 'Onboarding setup encountered an issue. Please try again.';
    }
  }

  dismissError() {
    // User clicked retry on error; redirect to login to restart the flow
    this.router.navigate(['/login']);
  }
}
