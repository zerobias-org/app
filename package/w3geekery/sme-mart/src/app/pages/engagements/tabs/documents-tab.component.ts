import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { DocumentListComponent } from '../../../shared/components/document-list/document-list.component';
import { EngagementContextService } from '../../../core/services/engagement-context.service';

@Component({
  selector: 'app-documents-tab',
  standalone: true,
  imports: [DocumentListComponent],
  template: `
    @if (engagementId) {
      <app-document-list
        [engagementId]="engagementId"
        [isOwner]="isOwner"
        (showRelatedNotes)="onShowRelatedNotes($event)">
      </app-document-list>
    }
  `,
  styles: `:host { display: flex; flex-direction: column; flex: 1; min-height: 0; }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentsTab {
  private readonly ctx = inject(EngagementContextService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly engagementId = this.ctx.engagement()?.id || '';
  readonly isOwner = this.ctx.isOwner();

  onShowRelatedNotes(docId: string): void {
    this.router.navigate(['../notes'], {
      relativeTo: this.route,
      queryParams: { linkedDoc: docId },
    });
  }
}
