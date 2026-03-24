import {
  Component, Input, Output, EventEmitter, signal, computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { TitleCasePipe } from '@angular/common';
import type { RfpTaskGroup, RfpRequirement } from '../../../core/models/rfp.model';
import {
  type BidResponse, type ComplianceStatus, type ComplianceSummary,
  COMPLIANCE_STATUS_OPTIONS,
} from '../../../core/models/bid-response.model';

/** Local working copy of a response (not yet persisted). */
export interface ResponseDraft {
  compliance_status: ComplianceStatus;
  response_text: string;
  estimated_hours: number | null;
  estimated_cost: number | null;
  certification_ref: string;
}

export interface ResponseChange {
  requirementId: string;
  draft: ResponseDraft;
}

@Component({
  selector: 'app-requirement-response',
  standalone: true,
  imports: [
    MatExpansionModule, MatFormFieldModule, MatSelectModule,
    MatInputModule, MatIconModule, MatChipsModule, TitleCasePipe,
  ],
  templateUrl: './requirement-response.component.html',
  styleUrl: './requirement-response.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequirementResponse {
  private readonly _taskGroups = signal<RfpTaskGroup[]>([]);
  private readonly _savedResponses = signal<Map<string, BidResponse>>(new Map());

  /** Local draft state keyed by requirement ID. */
  readonly drafts = signal<Map<string, ResponseDraft>>(new Map());

  @Input({ required: true })
  set taskGroups(value: RfpTaskGroup[]) {
    this._taskGroups.set(value);
    if (!this.selectedType() && value.length > 0) {
      this.selectedType.set(value[0].taskType);
    }
  }

  @Input()
  set savedResponses(value: BidResponse[]) {
    const map = new Map<string, BidResponse>();
    const draftMap = new Map<string, ResponseDraft>();
    for (const r of value) {
      map.set(r.requirement_id, r);
      draftMap.set(r.requirement_id, {
        compliance_status: r.compliance_status,
        response_text: r.response_text || '',
        estimated_hours: r.estimated_hours ?? null,
        estimated_cost: r.estimated_cost ?? null,
        certification_ref: r.certification_ref || '',
      });
    }
    this._savedResponses.set(map);
    // Merge with existing drafts (keep unsaved changes)
    this.drafts.update(existing => {
      const merged = new Map(draftMap);
      for (const [id, draft] of existing) {
        if (!merged.has(id)) merged.set(id, draft);
      }
      return merged;
    });
  }

  @Output() responseChanged = new EventEmitter<ResponseChange>();
  @Output() allResponsesChanged = new EventEmitter<Map<string, ResponseDraft>>();

  readonly statusOptions = COMPLIANCE_STATUS_OPTIONS;
  readonly selectedType = signal<string>('');
  readonly groups = computed(() => this._taskGroups());

  readonly selectedGroup = computed(() =>
    this.groups().find(g => g.taskType === this.selectedType()) || null,
  );

  /** Per-group compliance summary. */
  readonly groupSummaries = computed(() => {
    const summaries = new Map<string, ComplianceSummary>();
    const drafts = this.drafts();

    for (const group of this.groups()) {
      const total = group.requirements.length;
      const summary: ComplianceSummary = {
        met: 0, partially_met: 0, not_met: 0,
        not_applicable: 0, planned: 0,
        total, responded: 0,
      };

      for (const req of group.requirements) {
        const draft = drafts.get(req.id);
        if (draft && draft.compliance_status !== 'not_met') {
          summary.responded++;
          (summary as any)[draft.compliance_status]++;
        } else if (draft) {
          // Has a draft but status is not_met (could be explicit or default)
          const saved = this._savedResponses().get(req.id);
          if (saved) {
            summary.responded++;
            summary.not_met++;
          }
        }
      }
      summaries.set(group.taskType, summary);
    }

    return summaries;
  });

  /** Overall totals across all groups. */
  readonly overallSummary = computed(() => {
    const result: ComplianceSummary = {
      met: 0, partially_met: 0, not_met: 0,
      not_applicable: 0, planned: 0,
      total: 0, responded: 0,
    };
    for (const s of this.groupSummaries().values()) {
      result.met += s.met;
      result.partially_met += s.partially_met;
      result.not_met += s.not_met;
      result.not_applicable += s.not_applicable;
      result.planned += s.planned;
      result.total += s.total;
      result.responded += s.responded;
    }
    return result;
  });

  selectType(type: string): void {
    this.selectedType.set(type);
  }

  getDraft(requirementId: string): ResponseDraft {
    return this.drafts().get(requirementId) || {
      compliance_status: 'not_met',
      response_text: '',
      estimated_hours: null,
      estimated_cost: null,
      certification_ref: '',
    };
  }

  updateDraft(requirementId: string, field: keyof ResponseDraft, value: unknown): void {
    const current = this.getDraft(requirementId);
    const updated = { ...current, [field]: value };
    this.drafts.update(m => {
      const next = new Map(m);
      next.set(requirementId, updated);
      return next;
    });
    this.responseChanged.emit({ requirementId, draft: updated });
    this.allResponsesChanged.emit(this.drafts());
  }

  getPriorityLabel(priority: number): string {
    if (priority >= 1000) return 'Critical';
    if (priority >= 500) return 'High';
    if (priority >= 200) return 'Normal';
    return 'Low';
  }

  getPriorityClass(priority: number): string {
    if (priority >= 1000) return 'priority-critical';
    if (priority >= 500) return 'priority-high';
    if (priority >= 200) return 'priority-normal';
    return 'priority-low';
  }
}
