import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-org-projects-tab',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="projects-stub">
      <div class="stub-card">
        <mat-icon class="stub-icon">assignment</mat-icon>
        <h3>Organization Projects</h3>
        <p>Project management depends on Plan 022 (Project Hierarchy). This tab will list org-scoped projects once that plan is implemented.</p>
      </div>
    </div>
  `,
  styles: [`
    .projects-stub { max-width: 600px; }

    .stub-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 48px 24px;
      border: 1px solid var(--mat-sys-outline-variant, #e0e0e0);
      border-radius: 8px;
    }
    .stub-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: var(--mat-sys-on-surface-variant, #999);
      margin-bottom: 12px;
    }
    h3 { margin: 0 0 8px; font-weight: 500; }
    p { margin: 0; font-size: 14px; color: var(--mat-sys-on-surface-variant, #666); max-width: 400px; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsTab {}
