import { Injectable, inject, signal, computed, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ZerobiasClientApp } from '@zerobias-com/zerobias-client';
import { SmeMartDbService } from './sme-mart-db.service';
import { environment } from '../../../environments/environment';

export interface ImpersonationUser {
  id: string;
  zerobias_user_id: string;
  display_name: string;
  email: string | null;
  avatar_url: string | null;
  is_provider: boolean;
  is_buyer: boolean;
  headline: string | null;
  hourly_rate: number | null;
}

const STORAGE_KEY = 'sme-mart.impersonation';

interface StoredImpersonation {
  user: ImpersonationUser;
  effectiveUserId: string;
  effectiveUserName: string;
  effectiveUserEmail: string;
}

/**
 * Dev-only service for impersonating marketplace users.
 *
 * Swaps the effective user identity so components that query
 * by zerobias_user_id see the impersonated user's data.
 * Persists to localStorage so impersonation survives page reloads.
 */
@Injectable({ providedIn: 'root' })
export class ImpersonationService implements OnDestroy {
  private readonly app = inject(ZerobiasClientApp);
  private readonly db = inject(SmeMartDbService);
  private readonly subs = new Subscription();

  /** Whether impersonation feature is available (dev only) */
  readonly enabled = environment.isLocalDev;

  /** All marketplace users for the picker */
  readonly users = signal<ImpersonationUser[]>([]);
  readonly loadingUsers = signal(false);

  /** Currently impersonated user (null = real user) */
  readonly impersonatedUser = signal<ImpersonationUser | null>(null);
  readonly isImpersonating = computed(() => this.impersonatedUser() !== null);

  /** Real platform user info (stashed when impersonating) */
  private realUserId = '';
  private realUserName = '';
  private realUserEmail = '';

  /** Effective user identity — use this instead of whoAmI for user-specific queries */
  readonly effectiveUserId = signal('');
  readonly effectiveUserName = signal('');
  readonly effectiveUserEmail = signal('');
  readonly effectiveInitials = computed(() => this.getInitials(this.effectiveUserName()));

  constructor() {
    // Restore impersonation from localStorage
    this.restoreFromStorage();

    // Sync real platform user into effective signals
    this.subs.add(
      this.app.getWhoAmI().subscribe((whoAmI) => {
        if (whoAmI) {
          this.realUserId = String(whoAmI.id);
          this.realUserName = whoAmI.name || String(whoAmI.email) || 'User';
          this.realUserEmail = String(whoAmI.email) || '';

          // Only update effective if not impersonating
          if (!this.isImpersonating()) {
            this.effectiveUserId.set(this.realUserId);
            this.effectiveUserName.set(this.realUserName);
            this.effectiveUserEmail.set(this.realUserEmail);
          }
        }
      }),
    );
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  async loadUsers(): Promise<void> {
    if (!this.enabled || this.users().length > 0) return;

    this.loadingUsers.set(true);
    try {
      const rows = await this.db.neonQueryPublic<ImpersonationUser>(
        `SELECT
          mu.id,
          mu.zerobias_user_id,
          mu.display_name,
          mu.email,
          mu.avatar_url,
          EXISTS (SELECT 1 FROM provider_profiles pp WHERE pp.user_id = mu.id) AS is_provider,
          EXISTS (SELECT 1 FROM work_requests wr WHERE wr.buyer_user_id = mu.id) AS is_buyer,
          pp.headline,
          pp.hourly_rate
        FROM marketplace_users mu
        LEFT JOIN provider_profiles pp ON pp.user_id = mu.id
        ORDER BY mu.display_name`,
      );
      this.users.set(rows);
    } catch (err) {
      console.warn('[Impersonation] Failed to load users:', err);
    } finally {
      this.loadingUsers.set(false);
    }
  }

  impersonate(user: ImpersonationUser): void {
    this.impersonatedUser.set(user);
    const email = user.email || `${user.zerobias_user_id}@demo.smemart.com`;
    this.effectiveUserId.set(user.zerobias_user_id);
    this.effectiveUserName.set(user.display_name);
    this.effectiveUserEmail.set(email);
    this.saveToStorage({ user, effectiveUserId: user.zerobias_user_id, effectiveUserName: user.display_name, effectiveUserEmail: email });
  }

  stopImpersonating(): void {
    this.impersonatedUser.set(null);
    this.effectiveUserId.set(this.realUserId);
    this.effectiveUserName.set(this.realUserName);
    this.effectiveUserEmail.set(this.realUserEmail);
    this.clearStorage();
  }

  private saveToStorage(data: StoredImpersonation): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch { /* quota exceeded or private browsing — ignore */ }
  }

  private clearStorage(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch { /* ignore */ }
  }

  private restoreFromStorage(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data: StoredImpersonation = JSON.parse(raw);
      if (data?.user?.zerobias_user_id) {
        this.impersonatedUser.set(data.user);
        this.effectiveUserId.set(data.effectiveUserId);
        this.effectiveUserName.set(data.effectiveUserName);
        this.effectiveUserEmail.set(data.effectiveUserEmail);
      }
    } catch {
      this.clearStorage();
    }
  }

  private getInitials(name: string): string {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join('');
  }
}
