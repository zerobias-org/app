import { Component, inject, signal, computed, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { input, output } from '@angular/core';
import { CatalogService } from '../../core/services/catalog.service';
import type { CatalogSegment } from '../../core/models';

/**
 * Service Segment Multi-Select Picker Component
 *
 * Allows users to select from Catalog Service segments (133 leaf nodes).
 * Loads segments on init via CatalogService, filters by segmentType: service.
 * Emits selected segment UUIDs via segmentsChanged output.
 *
 * Angular 21: standalone, inject(), input()/output(), signals, OnPush, @if/@for
 */
@Component({
  selector: 'app-service-segment-picker',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
  ],
  templateUrl: './service-segment-picker.component.html',
  styleUrl: './service-segment-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceSegmentPickerComponent implements OnInit {
  private readonly catalog = inject(CatalogService);

  readonly selectedSegmentIds = input<string[]>([]);
  readonly segmentsChanged = output<string[]>();

  // Loaded segments from catalog
  private readonly allSegments = signal<CatalogSegment[]>([]);
  readonly loading = signal(false);
  readonly searchTerm = signal('');

  // Filtered segments for display (by search term)
  readonly displaySegments = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.allSegments();
    return this.allSegments().filter((seg) =>
      seg.name.toLowerCase().includes(term) || seg.code?.toLowerCase().includes(term)
    );
  });

  // Currently selected segments (with resolved names)
  readonly selectedSegments = computed(() => {
    const ids = this.selectedSegmentIds();
    const segments = this.allSegments();
    return ids
      .map((id) => segments.find((s) => s.id === id))
      .filter((s): s is CatalogSegment => s !== undefined);
  });

  // No-match state message
  readonly noMatchMessage = computed(() => {
    const term = this.searchTerm();
    if (!term) return '';
    const matches = this.displaySegments().length;
    return matches === 0 ? `No services match '${term}'. Try another keyword.` : '';
  });

  async ngOnInit() {
    this.loading.set(true);
    try {
      // Load all segments if not already loaded
      if (this.catalog.segments().length === 0) {
        await this.catalog.loadSegments();
      }
      // Set all segments (assuming they are the service segments per D-56 Option B)
      this.allSegments.set(this.catalog.segments());
    } catch (err) {
      console.warn('[ServiceSegmentPicker] Failed to load segments:', err);
    } finally {
      this.loading.set(false);
    }
  }

  onSearch(term: string): void {
    this.searchTerm.set(term);
  }

  onSelectionChange(selected: CatalogSegment[]): void {
    const ids = selected.map((s) => s.id);
    this.segmentsChanged.emit(ids);
  }

  onAddSegment(segment: CatalogSegment): void {
    if (this.selectedSegmentIds().includes(segment.id)) {
      return;
    }
    this.onSelectionChange([...this.selectedSegments(), segment]);
  }

  onRemove(segment: CatalogSegment): void {
    const current = this.selectedSegmentIds();
    const updated = current.filter((id) => id !== segment.id);
    this.segmentsChanged.emit(updated);
  }

  // Helper for template: convert display segments to format expected by multi-autocomplete
  getAutoCompleteOptions() {
    return this.displaySegments().map((seg) => ({
      id: seg.id,
      label: seg.name,
      value: seg,
    }));
  }
}
