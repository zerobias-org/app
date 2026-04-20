import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

/**
 * Generic "coming soon" placeholder for project tabs not yet implemented.
 * Reads the tab title from route data.
 */
@Component({
  selector: 'app-project-coming-soon-tab',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="coming-soon-tab">
      <mat-icon class="coming-soon-icon">construction</mat-icon>
      <h3>{{ title }}</h3>
      <p>This tab is under construction.</p>
    </div>
  `,
  styles: [`
    .coming-soon-tab {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      color: var(--zb-secondary-text);
      text-align: center;
    }

    .coming-soon-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 1rem;
      opacity: 0.5;
    }

    h3 {
      margin: 0 0 0.5rem;
      font-size: 1.25rem;
      font-weight: 500;
    }

    p {
      margin: 0;
      font-size: 0.9rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectComingSoonTab {
  private readonly route = inject(ActivatedRoute);
  readonly title = this.route.snapshot.data['title'] ?? 'Coming Soon';
}
