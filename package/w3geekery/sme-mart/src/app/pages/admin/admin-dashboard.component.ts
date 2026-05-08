import { Component, inject, signal, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule, MatCheckboxChange } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ZerobiasClientApp } from '@zerobias-com/zerobias-client';
import { ZbSearchInputComponent, ZbEmptyStateContainerComponent } from '@zerobias-org/ngx-library';
import { StarRating } from '../../shared/components/star-rating/star-rating.component';
import { OrgProvisioningTabComponent } from './tabs/org-provisioning-tab.component';
import { AdminService } from '../../core/services/admin.service';
import { DemoModeService } from '../../core/services/demo-mode.service';
import { SmeMartDbService } from '../../core/services/sme-mart-db.service';
import { CategoriesService, type CategoryTreeNode } from '../../core/services/categories.service';
import { ReviewsService } from '../../core/services/reviews.service';
import type {
  AdminStats,
  AppSetting,
  MarketplaceUser,
  AdminReviewRow,
  Category,
} from '../../core/models';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    MatCardModule,
    MatTabsModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatChipsModule,
    MatSnackBarModule,
    MatDialogModule,
    MatSlideToggleModule,
    FormsModule,
    ReactiveFormsModule,
    DatePipe,
    ZbSearchInputComponent,
    ZbEmptyStateContainerComponent,
    StarRating,
    OrgProvisioningTabComponent,
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboard implements OnInit {
  private readonly app = inject(ZerobiasClientApp);
  private readonly adminService = inject(AdminService);
  private readonly categoriesService = inject(CategoriesService);
  private readonly reviewsService = inject(ReviewsService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  readonly demoMode = inject(DemoModeService);
  private readonly db = inject(SmeMartDbService);

  // Stats
  readonly stats = signal<AdminStats | null>(null);

  // Users tab
  readonly users = signal<MarketplaceUser[]>([]);
  readonly usersSearch = signal('');
  readonly userColumns = ['name', 'zerobias_user_id', 'email', 'created_at'];

  // Categories tab
  readonly categoryTree = signal<CategoryTreeNode[]>([]);
  readonly expandedCategories = signal<Set<string>>(new Set());

  // Reviews tab
  readonly reviews = signal<AdminReviewRow[]>([]);
  readonly reviewStatusFilter = signal<'all' | 'pending' | 'approved' | 'rejected'>('all');
  readonly selectedReviews = signal<Set<string>>(new Set());
  readonly reviewColumns = ['select', 'provider', 'rating', 'review_text', 'status', 'created_at', 'actions'];

  // Settings tab
  readonly settings = signal<AppSetting[]>([]);

  readonly loading = signal(true);

  async ngOnInit(): Promise<void> {
    try {
      const [statsResult] = await Promise.all([
        this.adminService.getStats(),
        this.loadUsers(),
        this.loadCategories(),
        this.loadReviews(),
        this.loadSettings(),
      ]);
      this.stats.set(statsResult);
    } catch (err) {
      console.warn('[AdminDashboard] Failed to load:', err);
    } finally {
      this.loading.set(false);
    }
  }

  // ===========================================================================
  // Users
  // ===========================================================================

  async loadUsers(): Promise<void> {
    const result = await this.adminService.listUsers({ pageSize: 200 });
    this.users.set(result.items || []);
  }

  get filteredUsers(): MarketplaceUser[] {
    const term = this.usersSearch().toLowerCase();
    if (!term) return this.users();
    return this.users().filter(u =>
      u.display_name.toLowerCase().includes(term) ||
      (u.email || '').toLowerCase().includes(term) ||
      u.zerobias_user_id.includes(term),
    );
  }

  onUsersSearch(term: string | null): void {
    this.usersSearch.set(term || '');
  }

  // ===========================================================================
  // Categories
  // ===========================================================================

  async loadCategories(): Promise<void> {
    await this.categoriesService.loadCategories();
    this.categoryTree.set(this.categoriesService.buildTree());
  }

  toggleCategory(id: string): void {
    this.expandedCategories.update(set => {
      const next = new Set(set);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  isCategoryExpanded(id: string): boolean {
    return this.expandedCategories().has(id);
  }

  async deleteCategory(cat: Category): Promise<void> {
    if (!confirm(`Delete category "${cat.name}"?`)) return;
    try {
      await this.categoriesService.deleteCategory(cat.id);
      this.categoryTree.set(this.categoriesService.buildTree());
      this.snackBar.open('Category deleted', 'OK', { duration: 3000 });
    } catch (err) {
      this.snackBar.open(`Failed: ${(err as Error).message}`, 'Dismiss', { duration: 5000 });
    }
  }

  openCategoryDialog(parent?: Category): void {
    const dialogRef = this.dialog.open(CategoryFormDialog, {
      width: '480px',
      data: { parent, allCategories: this.categoriesService.getRootCategories() },
    });
    dialogRef.afterClosed().subscribe(async (result: Partial<Category> | null) => {
      if (!result) return;
      try {
        await this.categoriesService.createCategory(result as Omit<Category, 'id'>);
        this.categoryTree.set(this.categoriesService.buildTree());
        this.snackBar.open('Category created', 'OK', { duration: 3000 });
      } catch (err) {
        this.snackBar.open(`Failed: ${(err as Error).message}`, 'Dismiss', { duration: 5000 });
      }
    });
  }

  // ===========================================================================
  // Reviews
  // ===========================================================================

  async loadReviews(): Promise<void> {
    const result = await this.reviewsService.listAdminReviews({ pageSize: 200 });
    this.reviews.set(result.items || []);
  }

  get filteredReviews(): AdminReviewRow[] {
    const filter = this.reviewStatusFilter();
    if (filter === 'all') return this.reviews();
    if (filter === 'pending') return this.reviews().filter(r => !r.approved && !r.approved_at);
    if (filter === 'approved') return this.reviews().filter(r => r.approved);
    return this.reviews().filter(r => !r.approved && !!r.approved_at);
  }

  toggleReviewSelection(id: string, event: MatCheckboxChange): void {
    this.selectedReviews.update(set => {
      const next = new Set(set);
      if (event.checked) next.add(id); else next.delete(id);
      return next;
    });
  }

  isReviewSelected(id: string): boolean {
    return this.selectedReviews().has(id);
  }

  async bulkApproveReviews(): Promise<void> {
    const ids = [...this.selectedReviews()];
    if (!ids.length) return;
    const user = await this.app.whoAmI() as { id?: unknown };
    try {
      await Promise.all(ids.map(id => this.reviewsService.approveReview(id, user.id?.toString() || '')));
      this.selectedReviews.set(new Set());
      await this.loadReviews();
      this.snackBar.open(`${ids.length} review(s) approved`, 'OK', { duration: 3000 });
    } catch (err) {
      this.snackBar.open(`Failed: ${(err as Error).message}`, 'Dismiss', { duration: 5000 });
    }
  }

  async bulkRejectReviews(): Promise<void> {
    const ids = [...this.selectedReviews()];
    if (!ids.length) return;
    const user = await this.app.whoAmI() as { id?: unknown };
    try {
      await Promise.all(ids.map(id => this.reviewsService.rejectReview(id, user.id?.toString() || '')));
      this.selectedReviews.set(new Set());
      await this.loadReviews();
      this.snackBar.open(`${ids.length} review(s) rejected`, 'OK', { duration: 3000 });
    } catch (err) {
      this.snackBar.open(`Failed: ${(err as Error).message}`, 'Dismiss', { duration: 5000 });
    }
  }

  async approveReview(id: string): Promise<void> {
    const user = await this.app.whoAmI() as { id?: unknown };
    try {
      await this.reviewsService.approveReview(id, user.id?.toString() || '');
      await this.loadReviews();
      this.snackBar.open('Review approved', 'OK', { duration: 3000 });
    } catch (err) {
      this.snackBar.open(`Failed: ${(err as Error).message}`, 'Dismiss', { duration: 5000 });
    }
  }

  async rejectReview(id: string): Promise<void> {
    const user = await this.app.whoAmI() as { id?: unknown };
    try {
      await this.reviewsService.rejectReview(id, user.id?.toString() || '');
      await this.loadReviews();
      this.snackBar.open('Review rejected', 'OK', { duration: 3000 });
    } catch (err) {
      this.snackBar.open(`Failed: ${(err as Error).message}`, 'Dismiss', { duration: 5000 });
    }
  }

  // ===========================================================================
  // Settings
  // ===========================================================================

  async toggleDemoMode(): Promise<void> {
    try {
      await this.demoMode.toggle(this.db);
      this.snackBar.open(`Demo mode ${this.demoMode.enabled() ? 'enabled' : 'disabled'}`, 'OK', { duration: 3000 });
    } catch (err) {
      this.snackBar.open(`Failed: ${(err as Error).message}`, 'Dismiss', { duration: 5000 });
    }
  }

  async loadSettings(): Promise<void> {
    const result = await this.adminService.getSettings();
    this.settings.set(result);
  }

  getSettingValue(key: string): unknown {
    const setting = this.settings().find(s => s.key === key);
    if (!setting) return null;
    try {
      return JSON.parse(setting.value);
    } catch {
      return setting.value;
    }
  }

  async saveSetting(key: string, value: unknown): Promise<void> {
    const user = await this.app.whoAmI() as { id?: unknown };
    try {
      await this.adminService.updateSetting(key, value, user.id?.toString() || '');
      await this.loadSettings();
      this.snackBar.open('Setting saved', 'OK', { duration: 3000 });
    } catch (err) {
      this.snackBar.open(`Failed: ${(err as Error).message}`, 'Dismiss', { duration: 5000 });
    }
  }
}

// =============================================================================
// Category Form Dialog
// =============================================================================

@Component({
  selector: 'app-category-form-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    ReactiveFormsModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.parent ? 'Add Subcategory' : 'Add Category' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="category-form">
        <mat-form-field appearance="outline">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Slug</mat-label>
          <input matInput formControlName="slug" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="2"></textarea>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Icon</mat-label>
          <input matInput formControlName="icon" placeholder="Material icon name" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Sort Order</mat-label>
          <input matInput formControlName="sort_order" type="number" />
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-flat-button color="primary" (click)="onSave()" [disabled]="!form.valid">Save</button>
    </mat-dialog-actions>
  `,
  styles: [`.category-form { display: flex; flex-direction: column; gap: 0.5rem; min-width: 400px; mat-form-field { width: 100%; } }`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryFormDialog {
  private readonly fb = inject(FormBuilder);
  readonly dialogRef = inject(MatDialogRef<CategoryFormDialog>);
  readonly data = inject<{ parent?: Category; allCategories: Category[] }>(MAT_DIALOG_DATA);

  readonly form = this.fb.group({
    name: ['', Validators.required],
    slug: ['', Validators.required],
    description: [''],
    icon: [''],
    sort_order: [0],
  });

  constructor() {
    // Auto-generate slug from name
    this.form.controls.name.valueChanges.subscribe(name => {
      if (name) {
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        this.form.controls.slug.setValue(slug);
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onSave(): void {
    const v = this.form.getRawValue();
    this.dialogRef.close({
      name: v.name,
      slug: v.slug,
      description: v.description || null,
      parent_id: this.data.parent?.id || null,
      icon: v.icon || null,
      sort_order: v.sort_order || 0,
    });
  }
}
