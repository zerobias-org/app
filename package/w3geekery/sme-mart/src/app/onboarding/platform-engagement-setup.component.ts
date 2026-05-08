import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/**
 * PlatformEngagementSetupComponent — holding page shown to users whose org
 * does not yet have a provisioned platform engagement.
 *
 * The guard routes here when the hydra marketplace tag for the user's org is
 * not found. Provisioning is admin-only (current scope) and is triggered from
 * the SME Mart admin Provisioning tab. End users wait here until a ZeroBias
 * admin has provisioned their org, then click Refresh.
 *
 * No spinner, no auto-poll, no auto-create. Just an informational surface.
 */
@Component({
  selector: 'app-platform-engagement-setup',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './platform-engagement-setup.component.html',
  styleUrls: ['./platform-engagement-setup.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlatformEngagementSetupComponent {
  refresh(): void {
    // Re-fires the onboardingGuard on next nav. Cheaper than full reload and
    // doesn't lose any session state.
    window.location.reload();
  }
}
