import { Component, inject, signal, ChangeDetectionStrategy, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { Subscription } from 'rxjs';
import { ZerobiasClientApp } from '@zerobias-com/zerobias-client';
import { ZbAvatarLabelComponent, ZbStaticImageUrlPipe, ZbImgDefaultDirective } from '@zerobias-org/ngx-library';
import { ImpersonationService } from '../../../core/services/impersonation.service';
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
  readonly impersonation = inject(ImpersonationService);
  readonly orgSwitcher = inject(OrgSwitcherService);
  private readonly subs = new Subscription();

  readonly userName = this.impersonation.effectiveUserName;
  readonly userEmail = this.impersonation.effectiveUserEmail;
  readonly avatarUrl = this.impersonation.effectiveAvatarUrl;
  readonly orgName = signal('');
  readonly switchableOrgs = this.orgSwitcher.orgs$;
  readonly currentOrgId = signal('');

  @ViewChild('orgMenu') orgMenu?: MatMenuTrigger;

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
