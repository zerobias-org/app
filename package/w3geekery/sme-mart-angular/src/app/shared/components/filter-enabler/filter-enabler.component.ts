import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule, MatCheckboxChange } from '@angular/material/checkbox';
import type { EnabledFilters, FilterType } from '../../../core/models';

interface FilterOption {
  type: FilterType;
  label: string;
}

const OPTIONS: FilterOption[] = [
  { type: 'roles', label: 'Roles' },
  { type: 'skills', label: 'Skills' },
  { type: 'products', label: 'Products' },
  { type: 'frameworks', label: 'Frameworks' },
  { type: 'segments', label: 'Segments' },
  { type: 'serviceSegments', label: 'Service Segments' },
];

@Component({
  selector: 'app-filter-enabler',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatMenuModule, MatCheckboxModule],
  templateUrl: './filter-enabler.component.html',
  styleUrl: './filter-enabler.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterEnabler {
  private readonly _enabled = signal<EnabledFilters>({
    roles: true, skills: true, products: false,
    frameworks: false, segments: false, serviceSegments: false,
  });

  @Input()
  set enabledFilters(value: EnabledFilters) {
    this._enabled.set(value);
  }

  @Output() enabledChange = new EventEmitter<EnabledFilters>();

  readonly options = OPTIONS;

  isEnabled(type: FilterType): boolean {
    return this._enabled()[type];
  }

  onToggle(type: FilterType, event: MatCheckboxChange): void {
    const current = this._enabled();
    const updated: EnabledFilters = { ...current, [type]: event.checked };
    this._enabled.set(updated);
    this.enabledChange.emit(updated);
  }
}
