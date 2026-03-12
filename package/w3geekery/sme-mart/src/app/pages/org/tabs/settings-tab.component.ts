import {
  Component, inject, signal, ChangeDetectionStrategy, OnInit, OnDestroy,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { Subscription } from 'rxjs';
import { ZerobiasClientApp } from '@zerobias-com/zerobias-client';

@Component({
  selector: 'app-org-settings-tab',
  standalone: true,
  imports: [MatIconModule, MatDividerModule],
  template: `
    <div class="org-settings">
      <div class="info-card">
        <h3>Organization Details</h3>
        <mat-divider />

        <div class="info-row">
          <span class="info-label">Name</span>
          <span class="info-value">{{ orgName() || '—' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">ID</span>
          <span class="info-value mono">{{ orgId() || '—' }}</span>
        </div>

        <mat-divider />

        <div class="info-notice">
          <mat-icon>info</mat-icon>
          <span>Organization settings are managed through the ZeroBias platform.
            Contact your administrator for changes.</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .org-settings { max-width: 600px; }

    .info-card {
      border: 1px solid var(--mat-sys-outline-variant, #e0e0e0);
      border-radius: 8px;
      padding: 20px;
    }
    .info-card h3 { margin: 0 0 12px; font-size: 16px; font-weight: 500; }

    mat-divider { margin: 12px 0; }

    .info-row {
      display: flex;
      align-items: center;
      padding: 8px 0;
    }
    .info-label {
      width: 80px;
      font-size: 13px;
      font-weight: 500;
      color: var(--mat-sys-on-surface-variant, #666);
    }
    .info-value { font-size: 14px; }
    .info-value.mono { font-family: monospace; font-size: 12px; color: var(--mat-sys-on-surface-variant, #888); }

    .info-notice {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 8px 0 0;
      font-size: 13px;
      color: var(--mat-sys-on-surface-variant, #666);
      mat-icon { font-size: 18px; width: 18px; height: 18px; flex-shrink: 0; margin-top: 1px; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsTab implements OnInit, OnDestroy {
  private readonly app = inject(ZerobiasClientApp);
  private sub?: Subscription;

  readonly orgName = signal('');
  readonly orgId = signal('');

  ngOnInit(): void {
    this.sub = this.app.getCurrentOrg().subscribe(org => {
      if (org) {
        this.orgName.set(org.name || '');
        this.orgId.set(org.id?.toString() || '');
      }
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
