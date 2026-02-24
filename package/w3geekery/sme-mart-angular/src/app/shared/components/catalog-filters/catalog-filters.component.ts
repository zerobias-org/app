import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, inject, computed, signal, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CatalogFilterSection } from '../catalog-filter-section/catalog-filter-section.component';
import { FilterEnabler } from '../filter-enabler/filter-enabler.component';
import { CatalogService } from '../../../core/services/catalog.service';
import type {
  CatalogItem,
  EnabledFilters,
  CatalogFiltersState,
  FilterType,
} from '../../../core/models';

interface FilterSectionConfig {
  type: FilterType;
  title: string;
  showAllAsChips: boolean;
}

const FILTER_CONFIGS: FilterSectionConfig[] = [
  { type: 'roles', title: 'Roles', showAllAsChips: false },
  { type: 'skills', title: 'Skills', showAllAsChips: false },
  { type: 'products', title: 'Products', showAllAsChips: false },
  { type: 'frameworks', title: 'Frameworks', showAllAsChips: false },
  { type: 'segments', title: 'Segments', showAllAsChips: false },
  { type: 'serviceSegments', title: 'Service Segments', showAllAsChips: true },
];

@Component({
  selector: 'app-catalog-filters',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    CatalogFilterSection,
    FilterEnabler,
  ],
  templateUrl: './catalog-filters.component.html',
  styleUrl: './catalog-filters.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogFilters {
  @ViewChild(FilterEnabler) private filterEnabler!: FilterEnabler;
  private readonly catalog = inject(CatalogService);

  private readonly _enabledFilters = signal<EnabledFilters>({
    roles: true, skills: true, products: false,
    frameworks: false, segments: false, serviceSegments: false,
  });
  private readonly _selectedFilters = signal<CatalogFiltersState>({
    roles: [], skills: [], products: [],
    frameworks: [], segments: [], serviceSegments: [],
  });

  @Input()
  set enabledFilters(value: EnabledFilters) {
    this._enabledFilters.set(value);
  }

  @Input()
  set selectedFilters(value: CatalogFiltersState) {
    this._selectedFilters.set(value);
  }

  @Output() filtersChange = new EventEmitter<CatalogFiltersState>();
  @Output() enabledChange = new EventEmitter<EnabledFilters>();

  readonly activeSections = computed(() =>
    FILTER_CONFIGS.filter((cfg) => this._enabledFilters()[cfg.type]),
  );

  getItems(type: FilterType): CatalogItem[] {
    switch (type) {
      case 'roles': return this.catalog.roles();
      case 'skills': return this.catalog.skills();
      case 'products': return this.catalog.products();
      case 'frameworks': return this.catalog.frameworks();
      case 'segments': return this.catalog.segments();
      case 'serviceSegments': return this.catalog.serviceSegments();
    }
  }

  getSelectedIds(type: FilterType): Set<string> {
    return new Set(this._selectedFilters()[type]);
  }

  onSelectionChange(event: { filterType: FilterType; selectedIds: Set<string> }): void {
    const current = this._selectedFilters();
    const updated: CatalogFiltersState = {
      ...current,
      [event.filterType]: [...event.selectedIds],
    };
    this._selectedFilters.set(updated);
    this.filtersChange.emit(updated);
  }

  onRemoveSection(type: FilterType): void {
    const current = this._enabledFilters();
    const updated: EnabledFilters = { ...current, [type]: false };
    this._enabledFilters.set(updated);
    this.enabledChange.emit(updated);
  }

  onEnabledChange(updated: EnabledFilters): void {
    this._enabledFilters.set(updated);
    this.enabledChange.emit(updated);
  }

  clearAll(): void {
    const cleared: CatalogFiltersState = {
      roles: [], skills: [], products: [],
      frameworks: [], segments: [], serviceSegments: [],
    };
    this._selectedFilters.set(cleared);
    this.filtersChange.emit(cleared);
  }

  get hasActiveFilters(): boolean {
    const f = this._selectedFilters();
    return Object.values(f).some((arr) => arr.length > 0);
  }

  get currentEnabled(): EnabledFilters {
    return this._enabledFilters();
  }

  /** Programmatically open the filter-enabler menu */
  openFilterMenu(): void {
    this.filterEnabler?.menuTrigger?.openMenu();
  }
}
