import {
  Component, Input, ChangeDetectionStrategy, computed, signal,
} from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import type { ComplianceSummary } from '../../../core/models';

export interface ComplianceSegment {
  label: string;
  count: number;
  pct: number;
  cssClass: string;
}

@Component({
  selector: 'app-compliance-progress',
  standalone: true,
  imports: [MatTooltipModule],
  templateUrl: './compliance-progress.component.html',
  styleUrl: './compliance-progress.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComplianceProgress {
  private readonly _summary = signal<ComplianceSummary | null>(null);
  private readonly _showLabel = signal(true);
  private readonly _compact = signal(false);

  @Input({ required: true })
  set summary(value: ComplianceSummary) { this._summary.set(value); }

  @Input()
  set showLabel(value: boolean) { this._showLabel.set(value); }

  @Input()
  set compact(value: boolean) { this._compact.set(value); }

  readonly isCompact = computed(() => this._compact());
  readonly labelVisible = computed(() => this._showLabel());

  readonly segments = computed<ComplianceSegment[]>(() => {
    const s = this._summary();
    if (!s || s.total === 0) return [];
    return [
      { label: 'Met', count: s.met, pct: (s.met / s.total) * 100, cssClass: 'seg-met' },
      { label: 'Partial', count: s.partially_met, pct: (s.partially_met / s.total) * 100, cssClass: 'seg-partial' },
      { label: 'Planned', count: s.planned, pct: (s.planned / s.total) * 100, cssClass: 'seg-planned' },
      { label: 'Not Met', count: s.not_met, pct: (s.not_met / s.total) * 100, cssClass: 'seg-not-met' },
      { label: 'N/A', count: s.not_applicable, pct: (s.not_applicable / s.total) * 100, cssClass: 'seg-na' },
    ].filter(seg => seg.count > 0);
  });

  readonly responded = computed(() => this._summary()?.responded ?? 0);
  readonly total = computed(() => this._summary()?.total ?? 0);
  readonly respondedPct = computed(() =>
    this.total() > 0 ? Math.round((this.responded() / this.total()) * 100) : 0,
  );
}
