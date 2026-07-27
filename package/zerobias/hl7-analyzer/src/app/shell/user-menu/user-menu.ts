import { ChangeDetectionStrategy, Component, ElementRef, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { map } from 'rxjs';
import { ZbThemeService } from '@zerobias-org/ngx-library';

import { environment } from '../../../environments/environment';
import { SessionService } from '../../core/session.service';
import { OrgSwitcher } from '../org-switcher/org-switcher';
import { CreateApiKeyDialogComponent } from './create-api-key-dialog';

/** Initials for the avatar chip — first + last word of the name, upper-cased. */
function initials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/[\s-]+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase() || '?';
}

/**
 * Account menu in the toolbar — parity with the React `UserMenu`: a name/org summary + initials
 * avatar trigger that opens a portal-style panel (user info, the org switcher, Create API Key, the
 * theme toggle, and Sign out + app version). It is NOT a `mat-menu` — the portal design is a custom
 * dropdown, and a `mat-menu` overlay can't host the org switcher's inline listbox; so this is a
 * hand-rolled panel (the documented shell-layout exception to ngx-library-first), styled with the
 * `--zb-*` tokens, closed on outside-click / Escape.
 */
@Component({
  selector: 'app-user-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, OrgSwitcher],
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'close()',
  },
  template: `
    <button
      type="button"
      class="trigger"
      (click)="toggle($event)"
      aria-haspopup="menu"
      [attr.aria-expanded]="open()"
    >
      @if (session.user(); as user) {
        <span class="summary">
          <span class="name">{{ user.name }}</span>
          <span class="org">{{ session.org()?.name }}</span>
        </span>
        <span class="avatar">{{ initials(user.name) }}</span>
      }
    </button>

    @if (open()) {
      <div class="panel" role="menu">
        @if (session.user(); as user) {
          <div class="head">
            <span class="avatar avatar-lg">{{ initials(user.name) }}</span>
            <div class="info">
              <span class="name">{{ user.name }}</span>
              @if (user.emails.length) {
                <span class="email">{{ user.emails[0] }}</span>
              }
            </div>
          </div>
        }

        <hr />

        <div class="org-section">
          <label>Organization</label>
          <app-org-switcher (switched)="close()" />
        </div>

        <hr />

        <button type="button" class="item" (click)="createApiKey()">
          <mat-icon>key</mat-icon>
          <span class="label">Create new API key</span>
        </button>

        <button type="button" class="item" (click)="toggleTheme()">
          <mat-icon>dark_mode</mat-icon>
          <span class="label">Dark theme</span>
          <mat-icon class="switch">{{ isDark() ? 'toggle_on' : 'toggle_off' }}</mat-icon>
        </button>

        <hr />

        <button type="button" class="item" (click)="logout()">
          <mat-icon>logout</mat-icon>
          <span class="label">Sign out</span>
          <span class="version">v{{ version }}</span>
        </button>
      </div>
    }
  `,
  styles: `
    :host {
      position: relative;
      display: inline-block;
    }

    .trigger {
      display: flex;
      align-items: center;
      gap: var(--zb-spacing-sm);
      height: 44px;
      padding: 0 var(--zb-spacing-sm);
      background: transparent;
      border: none;
      border-radius: var(--zb-radius-sm);
      color: #fff;
      cursor: pointer;
    }
    .trigger:hover {
      background: rgba(255, 255, 255, 0.08);
    }
    .summary {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      line-height: 1.2;
    }
    .summary .name {
      font-size: 15px;
      font-weight: 600;
      color: #fff;
      line-height: 1;
    }
    .summary .org {
      font-size: var(--zb-font-size-xs);
      color: rgba(255, 255, 255, 0.7);
      max-width: 220px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .avatar {
      display: grid;
      place-items: center;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--zb-primary);
      color: #fff;
      font-weight: 600;
      font-size: var(--zb-font-size-xs);
      flex-shrink: 0;
    }
    .avatar-lg {
      width: 48px;
      height: 48px;
      font-size: var(--zb-font-size-lg);
    }

    .panel {
      position: absolute;
      top: calc(100% + 6px);
      right: 0;
      width: 325px;
      background: var(--zb-background-card);
      color: var(--zb-text);
      border: 1px solid var(--zb-divider);
      border-radius: var(--zb-radius-md);
      box-shadow: 1px 1px 8px 2px rgba(0, 0, 0, 0.4);
      z-index: 100;
      overflow: visible;
      padding: var(--zb-spacing-sm) 0;
    }

    .head {
      display: flex;
      align-items: center;
      gap: var(--zb-spacing-sm);
      padding: var(--zb-spacing-xs) var(--zb-spacing-md);
    }
    .head .info {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .head .name {
      font-weight: 700;
      font-size: 15px;
      line-height: 18px;
    }
    .head .email {
      font-size: 12px;
      line-height: 1;
      color: var(--zb-secondary-text);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    hr {
      border: none;
      border-top: 1px solid var(--zb-divider);
      margin: var(--zb-spacing-sm) 0;
    }

    .org-section {
      padding: 0 var(--zb-spacing-md) var(--zb-spacing-xs);
    }
    .org-section label {
      display: block;
      font-size: var(--zb-font-size-xs);
      color: var(--zb-secondary-text);
      margin-bottom: var(--zb-spacing-xs);
    }

    .item {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      height: 36px;
      padding: 0 var(--zb-spacing-md);
      background: transparent;
      border: none;
      text-align: left;
      color: var(--zb-text);
      font: inherit;
      font-size: var(--zb-font-size-sm);
      cursor: pointer;
    }
    .item:hover {
      background: var(--zb-hover-overlay);
    }
    .item mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: var(--zb-secondary-text);
      flex-shrink: 0;
    }
    .item .label {
      flex-grow: 1;
    }
    .item .switch {
      font-size: 26px;
      width: 26px;
      height: 26px;
      color: var(--zb-primary);
    }
    .item .version {
      flex-shrink: 0;
      font-size: var(--zb-font-size-xs);
      color: var(--zb-secondary-text);
      font-variant-numeric: tabular-nums;
    }
  `,
})
export class UserMenu {
  protected readonly session = inject(SessionService);
  private readonly dialog = inject(MatDialog);
  private readonly theme = inject(ZbThemeService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly initials = initials;
  protected readonly version = environment.version;
  protected readonly open = signal(false);

  protected readonly isDark = toSignal(
    this.theme.preference$.pipe(map(() => this.theme.isDarkMode())),
    { initialValue: this.theme.isDarkMode() },
  );

  toggle(event: MouseEvent): void {
    // Stop this click from immediately reaching the document handler that would re-close the panel.
    event.stopPropagation();
    this.open.update((o) => !o);
  }

  close(): void {
    this.open.set(false);
  }

  onDocumentClick(event: MouseEvent): void {
    if (!this.open()) return;
    if (!this.host.nativeElement.contains(event.target as Node)) this.close();
  }

  toggleTheme(): void {
    this.theme.toggle();
  }

  createApiKey(): void {
    this.close();
    this.dialog.open(CreateApiKeyDialogComponent, { width: '480px', autoFocus: 'dialog' });
  }

  logout(): void {
    this.session.logout();
  }
}
