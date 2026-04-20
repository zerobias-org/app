import {
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { ZbCustomizableTableComponent } from '@zerobias-org/ngx-library';
import { UUID } from '@zerobias-org/types-core-js';
import { BoundaryService } from '../../../core/services/boundary.service';

/**
 * Row data for party table.
 */
export interface BoundaryPartyRow {
  id: string;
  name: string;
  roles: string; // comma-separated role names
  teams?: string; // comma-separated team names or empty
}

/**
 * Group of parties within a boundary.
 */
interface BoundaryGroup {
  boundaryId: string;
  boundaryName: string;
  parties: BoundaryPartyRow[];
}

/**
 * Project entity (input).
 */
interface SmeMartProject {
  id: string;
  name?: string;
  boundaryIds?: string[];
}

@Component({
  selector: 'app-project-parties-tab',
  standalone: true,
  imports: [
    CommonModule,
    MatExpansionModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    ZbCustomizableTableComponent,
  ],
  templateUrl: './project-parties-tab.component.html',
  styleUrl: './project-parties-tab.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectPartiesTabComponent {
  private readonly boundaryService = inject(BoundaryService);

  readonly project = input.required<SmeMartProject>();

  readonly partiesLoading = signal(true);
  readonly boundaryParties = signal<Record<string, BoundaryPartyRow[]>>({});
  readonly boundaryNames = signal<Record<string, string>>({});

  readonly boundaryIds = computed(() => this.project().boundaryIds || []);

  readonly boundaryGroups = computed(() => {
    const ids = this.boundaryIds();
    const parties = this.boundaryParties();
    const names = this.boundaryNames();

    return ids.map((boundaryId) => ({
      boundaryId,
      boundaryName: names[boundaryId] || `Boundary ${boundaryId.substring(0, 8)}...`,
      parties: parties[boundaryId] || [],
    }));
  });

  constructor() {
    effect(() => {
      const ids = this.boundaryIds();
      if (ids.length > 0) {
        this.loadBoundaryParties();
      }
    });
  }

  private async loadBoundaryParties(): Promise<void> {
    this.partiesLoading.set(true);
    try {
      const boundaryIds = this.boundaryIds();
      const partiesMap: Record<string, BoundaryPartyRow[]> = {};
      const namesMap: Record<string, string> = {};

      for (const boundaryId of boundaryIds) {
        // Convert string boundaryId to UUID for API calls
        const boundaryUUID = new UUID(boundaryId);

        // Load parties
        const parties = await this.boundaryService.listBoundaryParties(boundaryUUID);

        if (!parties || parties.length === 0) {
          partiesMap[boundaryId] = [];
          namesMap[boundaryId] = `Boundary ${boundaryId.substring(0, 8)}...`;
          continue;
        }

        // Load roles for each party
        const partiesWithRoles: BoundaryPartyRow[] = [];

        for (const party of parties) {
          // party.id is already a UUID from SDK; use it directly
          const partyUUID = party.id instanceof UUID ? party.id : new UUID(party.id);
          const roles = await this.boundaryService.listBoundaryPartyRoles(
            boundaryUUID,
            partyUUID
          );
          const roleNames = (roles || []).map((r) => r.role?.name || '').filter(Boolean).join(', ');

          partiesWithRoles.push({
            id: party.id.toString(),
            name: party.name || 'Unknown Party',
            roles: roleNames || 'No roles',
            teams: '', // TODO: Load teams if needed
          });
        }

        partiesMap[boundaryId] = partiesWithRoles;

        // Try to get boundary name from getBoundary API (FLAG-4 resolution)
        const boundaryInfo = await this.boundaryService.getBoundary(boundaryUUID);
        namesMap[boundaryId] = boundaryInfo?.name || `Boundary ${boundaryId.substring(0, 8)}...`;
      }

      this.boundaryParties.set(partiesMap);
      this.boundaryNames.set(namesMap);
    } catch (error) {
      console.error('Failed to load boundary parties', error);
    } finally {
      this.partiesLoading.set(false);
    }
  }
}
