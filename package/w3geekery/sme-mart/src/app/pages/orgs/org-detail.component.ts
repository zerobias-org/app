import {
  Component, inject, signal, computed, ChangeDetectionStrategy, OnInit, effect,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ZbSimplePanelComponent, ZbAvatarLabelComponent, ZbCustomizableTableComponent } from '@zerobias-org/ngx-library';
import { ZerobiasClientApp } from '@zerobias-com/zerobias-client';
import { map, switchMap, from } from 'rxjs';
import { ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import { UUID } from '@zerobias-org/types-core-js';
import { GraphqlReadService } from '../../core/services/graphql-read.service';

interface OrgInfo {
  id: string;
  name: string;
  description?: string;
}

interface OrgMember {
  id: string;
  display_name?: string;
  email?: string;
  role?: string;
}

interface OrgGroup {
  id: string;
  name: string;
  memberCount?: number;
}

interface OrgDetail {
  org: OrgInfo | null;
  members: OrgMember[];
  groups: OrgGroup[];
  boundaries: any[];
}

interface SmeMartProject {
  id: string;
  name: string;
  status?: string;
  engagementId?: string;
  description?: string;
}

interface EngagementGroup {
  engagementId: string;
  engagementName: string;
  projects: SmeMartProject[];
}

@Component({
  selector: 'app-org-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    ZbSimplePanelComponent,
    ZbAvatarLabelComponent,
    ZbCustomizableTableComponent,
  ],
  templateUrl: './org-detail.component.html',
  styleUrl: './org-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrgDetailComponent implements OnInit {
  private readonly app = inject(ZerobiasClientApp);
  private readonly route = inject(ActivatedRoute);
  private readonly clientApi = inject(ZerobiasClientApi);
  private readonly router = inject(Router);
  private readonly graphqlRead = inject(GraphqlReadService);

  readonly orgId = toSignal(
    this.route.paramMap.pipe(map(p => p.get('orgId') || '')),
    { initialValue: '' }
  );

  readonly currentOrgId = signal<string | null>(null);

  readonly isCurrent = computed(() => this.currentOrgId() === this.orgId());

  readonly orgData = toSignal(
    this.route.paramMap.pipe(
      switchMap(params => {
        const id = params.get('orgId') || '';
        if (!id) {
          return from(Promise.resolve([null, [], [], []]));
        }

        // Load org from the list and find the one matching this ID
        const orgsPromise = this.app.getOrgs()
          .toPromise()
          .then(orgs => {
            const org = (orgs || []).find((o: any) => o.id === id) || null;
            return org as any;
          });

        // Load members and groups via clientApi.hydraClient
        const orgId = new UUID(id);
        const membersPromise = this.clientApi.hydraClient?.getOrgApi?.()
          .listOrgMembers?.(orgId)
          .then((result: any) => (result?.items || []))
          .catch(() => []) || Promise.resolve([]);

        const groupsPromise = this.clientApi.hydraClient?.getOrgApi?.()
          .listGroups?.(orgId)
          .then((result: any) => (result?.items || []))
          .catch(() => []) || Promise.resolve([]);

        // Boundaries: Stub as empty array for now
        // For current org, boundary listing API will be implemented in Phase 08+
        const boundariesPromise = Promise.resolve([]);

        // Combine all promises into an Observable
        return from(
          Promise.all([orgsPromise, membersPromise, groupsPromise, boundariesPromise])
            .then(([org, members, groups, boundaries]) => {
              return [org || null, members || [], groups || [], boundaries || []] as const;
            })
            .catch(() => {
              return [null, [], [], []] as const;
            })
        );
      })
    ),
    {
      initialValue: [null, [], [], []]
    }
  );

  // Computed signals for template
  readonly org = computed(() => this.orgData()[0] as OrgInfo | null);
  readonly members = computed(() => this.orgData()[1] as OrgMember[]);
  readonly groups = computed(() => this.orgData()[2] as OrgGroup[]);
  readonly boundaries = computed(() => this.orgData()[3] as any[]);

  // Projects management
  readonly projects = signal<SmeMartProject[]>([]);
  readonly engagementMap = signal<Record<string, any>>({});
  readonly projectsLoading = signal(false);

  readonly engagementGroups = computed(() => {
    const all = this.projects();
    const groups = new Map<string, SmeMartProject[]>();

    for (const proj of all) {
      const engId = proj.engagementId || 'ungrouped';
      if (!groups.has(engId)) groups.set(engId, []);
      groups.get(engId)!.push(proj);
    }

    return Array.from(groups.entries()).map(([engId, prjs]) => ({
      engagementId: engId,
      engagementName: this.engagementMap()[engId]?.name || 'Unknown Engagement',
      projects: prjs,
    }));
  });

  ngOnInit(): void {
    try {
      const currentId = this.app.getCurrentOrgId();
      this.currentOrgId.set(currentId || null);
    } catch {
      this.currentOrgId.set(null);
    }

    // Load projects when orgId changes
    effect(() => {
      const id = this.orgId();
      if (id) {
        this.loadProjectsForOrg(id);
      }
    });
  }

  private async loadProjectsForOrg(orgId: string): Promise<void> {
    this.projectsLoading.set(true);
    try {
      const result = await this.graphqlRead.query<SmeMartProject>(
        'SmeMartProject',
        ['id', 'name', 'status', 'engagementId', 'description'],
        { filters: { ownerId: `.eq.${orgId}` }, pageSize: 100, pageNumber: 1 }
      );
      this.projects.set(result.items || []);

      // Load engagement names for grouping headers
      const engagementIds = Array.from(new Set(
        (result.items || []).map(p => p.engagementId).filter(Boolean)
      ));

      for (const engId of engagementIds) {
        try {
          const eng = await this.graphqlRead.query<any>(
            'Engagement',
            ['id', 'name'],
            { filters: { id: `.eq.${engId}` }, pageSize: 1, pageNumber: 1 }
          );

          if (eng.items && eng.items.length > 0) {
            this.engagementMap.update(map => ({
              ...map,
              [engId]: eng.items[0],
            }));
          }
        } catch (err) {
          console.error('Failed to load engagement', engId, err);
        }
      }
    } catch (error) {
      console.error('Failed to load projects for org', orgId, error);
      this.projects.set([]);
    } finally {
      this.projectsLoading.set(false);
    }
  }

  navigateToProject(projectId: string): void {
    this.router.navigate(['/project', projectId]);
  }

  navigateToEngagement(engagementId: string): void {
    this.router.navigate(['/engagement', engagementId]);
  }

  goToOrgProfile(): void {
    // Navigation handled by template routerLink
  }
}
