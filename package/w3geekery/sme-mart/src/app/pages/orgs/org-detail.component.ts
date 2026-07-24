import {
  Component, inject, signal, computed, ChangeDetectionStrategy, OnInit, effect,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { Clipboard } from '@angular/cdk/clipboard';
import { TitleCasePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ZbSimplePanelComponent, ZbAvatarLabelComponent, ZbCustomizableTableComponent } from '@zerobias-org/ngx-library';
import { ZerobiasClientApp } from '@zerobias-com/zerobias-client';
import { map, switchMap, from, firstValueFrom } from 'rxjs';
import { ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import { UUID } from '@zerobias-org/types-core-js';
import { GraphqlReadService } from '../../core/services/graphql-read.service';

interface OrgInfo {
  id: string;
  slug?: string;
  name: string;
  description?: string;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface OrgMember {
  id: string;
  name: string;
  type: string;
  status?: string;
  email?: string;
  avatarUrl?: string;
}

interface OrgGroup {
  id: string;
  name: string;
  groupType?: string;
  boundaryGroupType?: string;
  avatarUrl?: string;
}

interface BoundaryInfo {
  id: string;
  name: string;
  boundaryType?: string;
  status?: string;
}

interface SmeMartProject {
  id: string;
  name: string;
  status?: string;
  engagementId?: string;
  description?: string;
}

interface EngagementInfo {
  id: string;
  name?: string;
}

function toOrgMember(raw: Record<string, unknown>): OrgMember {
  const emails = raw['emails'];
  const fallbackEmail = Array.isArray(emails) ? String(emails[0] ?? '') : '';
  const email = raw['email'] ? String(raw['email']) : (fallbackEmail || undefined);
  return {
    id: String(raw['id'] ?? ''),
    name: String(raw['name'] ?? ''),
    type: String(raw['type'] ?? ''),
    status: raw['status'] ? String(raw['status']) : undefined,
    email,
    avatarUrl: raw['avatarUrl'] ? String(raw['avatarUrl']) : undefined,
  };
}

function toOrgGroup(raw: Record<string, unknown>): OrgGroup {
  return {
    id: String(raw['id'] ?? ''),
    name: String(raw['name'] ?? ''),
    groupType: raw['groupType'] ? String(raw['groupType']) : undefined,
    boundaryGroupType: raw['boundaryGroupType'] ? String(raw['boundaryGroupType']) : undefined,
    avatarUrl: raw['avatarUrl'] ? String(raw['avatarUrl']) : undefined,
  };
}

@Component({
  selector: 'app-org-detail',
  standalone: true,
  imports: [
    RouterLink,
    TitleCasePipe,
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
  private readonly clipboard = inject(Clipboard);
  private readonly snackBar = inject(MatSnackBar);

  // Raw route handle — slug or UUID. Use `orgId` (resolved UUID) for downstream.
  readonly routeHandle = toSignal(
    this.route.paramMap.pipe(map(p => p.get('orgId') || '')),
    { initialValue: '' }
  );

  readonly currentOrgId = signal<string | null>(null);

  readonly orgData = toSignal(
    this.route.paramMap.pipe(
      switchMap(params => {
        const handle = params.get('orgId') || '';
        if (!handle) {
          return from(Promise.resolve([null, [], [], []] as const));
        }

        // Resolve handle (slug or UUID) against the cached org list.
        // getOrgs() is a BehaviorSubject populated at app boot — firstValueFrom
        // reads it synchronously, no extra fetch.
        type SdkPaged = { items?: Array<Record<string, unknown>> };
        const work = firstValueFrom(this.app.getOrgs()).then(async (orgs) => {
          const list = (orgs ?? []) as unknown as Array<{ id?: unknown; slug?: string }>;
          const found =
            list.find(o => String(o.id) === handle || o.slug === handle) ?? null;
          if (!found) return [null, [], [], []] as const;

          const idStr = String(found.id);

          // Canonical redirect: UUID URL → slug URL when slug exists.
          if (UUID_RE.test(handle) && found.slug && found.slug !== handle) {
            this.router.navigate(['/orgs', found.slug], { replaceUrl: true });
          }

          const orgIdUuid = new UUID(idStr);

          const [members, groups, boundaries] = await Promise.all([
            this.clientApi.hydraClient?.getOrgApi?.()
              .listOrgMembers?.(orgIdUuid)
              .then((r: unknown) => ((r as SdkPaged)?.items ?? []).map(toOrgMember))
              .catch(() => [] as OrgMember[]) || Promise.resolve([] as OrgMember[]),
            this.clientApi.hydraClient?.getOrgApi?.()
              .listGroups?.(orgIdUuid)
              .then((r: unknown) => ((r as SdkPaged)?.items ?? []).map(toOrgGroup))
              .catch(() => [] as OrgGroup[]) || Promise.resolve([] as OrgGroup[]),
            this.clientApi.platformClient
              .getBoundaryApi()
              .listBoundaries(1, 100)
              .then(result => result.items || [])
              .catch(() => [] as BoundaryInfo[]),
          ]);

          return [found as OrgInfo, members, groups, boundaries] as const;
        }).catch(() => [null, [], [], []] as const);

        return from(work);
      })
    ),
    {
      initialValue: [null, [], [], []] as const
    }
  );

  // Resolved UUID (downstream consumers — SDK calls, isCurrent comparison, etc).
  readonly orgId = computed(() => {
    const o = this.orgData()[0] as OrgInfo | null;
    return o ? String(o.id) : '';
  });

  readonly isCurrent = computed(() => this.currentOrgId() === this.orgId());

  // Computed signals for template
  readonly org = computed(() => this.orgData()[0] as OrgInfo | null);
  readonly members = computed(() => this.orgData()[1] as OrgMember[]);
  readonly groups = computed(() => this.orgData()[2] as OrgGroup[]);
  readonly boundaries = computed(() => this.orgData()[3] as BoundaryInfo[]);

  // Projects management
  readonly projects = signal<SmeMartProject[]>([]);
  readonly engagementMap = signal<Record<string, EngagementInfo>>({});
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

  // Load projects when orgId changes (must be field initializer for injection context)
  private readonly loadProjectsEffect = effect(() => {
    const id = this.orgId();
    if (id) {
      this.loadProjectsForOrg(id);
    }
  });

  ngOnInit(): void {
    try {
      const currentId = this.app.getCurrentOrgId();
      this.currentOrgId.set(currentId || null);
    } catch {
      this.currentOrgId.set(null);
    }
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
          const eng = await this.graphqlRead.query<EngagementInfo>(
            'Engagement',
            ['id', 'name'],
            { filters: { id: `.eq.${engId}` }, pageSize: 1, pageNumber: 1 }
          );

          if (eng.items && eng.items.length > 0) {
            this.engagementMap.update(map => ({
              ...map,
              [engId as string]: eng.items[0],
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

  copyOrgId(): void {
    const id = this.orgId();
    if (!id) return;
    this.clipboard.copy(id);
    this.snackBar.open('Organization ID copied', 'OK', { duration: 2000 });
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
