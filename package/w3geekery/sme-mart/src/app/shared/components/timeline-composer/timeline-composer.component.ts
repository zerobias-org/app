import {
  Component, Input, Output, EventEmitter,
  ChangeDetectionStrategy, signal, inject,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { EngagementTimelineService } from '../../../core/services/engagement-timeline.service';
import { MarkdownEditor } from '../markdown-editor/markdown-editor.component';
import type { TimelineEvent } from '../../../core/models';

@Component({
  selector: 'app-timeline-composer',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatSnackBarModule, MarkdownEditor],
  templateUrl: './timeline-composer.component.html',
  styleUrl: './timeline-composer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimelineComposer {
  private readonly timelineService = inject(EngagementTimelineService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly _taskId = signal<string | null>(null);

  @Input({ required: true })
  set taskId(value: string) { this._taskId.set(value); }

  @Output() commentPosted = new EventEmitter<TimelineEvent>();

  readonly composerOpen = signal(false);
  readonly commentText = signal('');
  readonly submitting = signal(false);

  toggleComposer(): void {
    this.composerOpen.update(v => !v);
    if (!this.composerOpen()) this.commentText.set('');
  }

  async submit(): Promise<void> {
    const text = this.commentText().trim();
    const taskId = this._taskId();
    if (!text || !taskId) return;

    this.submitting.set(true);
    try {
      const event = await this.timelineService.postComment(taskId, text);
      this.commentPosted.emit(event);
      this.commentText.set('');
      this.composerOpen.set(false);
      this.snackBar.open('Comment posted', 'OK', { duration: 3000 });
    } catch (err: any) {
      this.snackBar.open(`Failed to post comment: ${err.message || 'Unknown error'}`, 'Dismiss', { duration: 5000 });
    } finally {
      this.submitting.set(false);
    }
  }
}
