import { Component, ChangeDetectionStrategy, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';

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
  private readonly router = inject(Router);

  readonly provider = input.required<{ id: string; display_name?: string; headline?: string; avatar_url?: string; rating_average?: string; total_jobs_completed?: number; skills?: string; role_count?: number; review_count?: number }>();

  readonly displayName = computed(() => this.provider()?.display_name || '');
  readonly headline = computed(() => this.provider()?.headline || '');
  readonly initials = computed(() => {
    const name = this.displayName();
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join('');
  });
  readonly avatarUrl = computed(() => this.provider()?.avatar_url || null);
  readonly rating = computed(() => {
    const r = this.provider()?.rating_average;
    return r ? parseFloat(r) : null;
  });
  readonly jobsCompleted = computed(() => this.provider()?.total_jobs_completed || 0);
  readonly topSkills = computed(() => {
    try {
      const raw = this.provider()?.skills;
      if (!raw) return [];
      const parsed: ParsedSkill[] = JSON.parse(raw);
      return parsed.slice(0, 3).map((s) => s.skill_name);
    } catch {
      return [];
    }
  });
  readonly roleCount = computed(() => this.provider()?.role_count || 0);
  readonly reviewCount = computed(() => this.provider()?.review_count || 0);

  navigate(): void {
    const provider = this.provider();
    if (provider) {
      this.router.navigate(['/providers', provider.id]);
    }
  }
}
