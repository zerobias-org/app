import {
  Component, inject, signal, computed, ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { toSignal } from '@angular/core/rxjs-interop';
import { ZbSearchInputComponent, ZbEmptyStateContainerComponent, ZbResourceStatusComponent } from '@zerobias-org/ngx-library';
import { ZerobiasClientApi, ZerobiasClientApp } from '@zerobias-com/zerobias-client';
import { UserPreferencesService } from '../../core/services/user-preferences.service';
import { GraphqlReadService } from '../../core/services/graphql-read.service';

interface OrgListItem {
  id: string;
  name: string;
  description?: string;
  hidden?: boolean;
  memberCount?: number;
}

interface OrgMetrics {
  engagementCount: number;
  projectCount: number;
}

interface OrgWithMetadata extends OrgListItem {
  isInternal: boolean;
  badgeLabel: 'INTERNAL' | 'EXTERNAL';
  metrics: OrgMetrics;
}

@Component({
  selector: 'app-org-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatDividerModule,
    ZbSearchInputComponent,
    ZbEmptyStateContainerComponent,
    ZbResourceStatusComponent,
  ],
  templateUrl: './org-list.component.html',
  styleUrl: './org-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrgListComponent {
  private readonly clientApi = inject(ZerobiasClientApi);
  private readonly app = inject(ZerobiasClientApp);
  private readonly prefs = inject(UserPreferencesService);
  private readonly graphqlRead = inject(GraphqlReadService);

  // System org UUID
  private readonly SYSTEM_ORG_ID = '00000000-0000-0000-0000-000000000000';

  readonly allOrgs = signal<OrgListItem[]>([]);
  readonly searchTerm = signal('');
  readonly viewMode = signal<'cards' | 'table'>('cards');
  readonly currentOrgId = signal<string | null>(null);
  readonly isLoading = signal(true);
  readonly whoAmIData = toSignal(inject(ZerobiasClientApp).getWhoAmI(), { initialValue: null });
  readonly orgMetrics = signal<Record<string, OrgMetrics>>({});

  readonly orgsWithMetadata = computed(() => {
    const whoAmI = this.whoAmIData();
    if (!whoAmI) return [];

    const all = this.allOrgs();
    const metrics = this.orgMetrics();
    const ownerIdStr = whoAmI.ownerId?.toString() || '';

    return all.map((org: OrgListItem): OrgWithMetadata => ({
      ...org,
      isInternal: ownerIdStr === org.id,
      badgeLabel: ownerIdStr === org.id ? 'INTERNAL' : 'EXTERNAL',
      metrics: metrics[org.id] || { engagementCount: 0, projectCount: 0 },
    }));
  });

  readonly filteredOrgs = computed(() => {
    const all = this.orgsWithMetadata();
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
      const orgList = (orgs || []).map((org: any) => ({
        id: org.id?.toString() || org.id,
        name: org.name || '',
        description: org.description,
        hidden: org.hidden,
        memberCount: org.memberCount,
      }));

      this.allOrgs.set(orgList);
      // Set current org ID
      const currentId = this.app.getCurrentOrgId();
      this.currentOrgId.set(currentId || null);

      // Load metrics for all orgs in parallel (FLAG-1: parallelize)
      await this.loadAllOrgMetrics(orgList);
    } catch (err) {
      console.error('[OrgList] Failed to load orgs:', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  private async loadAllOrgMetrics(orgs: OrgListItem[]): Promise<void> {
    // Fire all metric requests in parallel (FLAG-1 fix)
    const metricPromises = orgs.map(org => this.loadOrgMetrics(org.id));
    await Promise.all(metricPromises);
  }

  private async loadOrgMetrics(orgId: string): Promise<void> {
    try {
      // Query engagements (org scoping handled by dana-org-id header, not filter)
      const engagements = await this.graphqlRead.query<any>(
        'Engagement',
        ['id'],
        { pageSize: 1, pageNumber: 1 }
      );
      const engagementCount = engagements.page.totalCount || 0;

      // Query projects (org scoping handled by dana-org-id header, not filter)
      const projects = await this.graphqlRead.query<any>(
        'SmeMartProject',
        ['id'],
        { pageSize: 1, pageNumber: 1 }
      );
      const projectCount = projects.page.totalCount || 0;

      this.orgMetrics.update(metrics => ({
        ...metrics,
        [orgId]: { engagementCount, projectCount }
      }));
    } catch (error) {
      console.error('Failed to load metrics for org', orgId, error);
      // Set default zeros on error
      this.orgMetrics.update(metrics => ({
        ...metrics,
        [orgId]: { engagementCount: 0, projectCount: 0 }
      }));
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

  getMemberCount(org: OrgListItem): number {
    return org.memberCount || 0;
  }
}
