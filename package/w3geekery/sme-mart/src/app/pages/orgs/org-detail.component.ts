import {
  Component, inject, signal, computed, ChangeDetectionStrategy, OnInit,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ZbSimplePanelComponent, ZbAvatarLabelComponent } from '@zerobias-org/ngx-library';
import { ZerobiasClientApp } from '@zerobias-com/zerobias-client';
import { map } from 'rxjs';

interface OrgInfo {
  id: string;
  name: string;
  description?: string;
}

interface OrgMember {
  id: string;
  display_name?: string;
  email?: string;
  role?: string;
}

interface OrgGroup {
  id: string;
  name: string;
  memberCount?: number;
}

interface OrgDetail {
  org: OrgInfo | null;
  members: OrgMember[];
  groups: OrgGroup[];
  boundaries: any[];
}

@Component({
  selector: 'app-org-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatTooltipModule,
    ZbSimplePanelComponent,
    ZbAvatarLabelComponent,
  ],
  templateUrl: './org-detail.component.html',
  styleUrl: './org-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrgDetailComponent implements OnInit {
  private readonly app = inject(ZerobiasClientApp);
  private readonly route = inject(ActivatedRoute);

  readonly orgId = toSignal(
    this.route.paramMap.pipe(map(p => p.get('orgId') || '')),
    { initialValue: '' }
  );

  readonly currentOrgId = signal<string | null>(null);

  readonly isCurrent = computed(() => this.currentOrgId() === this.orgId());

  // Stub data until proper API is available
  readonly orgData = signal<OrgDetail>({
    org: null,
    members: [],
    groups: [],
    boundaries: [],
  });

  // Computed signals for template
  readonly org = computed(() => this.orgData().org);
  readonly members = computed(() => this.orgData().members);
  readonly groups = computed(() => this.orgData().groups);
  readonly boundaries = computed(() => this.orgData().boundaries);

  ngOnInit(): void {
    // Get current org ID
    try {
      const currentId = this.app.getCurrentOrgId();
      this.currentOrgId.set(currentId || null);
    } catch {
      this.currentOrgId.set(null);
    }

    // TODO: Load org data using proper API when available
    // For now, leave data empty (stub per FLAG-3)
  }

  goToOrgProfile(): void {
    // Navigation handled by template routerLink
  }
}
