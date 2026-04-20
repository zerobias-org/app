import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

/**
 * Inline renderer for sme-doc:// document links.
 * Displays a file icon + document name as a clickable chip.
 *
 * Usage:
 * ```html
 * <app-sme-doc-link [docId]="doc.id" [filename]="doc.filename" (navigate)="openDoc($event)" />
 * ```
 */
@Component({
  selector: 'app-sme-doc-link',
  standalone: true,
  imports: [MatIconModule, MatTooltipModule],
  template: `
    <button class="doc-link-chip" (click)="navigate.emit(docId)" [matTooltip]="filename">
      <mat-icon class="doc-icon">description</mat-icon>
      <span class="doc-name">{{ filename }}</span>
    </button>
  `,
  styles: [`
    :host { display: inline; }

    .doc-link-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px 2px 4px;
      border: none;
      border-radius: 4px;
      background-color: var(--mat-sys-primary-container);
      color: var(--mat-sys-on-primary-container);
      font-size: 13px;
      line-height: 1.4;
      cursor: pointer;
      transition: background-color 0.15s;

      &:hover {
        background-color: var(--mat-sys-secondary-container);
      }
    }

    .doc-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .doc-name {
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SmeDocLinkRenderer {
  @Input({ required: true }) docId!: string;
  @Input({ required: true }) filename!: string;
  @Output() navigate = new EventEmitter<string>();
}
