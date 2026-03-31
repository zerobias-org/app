import {
  Component, inject, signal, computed, ChangeDetectionStrategy,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { FormsModule } from '@angular/forms';
import { ZbSearchInputComponent, ZbEmptyStateContainerComponent } from '@zerobias-org/ngx-library';
import { ZerobiasClientApp } from '@zerobias-com/zerobias-client';
import { UserPreferencesService } from '../../core/services/user-preferences.service';
import { map } from 'rxjs';

interface OrgListItem {
  id: string;
  name: string;
  description?: string;
  hidden?: boolean;
  memberCount?: number;
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
    FormsModule,
    ZbSearchInputComponent,
    ZbEmptyStateContainerComponent,
  ],
  templateUrl: './org-list.component.html',
  styleUrl: './org-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrgListComponent {
  private readonly app = inject(ZerobiasClientApp);
  private readonly prefs = inject(UserPreferencesService);

  // System org UUID
  private readonly SYSTEM_ORG_ID = '00000000-0000-0000-0000-000000000000';

  readonly allOrgs = toSignal(
    this.app.getOrgs().pipe(
      map(orgs => (orgs || []).map((org: any) => ({
        id: org.id?.toString() || org.id,
        name: org.name || '',
        description: org.description,
        hidden: org.hidden,
        memberCount: org.memberCount,
      } as OrgListItem)))
    ),
    { initialValue: [] }
  );

  readonly searchTerm = signal('');
  readonly viewMode = signal<'cards' | 'table'>('cards');

  readonly currentOrgId = toSignal(
    this.app.getCurrentOrg().pipe(map(org => org?.id || null)),
    { initialValue: null }
  );

  readonly isLoading = signal(false);

  readonly filteredOrgs = computed(() => {
    const all = this.allOrgs() as OrgListItem[];
    const term = this.searchTerm().toLowerCase();

    return all.filter((org: OrgListItem) => {
      // Filter out hidden orgs
      if (org.hidden) return false;

      // Filter out System Org by UUID
      if (org.id === this.SYSTEM_ORG_ID) return false;

      // Filter out ops orgs - use slug filtering (operations.*) or match full "Operations" name
      const isOpsOrg = org.name === 'Operations';
      if (isOpsOrg) return false;

      // Apply search filter
      return org.name.toLowerCase().includes(term);
    });
  });

  constructor() {
    // Load view mode preference from UserPreferencesService
    const savedMode = this.prefs.getOrgListViewMode();
    this.viewMode.set(savedMode);
    // Data loading is now handled via toSignal(app.listMyOrgs())
  }

  toggleViewMode(): void {
    const newMode = this.viewMode() === 'cards' ? 'table' : 'cards';
    this.viewMode.set(newMode);
    this.prefs.setOrgListViewMode(newMode);
  }

  isActive(orgId: string): boolean {
    const currentId = this.currentOrgId();
    if (!currentId) return false;
    const currentIdStr = typeof currentId === 'string' ? currentId : currentId.toString();
    return currentIdStr === orgId;
  }

  getMemberCount(org: OrgListItem): number {
    return org.memberCount || 0;
  }
}
