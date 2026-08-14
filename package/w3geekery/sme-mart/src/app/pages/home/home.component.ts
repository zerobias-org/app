import { Component, inject, signal, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ZbSearchInputComponent } from '@zerobias-org/ngx-library';
import { CategoriesService } from '../../core/services/categories.service';
import type { Category } from '../../core/models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    ZbSearchInputComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home implements OnInit {
  private readonly router = inject(Router);
  private readonly categoriesService = inject(CategoriesService);

  readonly categories = signal<Category[]>([]);

  readonly categoryIcons: Record<string, string> = {
    assessors: 'verified_user',
    advisors: 'support_agent',
    agentic: 'smart_toy',
    secops: 'security',
    devsecops: 'integration_instructions',
    training: 'school',
    engineering: 'engineering',
    'data-entry': 'edit_note',
  };

  async ngOnInit() {
    try {
      await this.categoriesService.loadCategories();
      this.categories.set(this.categoriesService.getRootCategories().slice(0, 6));
    } catch (err) {
      console.warn('[Home] Failed to load:', err);
    }
  }

  onSearch(term: string | null): void {
    if (term) {
      this.router.navigate(['/vendors'], { queryParams: { q: term } });
    }
  }

  onCategoryClick(category: Category): void {
    this.router.navigate(['/services'], { queryParams: { category: category.id } });
  }

  getCategoryIcon(slug: string): string {
    return this.categoryIcons[slug] || 'category';
  }

  goToBuyer(): void {
    this.router.navigate(['/org']);
  }

  goToVendor(): void {
    this.router.navigate(['/my-profile']);
  }

  goToProfileSettings(): void {
    this.router.navigate(['/my-profile']);
  }
}
