import { Component, inject, signal, computed, ChangeDetectionStrategy, OnInit, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TitleCasePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Subscription } from 'rxjs';
import { ZerobiasClientApp } from '@zerobias-com/zerobias-client';
import { ZbThemeService } from '@zerobias-org/ngx-library';
import { UserPreferencesService } from '../../../core/services/user-preferences.service';
import { ImpersonationService } from '../../../core/services/impersonation.service';
import type { UserRole } from '../../../core/models';

@Component({
  selector: 'app-user-profile-dropdown',
  standalone: true,
  imports: [
    RouterLink,
    TitleCasePipe,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    MatSlideToggleModule,
  ],
  templateUrl: './user-profile-dropdown.component.html',
  styleUrl: './user-profile-dropdown.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserProfileDropdown implements OnInit, OnDestroy {
  private readonly app = inject(ZerobiasClientApp);
  private readonly theme = inject(ZbThemeService);
  private readonly prefs = inject(UserPreferencesService);
  readonly impersonation = inject(ImpersonationService);
  private readonly subs = new Subscription();

  readonly userName = this.impersonation.effectiveUserName;
  readonly userEmail = this.impersonation.effectiveUserEmail;
  readonly orgName = signal('');
  readonly initials = this.impersonation.effectiveInitials;

  readonly userRole = this.prefs.userRole;
  readonly isProvider = computed(() => this.userRole() === 'provider' || this.userRole() === 'both');

  readonly themeIcon = computed(() => {
    const pref = this.theme.preference;
    if (pref === 'dark') return 'dark_mode';
    if (pref === 'light') return 'light_mode';
    return 'contrast';
  });

  readonly themeLabel = computed(() => {
    const pref = this.theme.preference;
    if (pref === 'dark') return 'Dark';
    if (pref === 'light') return 'Light';
    return 'System';
  });

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

  toggleRole(): void {
    const current = this.userRole();
    const next: UserRole = current === 'buyer' ? 'provider' : current === 'provider' ? 'both' : 'buyer';
    this.prefs.setUserRole(next);
  }

  cycleTheme(event: MouseEvent): void {
    event.stopPropagation();
    this.theme.cycle();
  }
}
