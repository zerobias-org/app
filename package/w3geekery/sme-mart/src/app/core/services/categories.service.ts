import { Injectable, inject, signal } from '@angular/core';
import { SmeMartDbService } from './sme-mart-db.service';
import type { Category } from '../models';

export interface CategoryTreeNode extends Category {
  children: CategoryTreeNode[];
}

@Injectable({ providedIn: 'root' })
export class CategoriesService {
  private readonly db = inject(SmeMartDbService);

  readonly categories = signal<Category[]>([]);

  async loadCategories(): Promise<Category[]> {
    const result = await this.db.listRows<Category>('categories', { pageSize: 500 });
    const items = result.items || [];
    this.categories.set(items);
    return items;
  }

  async createCategory(data: Omit<Category, 'id'>): Promise<Category> {
    const created = await this.db.createRow<Category>('categories', data as Record<string, unknown>);
    await this.loadCategories(); // refresh cache
    return created;
  }

  async updateCategory(id: string, data: Partial<Category>): Promise<Category> {
    const updated = await this.db.updateRow<Category>('categories', id, data as Record<string, unknown>);
    await this.loadCategories();
    return updated;
  }

  async deleteCategory(id: string): Promise<void> {
    await this.db.deleteRow('categories', id);
    await this.loadCategories();
  }

  getRootCategories(): Category[] {
    return this.categories().filter(c => !c.parent_id);
  }

  getChildren(parentId: string): Category[] {
    return this.categories().filter(c => c.parent_id === parentId);
  }

  buildTree(): CategoryTreeNode[] {
    const all = this.categories();
    const map = new Map<string, CategoryTreeNode>();
    for (const cat of all) {
      map.set(cat.id, { ...cat, children: [] });
    }
    const roots: CategoryTreeNode[] = [];
    for (const node of map.values()) {
      if (node.parent_id && map.has(node.parent_id)) {
        map.get(node.parent_id)!.children.push(node);
      } else {
        roots.push(node);
      }
    }
    return roots.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  }
}
