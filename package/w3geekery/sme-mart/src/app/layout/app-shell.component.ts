import { Component, inject, signal, ChangeDetectionStrategy, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { Subscription } from 'rxjs';
import { UserProfileDropdown } from '../shared/components/user-profile-dropdown/user-profile-dropdown.component';
import { NotificationPanel } from '../shared/components/notification-panel/notification-panel.component';
import { ImpersonationSwitcher } from '../shared/components/impersonation-switcher/impersonation-switcher.component';
import { ImpersonationService } from '../core/services/impersonation.service';
import { DemoModeService } from '../core/services/demo-mode.service';
import { UserPreferencesService } from '../core/services/user-preferences.service';
import { CatalogService } from '../core/services/catalog.service';

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    UserProfileDropdown,
    NotificationPanel,
    ImpersonationSwitcher,
  ],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShell implements OnInit, OnDestroy {
  private readonly breakpoint = inject(BreakpointObserver);
  private readonly prefs = inject(UserPreferencesService);
  private readonly catalog = inject(CatalogService);
  readonly impersonation = inject(ImpersonationService);
  readonly demoMode = inject(DemoModeService);
  private readonly subs = new Subscription();

  readonly isMobile = signal(false);
  readonly mobileMenuOpen = signal(false);

  readonly navItems: NavItem[] = [
    { label: 'Services', path: '/services', icon: 'storefront' },
    { label: 'RFPs', path: '/rfps', icon: 'assignment' },
  ];

  ngOnInit() {
    this.subs.add(
      this.breakpoint.observe([Breakpoints.Handset]).subscribe((result) => {
        this.isMobile.set(result.matches);
        if (!result.matches) this.mobileMenuOpen.set(false);
      }),
    );

    // Load user preferences and catalog data (non-blocking)
    this.prefs.loadPreferences().catch(() => {});
    this.catalog.loadAll().catch(() => {});
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((v) => !v);
  }
}
