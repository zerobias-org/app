import { Component, inject, signal, computed, ChangeDetectionStrategy, OnInit, OnDestroy } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { Subscription } from 'rxjs';
import { ZerobiasClientApp } from '@zerobias-com/zerobias-client';
import { ZbAvatarLabelComponent, ZbStaticImageUrlPipe, ZbImgDefaultDirective } from '@zerobias-org/ngx-library';
import { OrgSwitcherService } from '../../../core/services/org-switcher.service';
import type { dana } from '@zerobias-com/zerobias-sdk';

@Component({
  selector: 'app-user-profile-dropdown',
  standalone: true,
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    ZbAvatarLabelComponent,
    ZbStaticImageUrlPipe,
    ZbImgDefaultDirective,
  ],
  templateUrl: './user-profile-dropdown.component.html',
  styleUrl: './user-profile-dropdown.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserProfileDropdown implements OnInit, OnDestroy {
  private readonly app = inject(ZerobiasClientApp);
  readonly orgSwitcher = inject(OrgSwitcherService);
  private readonly subs = new Subscription();

  private readonly whoAmI = toSignal(this.app.getWhoAmI(), { initialValue: null });

  // Same precedence the impersonation service used for the real user, so the
  // dropdown does not regress to blank when name or email is absent.
  readonly userName = computed(() => {
    const who = this.whoAmI();
    return who ? (who.name || String(who.email) || 'User') : '';
  });
  readonly userEmail = computed(() => String(this.whoAmI()?.email ?? ''));
  readonly avatarUrl = computed(() => {
    const url = this.whoAmI()?.avatarUrl;
    return url ? String(url) : '';
  });
  readonly orgName = signal('');
  readonly switchableOrgs = this.orgSwitcher.orgs$;
  readonly currentOrgId = signal('');

  ngOnInit() {
    this.subs.add(
      this.app.getCurrentOrg().subscribe((org) => {
        if (org) {
          this.orgName.set(org.name || '');
          this.currentOrgId.set(`${org.id}`);
        }
      }),
    );
  }

  /**
   * Handle org selection from the switcher submenu
   */
  onSelectOrg(org: dana.Org): void {
    this.orgSwitcher.switchTo(org);
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
