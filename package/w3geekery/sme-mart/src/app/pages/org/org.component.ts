import {
  Component, inject, signal, ChangeDetectionStrategy, OnInit, OnDestroy,
} from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { Subscription } from 'rxjs';
import { ZerobiasClientApp } from '@zerobias-com/zerobias-client';

interface OrgTab {
  label: string;
  icon: string;
  path: string;
}

@Component({
  selector: 'app-org-page',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatTabsModule, MatIconModule],
  template: `
    <div class="org-page">
      <header class="org-header">
        <h1>{{ orgName() }}</h1>
        <p class="org-subtitle">Organization Management</p>
      </header>

      <nav mat-tab-nav-bar [tabPanel]="tabPanel" mat-stretch-tabs="false">
        @for (tab of tabs; track tab.path) {
          <a mat-tab-link
            [routerLink]="tab.path"
            routerLinkActive
            #rla="routerLinkActive"
            [active]="rla.isActive">
            <mat-icon class="tab-icon">{{ tab.icon }}</mat-icon>
            {{ tab.label }}
          </a>
        }
      </nav>

      <mat-tab-nav-panel #tabPanel>
        <div class="tab-content">
          <router-outlet />
        </div>
      </mat-tab-nav-panel>
    </div>
  `,
  styles: [`
    .org-page { padding: 24px; max-width: 1200px; margin: 0 auto; }
    .org-header { margin-bottom: 16px; }
    .org-header h1 { margin: 0; font-size: 24px; font-weight: 500; }
    .org-subtitle {
      margin: 4px 0 0;
      font-size: 14px;
      color: var(--mat-sys-on-surface-variant, #666);
    }
    .tab-icon { margin-right: 6px; font-size: 20px; width: 20px; height: 20px; }
    .tab-content { padding: 24px 0; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrgPage implements OnInit, OnDestroy {
  private readonly app = inject(ZerobiasClientApp);
  private sub?: Subscription;

  readonly orgName = signal('Organization');

  readonly tabs: OrgTab[] = [
    { label: 'Documents', icon: 'folder', path: 'documents' },
    { label: 'Engagements', icon: 'work', path: 'engagements' },
    { label: 'Projects', icon: 'assignment', path: 'projects' },
    { label: 'Members', icon: 'people', path: 'members' },
    { label: 'Settings', icon: 'settings', path: 'settings' },
    { label: 'Corporate Profile', icon: 'business', path: 'profile' },
  ];

  ngOnInit(): void {
    this.sub = this.app.getCurrentOrg().subscribe(org => {
      if (org?.name) {
        this.orgName.set(org.name);
      }
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
