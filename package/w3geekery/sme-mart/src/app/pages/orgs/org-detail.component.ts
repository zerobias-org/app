import {
  Component, inject, signal, computed, ChangeDetectionStrategy, OnInit,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ZbSimplePanelComponent, ZbAvatarLabelComponent } from '@zerobias-org/ngx-library';
import { ZerobiasClientApp } from '@zerobias-com/zerobias-client';
import { map, switchMap, from } from 'rxjs';
import { ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import { UUID } from '@zerobias-org/types-core-js';

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
    ZbSimplePanelComponent,
    ZbAvatarLabelComponent,
  ],
  templateUrl: './org-detail.component.html',
  styleUrl: './org-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrgDetailComponent implements OnInit {
  private readonly app = inject(ZerobiasClientApp);
  private readonly route = inject(ActivatedRoute);
  private readonly clientApi = inject(ZerobiasClientApi);

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

  ngOnInit(): void {
    try {
      const currentId = this.app.getCurrentOrgId();
      this.currentOrgId.set(currentId || null);
    } catch {
      this.currentOrgId.set(null);
    }
    // Data loading is now handled via toSignal(combineLatest(...)) above
  }

  goToOrgProfile(): void {
    // Navigation handled by template routerLink
  }
}
