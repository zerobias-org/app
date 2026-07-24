import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import type { DanaOrg } from '@zerobias-com/dana-sdk';

import { SessionService } from '../../core/session.service';

/**
 * Org switcher — a collapsible listbox that lives inside the account menu, matching the React
 * `OrgSwitcher` (a WAI-ARIA listbox, not a native `<select>`, so it can be styled to the portal).
 *
 *   List:   `danaClient.getOrgApi().listOrgs(1, 50)` -> PagedResults<DanaOrg>
 *   Switch: `SessionService.selectOrg(org)` -> `app.selectOrg(org)`
 *
 * `DanaOrg extends Org`, so a list item is directly assignable to `selectOrg(next: Org)` — the
 * React side's `DanaOrg`-vs-`Org` note is a non-issue here. `listOrgs` has no sort param, so the
 * list is sorted by name on the client. The trigger owns `aria-expanded`; the open list tracks the
 * highlighted row with `aria-activedescendant` and routes arrows/Home/End/Enter/Escape itself.
 */
@Component({
  selector: 'app-org-switcher',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <div class="org-switch">
      <button
        type="button"
        class="org-switch-trigger"
        (click)="toggle()"
        (keydown)="onTriggerKey($event)"
        aria-haspopup="listbox"
        [attr.aria-expanded]="open()"
      >
        <span class="ellipsis">{{ session.org()?.name ?? 'Select organization' }}</span>
        <mat-icon>{{ open() ? 'expand_less' : 'expand_more' }}</mat-icon>
      </button>

      @if (open()) {
        <ul
          #list
          class="org-switch-list"
          role="listbox"
          tabindex="-1"
          aria-label="Select organization"
          [attr.aria-activedescendant]="activeId()"
          (keydown)="onListKey($event)"
        >
          @if (loading() && !orgs().length) {
            <li class="org-switch-loading">Loading organizations…</li>
          }
          @for (o of orgs(); track o.id.toString(); let i = $index) {
            <li
              [id]="optionId(o)"
              role="option"
              [attr.aria-selected]="isCurrent(o)"
              class="org-switch-item"
              [class.selected]="isCurrent(o)"
              [class.active]="i === activeIndex()"
              (mouseenter)="activeIndex.set(i)"
              (click)="pick(o)"
            >
              {{ o.name }}
            </li>
          }
        </ul>
      }
    </div>
  `,
  styles: `
    .org-switch {
      position: relative;
    }
    .org-switch-trigger {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--zb-spacing-xs);
      width: 100%;
      background: var(--zb-background);
      color: var(--zb-text);
      border: 1px solid var(--zb-divider);
      border-radius: var(--zb-radius-sm);
      padding: 8px 10px;
      font: inherit;
      font-size: var(--zb-font-size-sm);
      cursor: pointer;
    }
    .org-switch-trigger mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: var(--zb-secondary-text);
    }
    .org-switch-list {
      position: absolute;
      top: calc(100% + var(--zb-spacing-xs));
      left: 0;
      right: 0;
      z-index: 10;
      list-style: none;
      margin: 0;
      padding: var(--zb-spacing-xs) 0;
      max-height: 240px;
      overflow-y: auto;
      background: var(--zb-background);
      border: 1px solid var(--zb-divider);
      border-radius: var(--zb-radius-sm);
      box-shadow: 1px 1px 8px 2px rgba(0, 0, 0, 0.4);
    }
    .org-switch-list:focus {
      outline: none;
    }
    .org-switch-item {
      padding: 8px 10px;
      font-size: var(--zb-font-size-sm);
      cursor: pointer;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .org-switch-item:hover,
    .org-switch-item.active {
      background: var(--zb-hover-overlay);
    }
    .org-switch-item.selected {
      color: var(--zb-primary);
      font-weight: 600;
    }
    .org-switch-loading {
      padding: 8px 10px;
      font-size: var(--zb-font-size-sm);
      color: var(--zb-secondary-text);
    }
    .ellipsis {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  `,
})
export class OrgSwitcher {
  protected readonly session = inject(SessionService);

  /** Emitted after a switch so the parent account menu can close (React `onSwitched`). */
  readonly switched = output<void>();

  private readonly list = viewChild<ElementRef<HTMLUListElement>>('list');

  protected readonly open = signal(false);
  protected readonly orgs = signal<readonly DanaOrg[]>([]);
  protected readonly loading = signal(false);
  protected readonly activeIndex = signal(-1);
  private loaded = false;

  protected readonly activeId = computed(() => {
    const i = this.activeIndex();
    const list = this.orgs();
    return i >= 0 && i < list.length ? this.optionId(list[i]) : null;
  });

  protected optionId(o: DanaOrg): string {
    return `org-opt-${o.id.toString()}`;
  }

  protected isCurrent(o: DanaOrg): boolean {
    return o.id.toString() === this.session.org()?.id.toString();
  }

  toggle(): void {
    if (this.open()) this.close();
    else this.openList();
  }

  private openList(): void {
    this.open.set(true);
    this.seedActive();
    if (!this.loaded) this.load();
    // Focus moves into the listbox once it renders; the visible cue is the highlighted row.
    setTimeout(() => this.list()?.nativeElement.focus(), 0);
  }

  close(): void {
    this.open.set(false);
  }

  private seedActive(): void {
    const list = this.orgs();
    const cur = list.findIndex((o) => this.isCurrent(o));
    this.activeIndex.set(cur >= 0 ? cur : list.length ? 0 : -1);
  }

  private load(): void {
    const api = this.session.api();
    if (!api) return;
    this.loading.set(true);
    api.danaClient
      .getOrgApi()
      .listOrgs(1, 50)
      .then((page) => {
        const sorted = [...page.items].sort((a, b) =>
          a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }),
        );
        this.orgs.set(sorted);
        this.loaded = true;
        this.seedActive();
      })
      .catch((err) => console.error('listOrgs failed', err))
      .finally(() => this.loading.set(false));
  }

  async pick(o: DanaOrg): Promise<void> {
    this.close();
    if (!this.isCurrent(o)) await this.session.selectOrg(o);
    this.switched.emit();
  }

  onTriggerKey(e: KeyboardEvent): void {
    if (!this.open() && (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      this.openList();
    }
  }

  onListKey(e: KeyboardEvent): void {
    const last = this.orgs().length - 1;
    const i = this.activeIndex();
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.activeIndex.set(Math.min(i + 1, last));
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.activeIndex.set(Math.max(i - 1, 0));
        break;
      case 'Home':
        e.preventDefault();
        this.activeIndex.set(0);
        break;
      case 'End':
        e.preventDefault();
        this.activeIndex.set(last);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (i >= 0) void this.pick(this.orgs()[i]);
        break;
      case 'Escape':
        // Close only the list; stop the account menu's Escape handler from also closing the panel.
        e.preventDefault();
        e.stopPropagation();
        this.close();
        break;
      default:
        break;
    }
  }
}
