import { Component, Input, ChangeDetectionStrategy, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import type { ProviderDirectoryRow } from '../../../core/models';

export interface ParsedSkill {
  skill_name: string;
  zerobias_skill_id: string;
}

@Component({
  selector: 'app-provider-card',
  standalone: true,
  imports: [MatCardModule, MatChipsModule, MatIconModule],
  templateUrl: './provider-card.component.html',
  styleUrl: './provider-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProviderCard {
  private readonly _provider = signal<ProviderDirectoryRow | null>(null);

  @Input({ required: true })
  set provider(value: ProviderDirectoryRow) {
    this._provider.set(value);
  }

  readonly displayName = computed(() => this._provider()?.display_name || '');
  readonly headline = computed(() => this._provider()?.headline || '');
  readonly initials = computed(() => {
    const name = this.displayName();
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join('');
  });
  readonly avatarUrl = computed(() => this._provider()?.avatar_url || null);
  readonly rating = computed(() => {
    const r = this._provider()?.rating_average;
    return r ? parseFloat(r) : null;
  });
  readonly jobsCompleted = computed(() => this._provider()?.total_jobs_completed || 0);
  readonly topSkills = computed(() => {
    try {
      const raw = this._provider()?.skills;
      if (!raw) return [];
      const parsed: ParsedSkill[] = JSON.parse(raw);
      return parsed.slice(0, 3).map((s) => s.skill_name);
    } catch {
      return [];
    }
  });
  readonly roleCount = computed(() => this._provider()?.role_count || 0);
  readonly reviewCount = computed(() => this._provider()?.review_count || 0);

  constructor(private readonly router: Router) {}

  navigate(): void {
    const provider = this._provider();
    if (provider) {
      this.router.navigate(['/providers', provider.id]);
    }
  }
}
