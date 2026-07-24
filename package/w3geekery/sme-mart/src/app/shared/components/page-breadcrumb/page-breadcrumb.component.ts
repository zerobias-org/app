import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

export interface PageBreadcrumbItem {
  label: string;
  link?: string | unknown[];
  icon?: string;
}

@Component({
  selector: 'app-page-breadcrumb',
  standalone: true,
  imports: [RouterLink, MatIconModule],
  template: `
    <nav class="page-breadcrumb" aria-label="Breadcrumb">
      @for (item of items(); track $index) {
        @if (!$first) {
          <mat-icon class="separator" aria-hidden="true">chevron_right</mat-icon>
        }
        @if (item.link && !$last) {
          <a [routerLink]="item.link" class="crumb crumb--link">
            @if (item.icon) {
              <mat-icon class="crumb-icon" aria-hidden="true">{{ item.icon }}</mat-icon>
            }
            <span class="crumb-label">{{ item.label }}</span>
          </a>
        } @else {
          <span class="crumb crumb--current" aria-current="page">
            @if (item.icon) {
              <mat-icon class="crumb-icon" aria-hidden="true">{{ item.icon }}</mat-icon>
            }
            <span class="crumb-label">{{ item.label }}</span>
          </span>
        }
      }
    </nav>
  `,
  styles: [`
    .page-breadcrumb {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 4px;
      font-size: 0.875rem;
      line-height: 1.4;
      color: var(--zb-text-secondary, var(--mat-sys-on-surface-variant));
    }

    .separator {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: var(--mat-sys-outline-variant);
      flex-shrink: 0;
    }

    .crumb {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 6px;
      border-radius: 4px;
      text-decoration: none;
    }

    .crumb-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .crumb-label {
      white-space: nowrap;
      max-width: 32ch;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .crumb--link {
      color: var(--mat-sys-primary);
      cursor: pointer;
    }

    .crumb--link:hover {
      background-color: var(--mat-sys-surface-container-high);
      text-decoration: underline;
    }

    .crumb--current {
      color: var(--zb-text, var(--mat-sys-on-surface));
      font-weight: 500;
    }
  `],
})
export class PageBreadcrumbComponent {
  readonly items = input.required<PageBreadcrumbItem[]>();
}
