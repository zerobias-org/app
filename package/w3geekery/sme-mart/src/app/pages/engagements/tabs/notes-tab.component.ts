import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { NotesPanel } from '../../../shared/components/notes-panel/notes-panel.component';
import { EngagementContextService } from '../../../core/services/engagement-context.service';

@Component({
  selector: 'app-notes-tab',
  standalone: true,
  imports: [NotesPanel],
  template: `
    @if (engagementId) {
      <app-notes-panel [engagementId]="engagementId"></app-notes-panel>
    }
  `,
  styles: `:host { display: flex; flex-direction: column; flex: 1; min-height: 0; }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotesTab {
  private readonly ctx = inject(EngagementContextService);

  readonly engagementId = this.ctx.engagement()?.id || '';
}
