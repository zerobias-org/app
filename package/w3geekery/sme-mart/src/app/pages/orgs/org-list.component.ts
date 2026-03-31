import {
  Component, inject, signal, computed, ChangeDetectionStrategy,
} from '@angular/core';
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

  readonly allOrgs = signal<OrgListItem[]>([]);
  readonly searchTerm = signal('');
  readonly viewMode = signal<'cards' | 'table'>('cards');
  readonly currentOrgId = signal<string | null>(null);
  readonly isLoading = signal(true);

  readonly filteredOrgs = computed(() => {
    const all = this.allOrgs();
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
    // Load view mode preference
    const savedMode = this.prefs.getOrgListViewMode();
    this.viewMode.set(savedMode);

    // Initialize org list - stub for now, will need proper API call
    this.isLoading.set(false);
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
