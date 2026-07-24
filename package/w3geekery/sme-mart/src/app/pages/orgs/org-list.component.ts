import {
  Component, inject, signal, computed, ChangeDetectionStrategy,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { toSignal } from '@angular/core/rxjs-interop';
import { ZbSearchInputComponent, ZbEmptyStateContainerComponent, ZbAvatarLabelComponent } from '@zerobias-org/ngx-library';
import { ZerobiasClientApi, ZerobiasClientApp } from '@zerobias-com/zerobias-client';
import { UserPreferencesService } from '../../core/services/user-preferences.service';

interface OrgListItem {
  id: string;
  slug?: string;
  name: string;
  description?: string;
  hidden?: boolean;
  avatarUrl?: string;
  domains?: string[];
  supportEmail?: string;
}

// Type alias kept so call sites that still reference OrgWithMetadata for
// readability survive future re-additions of cheap per-org metadata. Today
// there are no derived fields — the cross-org metrics block was removed
// 2026-05-14 (the engagement/project counts repeated the current session
// org's totals on every card because GQL scoping comes from the dana-org-id
// header, not a filter — so all rows showed the same numbers).
type OrgWithMetadata = OrgListItem;

@Component({
  selector: 'app-org-list',
  standalone: true,
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatDividerModule,
    ZbSearchInputComponent,
    ZbEmptyStateContainerComponent,
    ZbAvatarLabelComponent,
  ],
  templateUrl: './org-list.component.html',
  styleUrl: './org-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrgListComponent {
  private readonly clientApi = inject(ZerobiasClientApi);
  private readonly app = inject(ZerobiasClientApp);
  private readonly prefs = inject(UserPreferencesService);

  // System org UUID
  private readonly SYSTEM_ORG_ID = '00000000-0000-0000-0000-000000000000';

  readonly allOrgs = signal<OrgListItem[]>([]);
  readonly searchTerm = signal('');
  readonly viewMode = signal<'cards' | 'table'>('cards');
  readonly currentOrgId = signal<string | null>(null);
  readonly isLoading = signal(true);
  readonly whoAmIData = toSignal(inject(ZerobiasClientApp).getWhoAmI(), { initialValue: null });

  readonly filteredOrgs = computed(() => {
    const all = this.allOrgs();
    const term = this.searchTerm().toLowerCase();

    return all.filter((org: OrgWithMetadata) => {
      if (org.id === this.SYSTEM_ORG_ID) return false;
      if (org.name === 'Operations') return false;
      // hidden:true is a platform default on most orgs — don't filter on it
      return org.name.toLowerCase().includes(term);
    });
  });

  constructor() {
    const savedMode = this.prefs.getOrgListViewMode();
    this.viewMode.set(savedMode);
    this.loadOrgs();
  }

  private async loadOrgs(): Promise<void> {
    try {
      this.isLoading.set(true);
      const orgs = await this.clientApi.danaClient.getMeApi().listMyOrgs();
      type RawOrg = {
        id?: { toString(): string } | string;
        slug?: string;
        name?: string;
        description?: string;
        hidden?: boolean;
        avatarUrl?: { toString(): string } | string;
        domains?: string[];
        supportEmail?: string;
      };
      const orgList = ((orgs || []) as unknown as RawOrg[]).map((org): OrgListItem => ({
        id: typeof org.id === 'string' ? org.id : (org.id?.toString() ?? ''),
        slug: org.slug,
        name: org.name || '',
        description: org.description,
        hidden: org.hidden,
        avatarUrl: typeof org.avatarUrl === 'string'
          ? org.avatarUrl
          : org.avatarUrl?.toString(),
        domains: Array.isArray(org.domains) ? org.domains : undefined,
        supportEmail: org.supportEmail,
      }));

      this.allOrgs.set(orgList);
      const currentId = this.app.getCurrentOrgId();
      this.currentOrgId.set(currentId || null);
    } catch (err) {
      console.error('[OrgList] Failed to load orgs:', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  toggleViewMode(): void {
    const newMode = this.viewMode() === 'cards' ? 'table' : 'cards';
    this.viewMode.set(newMode);
    this.prefs.setOrgListViewMode(newMode);
  }

  isActive(orgId: string): boolean {
    return this.currentOrgId() === orgId;
  }

  getDomain(org: OrgListItem): string {
    if (org.domains && org.domains.length > 0) {
      const first = org.domains[0];
      return first.startsWith('@') ? first : `@${first}`;
    }
    if (org.supportEmail) return org.supportEmail;
    return '';
  }
}
