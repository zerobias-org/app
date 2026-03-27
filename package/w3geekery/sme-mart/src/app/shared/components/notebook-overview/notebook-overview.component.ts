/**
 * NotebookOverviewComponent — "About this Notebook" panel.
 *
 * Shows metadata, stats, and recent activity for a selected notebook.
 * Displayed in the main content area of the notes panel when triggered
 * from the notebook context menu.
 *
 * Plan 062: Notebook Info Page
 */

import {
  Component, Input, Output, EventEmitter,
  ChangeDetectionStrategy, signal, computed, inject, OnChanges,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NoteHierarchyService, type FolderTreeNode } from '../../../core/services/note-hierarchy.service';
import { GraphqlReadService } from '../../../core/services/graphql-read.service';
import type { NoteFolderWithCounts } from '../../../core/models';

export interface NotebookStats {
  totalNotes: number;
  totalFolders: number;
  meetingMinutesCount: number;
  recentNotes: Array<{ id: string; title: string; updatedAt: string }>;
  lastActivityAt: string | null;
}

@Component({
  selector: 'app-notebook-overview',
  standalone: true,
  imports: [
    DatePipe,
    MatCardModule, MatIconModule, MatButtonModule,
    MatChipsModule, MatDividerModule, MatProgressSpinnerModule,
  ],
  templateUrl: './notebook-overview.component.html',
  styleUrl: './notebook-overview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotebookOverview implements OnChanges {
  private readonly hierarchy = inject(NoteHierarchyService);
  private readonly graphqlRead = inject(GraphqlReadService);

  private readonly _notebookNode = signal<FolderTreeNode | null>(null);
  private readonly _engagementId = signal('');

  @Input({ required: true })
  set notebookNode(value: FolderTreeNode | null) { this._notebookNode.set(value); }

  @Input({ required: true })
  set engagementId(value: string) { this._engagementId.set(value); }

  @Output() close = new EventEmitter<void>();
  @Output() navigateToNote = new EventEmitter<string>();

  readonly loading = signal(true);
  readonly stats = signal<NotebookStats | null>(null);

  readonly notebook = computed(() => this._notebookNode()?.folder ?? null);
  readonly notebookName = computed(() => this.notebook()?.name ?? '');
  readonly notebookDescription = computed(() => this.notebook()?.description ?? null);
  readonly notebookColor = computed(() => this.notebook()?.color ?? null);
  readonly accessLevel = computed(() => this.notebook()?.access_level ?? 'boundary');
  readonly createdAt = computed(() => this.notebook()?.created_at ?? null);

  readonly accessLabel = computed(() => {
    switch (this.accessLevel()) {
      case 'personal': return 'Personal';
      case 'project': return 'Project';
      default: return 'Boundary';
    }
  });

  readonly accessIcon = computed(() => {
    switch (this.accessLevel()) {
      case 'personal': return 'lock';
      case 'project': return 'business';
      default: return 'groups';
    }
  });

  readonly accessTooltip = computed(() => {
    switch (this.accessLevel()) {
      case 'personal': return 'Only visible to you';
      case 'project': return 'Visible to project members';
      default: return 'Visible to all boundary users';
    }
  });

  ngOnChanges(): void {
    this.loadStats();
  }

  async loadStats(): Promise<void> {
    const node = this._notebookNode();
    const engId = this._engagementId();
    if (!node || !engId) return;

    this.loading.set(true);
    try {
      // Count totals recursively from the tree node
      const totalNotes = this.countNotesRecursive(node);
      const totalFolders = this.countFoldersRecursive(node);

      // Query recent notes in this notebook's folder tree
      const folderIds = this.collectFolderIds(node);
      const recentNotes = await this.queryRecentNotes(engId, folderIds);
      const meetingMinutesCount = await this.queryMeetingMinutesCount(engId, folderIds);

      const lastActivityAt = recentNotes.length > 0 ? recentNotes[0].updatedAt : null;

      this.stats.set({
        totalNotes,
        totalFolders,
        meetingMinutesCount,
        recentNotes: recentNotes.slice(0, 5),
        lastActivityAt,
      });
    } catch (err) {
      console.error('[NotebookOverview] Failed to load stats:', err);
      this.stats.set({
        totalNotes: this.countNotesRecursive(node),
        totalFolders: this.countFoldersRecursive(node),
        meetingMinutesCount: 0,
        recentNotes: [],
        lastActivityAt: null,
      });
    } finally {
      this.loading.set(false);
    }
  }

  onNoteClick(noteId: string): void {
    this.navigateToNote.emit(noteId);
  }

  // ── Private helpers ──

  private countNotesRecursive(node: FolderTreeNode): number {
    let count = node.folder.note_count ?? 0;
    for (const child of node.children) {
      count += this.countNotesRecursive(child);
    }
    return count;
  }

  private countFoldersRecursive(node: FolderTreeNode): number {
    let count = node.children.length;
    for (const child of node.children) {
      count += this.countFoldersRecursive(child);
    }
    return count;
  }

  private collectFolderIds(node: FolderTreeNode): string[] {
    const ids = [node.folder.id];
    for (const child of node.children) {
      ids.push(...this.collectFolderIds(child));
    }
    return ids;
  }

  private async queryRecentNotes(
    engagementId: string,
    folderIds: string[],
  ): Promise<Array<{ id: string; title: string; updatedAt: string }>> {
    // Query all notes in the engagement, then filter client-side to folder IDs
    // (GQL doesn't support IN operator for folderIds)
    const result = await this.graphqlRead.query<{
      id: string;
      name: string;
      folderId: string | null;
      archived: boolean;
      dateLastModified: string;
    }>(
      'Note',
      ['id', 'name', 'folderId', 'archived', 'dateLastModified'],
      {
        filters: {
          engagementId: `.eq.${engagementId}`,
          archived: '.eq.false',
        },
        pageSize: 200,
      },
    );

    const folderSet = new Set(folderIds);
    return result.items
      .filter(n => n.folderId && folderSet.has(n.folderId))
      .sort((a, b) => new Date(b.dateLastModified).getTime() - new Date(a.dateLastModified).getTime())
      .map(n => ({
        id: n.id,
        title: n.name || 'Untitled',
        updatedAt: n.dateLastModified,
      }));
  }

  private async queryMeetingMinutesCount(
    engagementId: string,
    folderIds: string[],
  ): Promise<number> {
    try {
      const result = await this.graphqlRead.query<{
        id: string;
        folderId: string | null;
        isMeetingMinutes: boolean;
      }>(
        'Note',
        ['id', 'folderId', 'isMeetingMinutes'],
        {
          filters: {
            engagementId: `.eq.${engagementId}`,
            isMeetingMinutes: '.eq.true',
            archived: '.eq.false',
          },
          pageSize: 500,
        },
      );

      const folderSet = new Set(folderIds);
      return result.items.filter(n => n.folderId && folderSet.has(n.folderId)).length;
    } catch {
      return 0;
    }
  }
}
