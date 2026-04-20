import {
  Component,
  ChangeDetectionStrategy,
  ViewChild,
  inject,
  input,
  output,
  signal,
  model,
} from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatBadgeModule } from '@angular/material/badge';
import { ZbSearchInputComponent, ZbEmptyStateContainerComponent } from '@zerobias-org/ngx-library';
import { CatalogFilters } from '../catalog-filters/catalog-filters.component';
import { ResizableDrawerDirective } from '../../directives/resizable-drawer.directive';
import { UserPreferencesService } from '../../../core/services/user-preferences.service';
import type { CatalogFiltersState, EnabledFilters } from '../../../core/models';

export interface SortOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-list-page',
  standalone: true,
  imports: [
    MatSidenavModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatBadgeModule,
    ZbSearchInputComponent,
    ZbEmptyStateContainerComponent,
    CatalogFilters,
    ResizableDrawerDirective,
  ],
  templateUrl: './list-page.component.html',
  styleUrl: './list-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListPage {
  @ViewChild(CatalogFilters) private catalogFiltersComp!: CatalogFilters;
  private readonly prefs = inject(UserPreferencesService);

  // Page header
  readonly title = input.required<string>();
  readonly description = input<string>('');

  // Toolbar
  readonly searchPlaceholder = input<string>('Search...');
  readonly searchValue = model<string>('');
  readonly sortOptions = input.required<SortOption[]>();
  readonly sortValue = model<string>('');

  // Content state
  readonly items = input.required<unknown[]>();
  readonly loading = input<boolean>(false);
  readonly emptyText = input<string>('No results found');

  // Search event for pages that need custom handling
  readonly searchChange = output<string>();

  // Filter drawer (owned by ListPage)
  readonly drawerOpen = signal(false);
  readonly enabledFilters = this.prefs.enabledFilters;
  readonly catalogFilters = this.prefs.catalogFilters;
  readonly activeFilterCount = this.prefs.activeFilterCount;

  onSearch(term: string | null): void {
    const value = term || '';
    this.searchValue.set(value);
    this.searchChange.emit(value);
  }

  onSortChange(value: string): void {
    this.sortValue.set(value);
  }

  onFiltersChange(filters: CatalogFiltersState): void {
    this.prefs.setCatalogFilters(filters);
  }

  onEnabledChange(enabled: EnabledFilters): void {
    this.prefs.setEnabledFilters(enabled);
  }

  toggleDrawer(): void {
    const opening = !this.drawerOpen();
    this.drawerOpen.set(opening);
    if (opening && this.activeFilterCount() === 0) {
      setTimeout(() => this.catalogFiltersComp?.openFilterMenu(), 300);
    }
  }
}
