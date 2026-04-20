import { Injectable, signal, computed } from '@angular/core';
import { Subject } from 'rxjs';
import type { SmeMartProject } from '../models';

/**
 * Shared context for the project detail layout and its child route tabs.
 *
 * The parent (ProjectDetail) loads project data and pushes it here.
 * Child tab components inject this service and read signals.
 */
@Injectable({ providedIn: 'root' })
export class ProjectContextService {
  // --- writable state (set by parent) ---
  private readonly _project = signal<SmeMartProject | null>(null);
  private readonly _engagementId = signal<string | null>(null);
  private readonly _engagementName = signal<string | null>(null);
  private readonly _currentUserId = signal<string | null>(null);
  private readonly _isAdmin = signal(false);

  // --- public readonly signals (read by children) ---
  readonly project = this._project.asReadonly();
  readonly engagementId = this._engagementId.asReadonly();
  readonly engagementName = this._engagementName.asReadonly();
  readonly currentUserId = this._currentUserId.asReadonly();
  readonly isAdmin = this._isAdmin.asReadonly();

  readonly projectName = computed(() => this.project()?.name ?? '');
  readonly status = computed(() => this.project()?.status ?? 'draft');

  readonly statusColor = computed(() => {
    const colorMap: Record<string, string> = {
      draft: 'default',
      active: 'primary',
      completed: 'primary',
      cancelled: 'warn',
      archived: 'default',
    };
    return colorMap[this.status()] || 'default';
  });

  // --- refresh notification (child → parent → all children) ---
  private readonly _refresh$ = new Subject<void>();
  readonly refresh$ = this._refresh$.asObservable();

  // --- setters (called by parent) ---

  setProject(project: SmeMartProject | null): void {
    this._project.set(project);
  }

  setEngagement(id: string | null, name: string | null): void {
    this._engagementId.set(id);
    this._engagementName.set(name);
  }

  setCurrentUserId(userId: string | null): void {
    this._currentUserId.set(userId);
  }

  setIsAdmin(isAdmin: boolean): void {
    this._isAdmin.set(isAdmin);
  }

  /** Child components call this to request a data refresh from the parent. */
  requestRefresh(): void {
    this._refresh$.next();
  }

  /** Reset all state (called when parent destroys). */
  clear(): void {
    this._project.set(null);
    this._engagementId.set(null);
    this._engagementName.set(null);
    this._currentUserId.set(null);
    this._isAdmin.set(false);
  }
}
