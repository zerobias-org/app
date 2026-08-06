import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';

/**
 * Shared context for the project detail layout and its child route tabs.
 *
 * The project slot itself is GONE — SmeMartProject was retired and the ProjectDetail
 * parent that pushed into it is deleted. What survives is the ambient context the
 * live surfaces actually read: isAdmin (onboarding guard, board-detail),
 * engagementId, currentUserId, and the refresh channel.
 */
@Injectable({ providedIn: 'root' })
export class ProjectContextService {
  // --- writable state (set by parent) ---
  private readonly _engagementId = signal<string | null>(null);
  private readonly _engagementName = signal<string | null>(null);
  private readonly _currentUserId = signal<string | null>(null);
  private readonly _isAdmin = signal(false);

  // --- public readonly signals (read by children) ---
  readonly engagementId = this._engagementId.asReadonly();
  readonly engagementName = this._engagementName.asReadonly();
  readonly currentUserId = this._currentUserId.asReadonly();
  readonly isAdmin = this._isAdmin.asReadonly();

  // --- refresh notification (child → parent → all children) ---
  private readonly _refresh$ = new Subject<void>();
  readonly refresh$ = this._refresh$.asObservable();

  // --- setters (called by parent) ---

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
    this._engagementId.set(null);
    this._engagementName.set(null);
    this._currentUserId.set(null);
    this._isAdmin.set(false);
  }
}
