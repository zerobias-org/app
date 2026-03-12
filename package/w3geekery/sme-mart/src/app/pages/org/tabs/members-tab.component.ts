import {
  Component, inject, signal, ChangeDetectionStrategy, OnInit, OnDestroy,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Subscription } from 'rxjs';
import { ZerobiasClientApp } from '@zerobias-com/zerobias-client';

@Component({
  selector: 'app-org-members-tab',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  template: `
    <div class="members-stub">
      <div class="stub-card">
        <mat-icon class="stub-icon">people</mat-icon>
        <h3>Members of {{ orgName() || 'this organization' }}</h3>
        <p>Member management will be available when the ZeroBias org member APIs are integrated.</p>
        <p class="hint">Organization membership is currently managed through the ZeroBias platform portal.</p>
      </div>
    </div>
  `,
  styles: [`
    .members-stub { max-width: 600px; }

    .stub-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 48px 24px;
      border: 1px solid var(--mat-sys-outline-variant, #e0e0e0);
      border-radius: 8px;
    }
    .stub-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: var(--mat-sys-on-surface-variant, #999);
      margin-bottom: 12px;
    }
    h3 { margin: 0 0 8px; font-weight: 500; }
    p { margin: 0 0 4px; font-size: 14px; color: var(--mat-sys-on-surface-variant, #666); max-width: 400px; }
    .hint { font-size: 12px; margin-top: 8px; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MembersTab implements OnInit, OnDestroy {
  private readonly app = inject(ZerobiasClientApp);
  private sub?: Subscription;

  readonly orgName = signal('');

  ngOnInit(): void {
    this.sub = this.app.getCurrentOrg().subscribe(org => {
      if (org?.name) this.orgName.set(org.name);
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
