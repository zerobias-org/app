import { inject, Injectable, signal } from '@angular/core';
import type { Subscription } from 'rxjs';
import type { Org, WhoAmI } from '@zerobias-com/dana-sdk';
import type { ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import { ZerobiasAppService } from './zerobias-app.service';

/**
 * Session state as signals — the Angular counterpart of the React `SessionProvider`. `user` / `org`
 * are sourced from the client's RxJS streams (`app.getWhoAmI()`, `app.getCurrentOrg()`); `api` is
 * the direct SDK handle every feature component reads. `connect()` is called once from the
 * APP_INITIALIZER, after `ZerobiasAppService.init()` has resolved.
 */
@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly zb = inject(ZerobiasAppService);
  private readonly subs: Subscription[] = [];

  /** True once the client has initialized and the streams are wired. */
  readonly ready = signal(false);
  readonly user = signal<WhoAmI | undefined>(undefined);
  readonly org = signal<Org | undefined>(undefined);
  /** Direct SDK access for feature components. Undefined until ready. */
  readonly api = signal<ZerobiasClientApi | undefined>(undefined);

  /** Wire the streams. Call once, after the client's init() has resolved. */
  connect(): void {
    if (this.ready()) return;
    this.api.set(this.zb.api);
    this.subs.push(this.zb.app.getWhoAmI().subscribe((u) => this.user.set(u)));
    this.subs.push(this.zb.app.getCurrentOrg().subscribe((o) => this.org.set(o)));
    this.ready.set(true);
  }

  async selectOrg(next: Org): Promise<void> {
    await this.zb.app.selectOrg(next);
  }

  logout(): void {
    this.zb.app.onLogout();
  }
}
