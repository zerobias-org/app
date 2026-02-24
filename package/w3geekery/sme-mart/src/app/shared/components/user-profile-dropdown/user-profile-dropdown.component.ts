import { Component, inject, signal, ChangeDetectionStrategy, OnInit, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { Subscription } from 'rxjs';
import { ZerobiasClientApp } from '@zerobias-com/zerobias-client';
import { ZbAvatarLabelComponent } from '@zerobias-org/ngx-library';
import { ImpersonationService } from '../../../core/services/impersonation.service';

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
  ],
  templateUrl: './user-profile-dropdown.component.html',
  styleUrl: './user-profile-dropdown.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserProfileDropdown implements OnInit, OnDestroy {
  private readonly app = inject(ZerobiasClientApp);
  readonly impersonation = inject(ImpersonationService);
  private readonly subs = new Subscription();

  readonly userName = this.impersonation.effectiveUserName;
  readonly userEmail = this.impersonation.effectiveUserEmail;
  readonly avatarUrl = this.impersonation.effectiveAvatarUrl;
  readonly orgName = signal('');

  ngOnInit() {
    this.subs.add(
      this.app.getCurrentOrg().subscribe((org) => {
        if (org) {
          this.orgName.set(org.name || '');
        }
      }),
    );
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
