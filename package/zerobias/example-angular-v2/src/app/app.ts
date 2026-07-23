import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';

import { NAV_ITEMS } from './core/nav';
import { UserMenu } from './shell/user-menu/user-menu';

/**
 * App shell — a fixed side rail of demo links + a content area, with a top toolbar carrying the
 * brand and the account menu. Standalone + OnPush. The account menu (`app-user-menu`) owns the org
 * switcher, the theme toggle, Create API Key, and Sign out — mirroring the React app's `Header`,
 * which is likewise just brand + `UserMenu`.
 */
@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    UserMenu,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly navItems = NAV_ITEMS;
}
