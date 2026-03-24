import {
  Component, Input, Output, EventEmitter,
  ChangeDetectionStrategy, signal, computed,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import type { CatalogItem, TimelineFilterType } from '../../../core/models';

@Component({
  selector: 'app-timeline-filter-section',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatChipsModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  templateUrl: './timeline-filter-section.component.html',
  styleUrl: './timeline-filter-section.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimelineFilterSection {
  @Input({ required: true }) title = '';
  @Input({ required: true }) filterType!: TimelineFilterType;
  @Input() collapsible = true;
  @Input() removable = false;
  @Input() showAllAsChips = false;

  private readonly _items = signal<CatalogItem[]>([]);
  @Input()
  set items(value: CatalogItem[]) {
    this._items.set(value);
  }

  private readonly _selectedIds = signal<Set<string>>(new Set());
  @Input()
  set selectedIds(value: Set<string>) {
    this._selectedIds.set(value);
  }

  @Output() selectionChange = new EventEmitter<{ filterType: TimelineFilterType; selectedIds: Set<string> }>();
  @Output() removeSection = new EventEmitter<TimelineFilterType>();

  readonly collapsed = signal(false);
  readonly searchControl = new FormControl('');
  private readonly searchTerm = toSignal(this.searchControl.valueChanges, { initialValue: '' });

  readonly filteredItems = computed(() => {
    const search = (this.searchTerm() || '').toLowerCase();
    const items = this._items();
    if (!search) return items;
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(search) ||
        item.code?.toLowerCase().includes(search),
    );
  });

  readonly selectedItems = computed(() => {
    const ids = this._selectedIds();
    return this._items().filter((item) => ids.has(item.id));
  });

  readonly selectedCount = computed(() => this._selectedIds().size);

  isSelected(itemId: string): boolean {
    return this._selectedIds().has(itemId);
  }

  toggleCollapse(): void {
    if (this.collapsible) {
      this.collapsed.update((v) => !v);
    }
  }

  onRemove(): void {
    this.removeSection.emit(this.filterType);
  }

  toggleChip(item: CatalogItem): void {
    const current = new Set(this._selectedIds());
    if (current.has(item.id)) {
      current.delete(item.id);
    } else {
      current.add(item.id);
    }
    this._selectedIds.set(current);
    this.selectionChange.emit({ filterType: this.filterType, selectedIds: current });
  }

  onAutocompleteSelect(event: MatAutocompleteSelectedEvent): void {
    const item: CatalogItem = event.option.value;
    const current = new Set(this._selectedIds());
    current.add(item.id);
    this._selectedIds.set(current);
    this.searchControl.setValue('');
    this.selectionChange.emit({ filterType: this.filterType, selectedIds: current });
  }

  removeSelected(item: CatalogItem): void {
    const current = new Set(this._selectedIds());
    current.delete(item.id);
    this._selectedIds.set(current);
    this.selectionChange.emit({ filterType: this.filterType, selectedIds: current });
  }

  displayFn(item: CatalogItem): string {
    return item?.name || '';
  }
}
