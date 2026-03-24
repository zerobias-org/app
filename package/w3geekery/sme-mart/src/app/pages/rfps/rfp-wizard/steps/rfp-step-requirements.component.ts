import {
  Component, Input, Output, EventEmitter, inject, signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TaskTypeListComponent } from './task-type-list.component';
import { RequirementEditorComponent } from './requirement-editor.component';
import { RfpImportDialogComponent } from './rfp-import-dialog.component';
import { RfpWizardService } from '../../../../core/services/rfp-wizard.service';
import type { RfpTaskGroup, RfpRequirement } from '../../../../core/models';
import type { DocumentType } from '../../../../core/models/document.model';

@Component({
  selector: 'app-rfp-step-requirements',
  standalone: true,
  imports: [
    MatButtonModule, MatIconModule, MatDialogModule,
    TaskTypeListComponent, RequirementEditorComponent,
  ],
  template: `
    <div class="step-content">
      <div class="step-header">
        <div>
          <h3>Define Requirements</h3>
          <p class="step-description">
            Add task categories and define individual requirements for each.
          </p>
        </div>
        <button mat-stroked-button (click)="openImport()">
          <mat-icon>upload_file</mat-icon>
          Import JSON
        </button>
      </div>

      <div class="requirements-panel">
        <div class="panel-left">
          <app-task-type-list
            [taskGroups]="taskGroups"
            [selectedType]="selectedType()"
            (selectedTypeChange)="selectedType.set($event)"
            (groupAdded)="onGroupAdded($event)" />
        </div>

        <div class="panel-right">
          @if (selectedGroup(); as group) {
            <div class="group-header">
              <h4>{{ group.displayName }}</h4>
              <div class="group-actions">
                <button mat-stroked-button (click)="addRequirement()">
                  <mat-icon>add</mat-icon> Add Requirement
                </button>
                <button mat-icon-button color="warn" (click)="removeGroup(group.taskType)"
                  aria-label="Remove task type">
                  <mat-icon>delete_outline</mat-icon>
                </button>
              </div>
            </div>

            @for (req of group.requirements; track req.id) {
              <app-requirement-editor
                [requirement]="req"
                (updated)="onRequirementUpdated($event)"
                (remove)="onRequirementRemoved($event)" />
            } @empty {
              <div class="empty-reqs">
                <mat-icon>checklist</mat-icon>
                <p>No requirements yet. Click "Add Requirement" to start.</p>
              </div>
            }
          } @else {
            <div class="empty-reqs">
              <mat-icon>category</mat-icon>
              <p>Select or add a task type from the left panel to define requirements.</p>
            </div>
          }
        </div>
      </div>

      <div class="step-actions">
        <button mat-button matStepperPrevious>Back</button>
        <button mat-flat-button (click)="next.emit()">Next</button>
      </div>
    </div>
  `,
  styles: [`
    .step-content { max-width: 960px; }
    .step-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 16px;
    }
    .step-description { color: var(--mat-sys-on-surface-variant, #666); margin: 4px 0 0; }
    .requirements-panel {
      display: grid;
      grid-template-columns: 240px 1fr;
      gap: 16px;
      border: 1px solid var(--mat-sys-outline-variant, #ddd);
      border-radius: 8px;
      padding: 16px;
      min-height: 360px;
    }
    .panel-left {
      border-right: 1px solid var(--mat-sys-outline-variant, #eee);
      padding-right: 16px;
    }
    .panel-right { padding-left: 8px; overflow-y: auto; }
    .group-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }
    .group-header h4 { margin: 0; font-weight: 500; }
    .group-actions { display: flex; align-items: center; gap: 8px; }
    .empty-reqs {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 200px;
      color: var(--mat-sys-on-surface-variant, #999);
      text-align: center;
    }
    .empty-reqs mat-icon { font-size: 48px; width: 48px; height: 48px; opacity: 0.4; }
    .step-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 24px;
      gap: 12px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RfpStepRequirements {
  private readonly wizard = inject(RfpWizardService);
  private readonly dialog = inject(MatDialog);

  @Input() taskGroups: RfpTaskGroup[] = [];
  @Output() next = new EventEmitter<void>();

  readonly selectedType = signal<DocumentType | null>(null);

  readonly selectedGroup = () => {
    const type = this.selectedType();
    return type ? this.taskGroups.find(g => g.taskType === type) ?? null : null;
  };

  onGroupAdded(group: RfpTaskGroup): void {
    this.taskGroups = [...this.taskGroups, group];
    this.wizard.updateTaskGroups(this.taskGroups);
  }

  removeGroup(taskType: DocumentType): void {
    this.taskGroups = this.taskGroups.filter(g => g.taskType !== taskType);
    this.wizard.updateTaskGroups(this.taskGroups);
    if (this.selectedType() === taskType) {
      this.selectedType.set(this.taskGroups.length > 0 ? this.taskGroups[0].taskType : null);
    }
  }

  addRequirement(): void {
    const type = this.selectedType();
    if (!type) return;

    const group = this.taskGroups.find(g => g.taskType === type);
    if (!group) return;

    const newReq: RfpRequirement = {
      id: crypto.randomUUID(),
      taskType: type,
      title: '',
      evidenceType: 'document',
      priority: 200,
      sortOrder: group.requirements.length,
    };

    this.taskGroups = this.taskGroups.map(g =>
      g.taskType === type
        ? { ...g, requirements: [...g.requirements, newReq] }
        : g,
    );
    this.wizard.updateTaskGroups(this.taskGroups);
  }

  onRequirementUpdated(updated: RfpRequirement): void {
    this.taskGroups = this.taskGroups.map(g =>
      g.taskType === updated.taskType
        ? { ...g, requirements: g.requirements.map(r => r.id === updated.id ? updated : r) }
        : g,
    );
    this.wizard.updateTaskGroups(this.taskGroups);
  }

  onRequirementRemoved(reqId: string): void {
    this.taskGroups = this.taskGroups.map(g => ({
      ...g,
      requirements: g.requirements.filter(r => r.id !== reqId),
    }));
    this.wizard.updateTaskGroups(this.taskGroups);
  }

  openImport(): void {
    const ref = this.dialog.open(RfpImportDialogComponent, {
      width: '640px',
      maxHeight: '80vh',
    });
    ref.afterClosed().subscribe((imported: RfpTaskGroup[] | undefined) => {
      if (imported?.length) {
        this.mergeImportedGroups(imported);
      }
    });
  }

  private mergeImportedGroups(imported: RfpTaskGroup[]): void {
    const merged = [...this.taskGroups];
    for (const group of imported) {
      const existing = merged.find(g => g.taskType === group.taskType);
      if (existing) {
        existing.requirements = [
          ...existing.requirements,
          ...group.requirements.map(r => ({
            ...r,
            id: crypto.randomUUID(),
            sortOrder: existing.requirements.length,
          })),
        ];
      } else {
        merged.push({
          ...group,
          requirements: group.requirements.map((r, i) => ({
            ...r,
            id: crypto.randomUUID(),
            sortOrder: i,
          })),
        });
      }
    }
    this.taskGroups = merged;
    this.wizard.updateTaskGroups(this.taskGroups);
    if (!this.selectedType() && merged.length > 0) {
      this.selectedType.set(merged[0].taskType);
    }
  }
}
