import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-coming-soon',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="coming-soon">
      <mat-icon class="coming-soon-icon">construction</mat-icon>
      <h2>{{ title }}</h2>
      <p>This feature is coming soon.</p>
    </div>
  `,
  styles: [`
    .coming-soon {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      text-align: center;
      color: var(--zb-secondary-text);
    }
    .coming-soon-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      opacity: 0.4;
      margin-bottom: 1rem;
    }
    h2 {
      font-size: 1.5rem;
      font-weight: 600;
      margin: 0 0 0.5rem;
      color: var(--zb-text);
    }
    p { margin: 0; font-size: 0.9375rem; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComingSoon {
  private readonly route = inject(ActivatedRoute);
  readonly title = this.route.snapshot.data['title'] || 'Coming Soon';
}
