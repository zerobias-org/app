import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ImpersonationService, ImpersonationUser } from '../../../core/services/impersonation.service';

@Component({
  selector: 'app-impersonation-switcher',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './impersonation-switcher.component.html',
  styleUrl: './impersonation-switcher.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImpersonationSwitcher {
  readonly impersonation = inject(ImpersonationService);
  readonly drawerOpen = signal(false);

  async toggleDrawer(): Promise<void> {
    const wasOpen = this.drawerOpen();
    this.drawerOpen.set(!wasOpen);
    if (!wasOpen) {
      await this.impersonation.loadUsers();
    }
  }

  selectUser(user: ImpersonationUser): void {
    this.impersonation.impersonate(user);
    this.drawerOpen.set(false);
  }

  getInitials(name: string): string {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join('');
  }
}
