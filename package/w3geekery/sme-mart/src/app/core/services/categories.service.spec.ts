/**
 * Unit Tests for CategoriesService
 *
 * Tests CRUD delegation, tree building, and filtering.
 */

import { TestBed } from '@angular/core/testing';
import { CategoriesService } from './categories.service';
import { SmeMartDbService } from './sme-mart-db.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Category } from '../models';

function makeCat(id: string, name: string, parentId: string | null = null, sortOrder = 0): Category {
  return { id, name, slug: name.toLowerCase(), parent_id: parentId, sort_order: sortOrder, icon: null, description: null };
}

describe('CategoriesService', () => {
  let service: CategoriesService;
  let mockDb: { listRows: ReturnType<typeof vi.fn>; createRow: ReturnType<typeof vi.fn>; updateRow: ReturnType<typeof vi.fn>; deleteRow: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockDb = {
      listRows: vi.fn().mockResolvedValue({ items: [] }),
      createRow: vi.fn().mockResolvedValue(makeCat('new-1', 'New')),
      updateRow: vi.fn().mockResolvedValue(makeCat('c1', 'Updated')),
      deleteRow: vi.fn().mockResolvedValue(undefined),
    };

    TestBed.configureTestingModule({
      providers: [
        CategoriesService,
        { provide: SmeMartDbService, useValue: mockDb },
      ],
    });

    service = TestBed.inject(CategoriesService);
  });

  describe('loadCategories()', () => {
    it('should query categories table and update signal', async () => {
      const cats = [makeCat('c1', 'Assessors'), makeCat('c2', 'Advisors')];
      mockDb.listRows.mockResolvedValue({ items: cats });

      const result = await service.loadCategories();

      expect(mockDb.listRows).toHaveBeenCalledWith('categories', { pageSize: 500 });
      expect(result).toHaveLength(2);
      expect(service.categories()).toHaveLength(2);
    });
  });

  describe('getRootCategories()', () => {
    it('should return categories without parent_id', async () => {
      const cats = [makeCat('c1', 'Root'), makeCat('c2', 'Child', 'c1')];
      mockDb.listRows.mockResolvedValue({ items: cats });
      await service.loadCategories();

      const roots = service.getRootCategories();

      expect(roots).toHaveLength(1);
      expect(roots[0].name).toBe('Root');
    });
  });

  describe('getChildren()', () => {
    it('should return categories with matching parent_id', async () => {
      const cats = [makeCat('c1', 'Root'), makeCat('c2', 'Child A', 'c1'), makeCat('c3', 'Child B', 'c1')];
      mockDb.listRows.mockResolvedValue({ items: cats });
      await service.loadCategories();

      const children = service.getChildren('c1');

      expect(children).toHaveLength(2);
    });
  });

  describe('buildTree()', () => {
    it('should nest children under parents', async () => {
      const cats = [
        makeCat('c1', 'Root', null, 0),
        makeCat('c2', 'Child', 'c1', 0),
        makeCat('c3', 'Grandchild', 'c2', 0),
      ];
      mockDb.listRows.mockResolvedValue({ items: cats });
      await service.loadCategories();

      const tree = service.buildTree();

      expect(tree).toHaveLength(1);
      expect(tree[0].children).toHaveLength(1);
      expect(tree[0].children[0].children).toHaveLength(1);
    });

    it('should sort roots by sort_order', async () => {
      const cats = [
        makeCat('c2', 'Second', null, 2),
        makeCat('c1', 'First', null, 1),
        makeCat('c3', 'Third', null, 3),
      ];
      mockDb.listRows.mockResolvedValue({ items: cats });
      await service.loadCategories();

      const tree = service.buildTree();

      expect(tree.map(n => n.name)).toEqual(['First', 'Second', 'Third']);
    });

    it('should handle empty categories', () => {
      const tree = service.buildTree();
      expect(tree).toEqual([]);
    });
  });

  describe('CRUD', () => {
    it('should create and reload', async () => {
      mockDb.listRows.mockResolvedValue({ items: [] });
      await service.createCategory({ name: 'New', slug: 'new', parent_id: null, sort_order: 0, icon: null, description: null });

      expect(mockDb.createRow).toHaveBeenCalledTimes(1);
      expect(mockDb.listRows).toHaveBeenCalledTimes(1); // reload after create
    });

    it('should delete and reload', async () => {
      mockDb.listRows.mockResolvedValue({ items: [] });
      await service.deleteCategory('c1');

      expect(mockDb.deleteRow).toHaveBeenCalledWith('categories', 'c1');
      expect(mockDb.listRows).toHaveBeenCalledTimes(1);
    });
  });
});
