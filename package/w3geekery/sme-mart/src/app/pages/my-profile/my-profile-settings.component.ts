import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { UserPreferencesService } from '../../core/services/user-preferences.service';
import type { UserRole } from '../../core/models';

type ThemePreference = 'light' | 'dark' | 'system';

@Component({
  selector: 'app-my-profile-settings',
  standalone: true,
  imports: [MatCardModule, MatButtonToggleModule, MatIconModule],
  templateUrl: './my-profile-settings.component.html',
  styleUrl: './my-profile-settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyProfileSettings {
  private readonly prefs = inject(UserPreferencesService);

  readonly userRole = this.prefs.userRole;
  readonly themePref = this.prefs.themePreference;

  onRoleChange(role: UserRole): void {
    this.prefs.setUserRole(role);
  }

  onThemeChange(pref: ThemePreference): void {
    this.prefs.setThemePreference(pref);
  }
}
