/**
 * Unit Tests for EngagementHierarchyService
 *
 * Tests tag parsing, hierarchy level detection, breadcrumb building,
 * and tag CRUD delegation.
 */

import { TestBed } from '@angular/core/testing';
import { EngagementHierarchyService } from './engagement-hierarchy.service';
import { SmeMartTagService } from './sme-mart-tag.service';
import { ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import { fakeSmeMartTagService } from '../../test-helpers/angular';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('EngagementHierarchyService', () => {
  let service: EngagementHierarchyService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockTagService: any;

  beforeEach(() => {
    mockTagService = {
      ...fakeSmeMartTagService(),
      assignTag: vi.fn().mockResolvedValue(undefined),
      removeTag: vi.fn().mockResolvedValue(undefined),
      getResourceTags: vi.fn().mockResolvedValue([]),
      findTagByName: vi.fn().mockResolvedValue(null),
      generateProjectTag: vi.fn().mockReturnValue('sme-mart.proj.test-proj'),
      generateTaskTag: vi.fn().mockReturnValue('sme-mart.task.test-task'),
    };

    const mockClientApi = {
      hydraClient: {
        getTagApi: () => ({
          getTag: vi.fn().mockResolvedValue(null),
        }),
        getResourceApi: () => ({
          listResourceLinks: vi.fn().mockResolvedValue({ items: [] }),
        }),
      },
    };

    TestBed.configureTestingModule({
      providers: [
        EngagementHierarchyService,
        { provide: SmeMartTagService, useValue: mockTagService },
        { provide: ZerobiasClientApi, useValue: mockClientApi },
      ],
    });

    service = TestBed.inject(EngagementHierarchyService);
  });

  // ── Tag name parsing ──

  describe('parseLevel()', () => {
    it('should detect project tags (new convention)', () => {
      expect(service.parseLevel('sme-mart.proj.crystal-harbor')).toBe('project');
    });

    it('should detect boundary/engagement tags (new convention)', () => {
      expect(service.parseLevel('sme-mart.eng.velvet-summit')).toBe('boundary');
    });

    it('should detect task tags (new convention)', () => {
      expect(service.parseLevel('sme-mart.task.amber-circuit')).toBe('task');
    });

    it('should return null for unrecognized tags', () => {
      expect(service.parseLevel('random-tag')).toBeNull();
    });
  });

  describe('isProjectTag()', () => {
    it('should match new convention', () => {
      expect(service.isProjectTag('sme-mart.proj.test')).toBe(true);
    });

    it('should match old convention', () => {
      expect(service.isProjectTag('PROJ-test')).toBe(true);
    });

    it('should reject non-project tags', () => {
      expect(service.isProjectTag('sme-mart.eng.test')).toBe(false);
    });
  });

  describe('isBoundaryTag()', () => {
    it('should match new convention', () => {
      expect(service.isBoundaryTag('sme-mart.eng.test')).toBe(true);
    });

    it('should match old convention', () => {
      expect(service.isBoundaryTag('ENG-test')).toBe(true);
    });

    it('should reject non-boundary tags', () => {
      expect(service.isBoundaryTag('sme-mart.proj.test')).toBe(false);
    });
  });

  describe('parseTag()', () => {
    it('should parse a valid hierarchy tag', () => {
      const tag = { id: 'tag-1', name: 'sme-mart.proj.crystal-harbor', description: 'Test' } as any;
      const result = service.parseTag(tag);

      expect(result).not.toBeNull();
      expect(result?.level).toBe('project');
      expect(result?.displayName).toBe('crystal-harbor');
    });

    it('should return null for non-hierarchy tag', () => {
      const tag = { id: 'tag-2', name: 'random-tag' } as any;
      expect(service.parseTag(tag)).toBeNull();
    });
  });

  // ── Display helpers ──

  describe('levelLabel()', () => {
    it('should return human-readable labels', () => {
      expect(service.levelLabel('project')).toBe('Project');
      expect(service.levelLabel('boundary')).toBe('Boundary');
      expect(service.levelLabel('task')).toBe('Task');
      expect(service.levelLabel('subtask')).toBe('SubTask');
    });
  });

  describe('levelIcon()', () => {
    it('should return material icons', () => {
      expect(service.levelIcon('project')).toBe('folder_special');
      expect(service.levelIcon('task')).toBe('task_alt');
    });
  });

  // ── Breadcrumbs ──

  describe('buildBreadcrumbs()', () => {
    it('should build boundary crumb from engagement tag', async () => {
      const crumbs = await service.buildBreadcrumbs({
        engagementTag: 'sme-mart.eng.crystal-harbor',
      });

      expect(crumbs).toHaveLength(1);
      expect(crumbs[0].level).toBe('boundary');
      expect(crumbs[0].label).toBe('crystal-harbor');
      expect(crumbs[0].active).toBe(true);
    });

    it('should add task crumb when zerobiasTaskId is provided', async () => {
      mockTagService.getResourceTags.mockResolvedValue([]);

      const crumbs = await service.buildBreadcrumbs({
        engagementTag: 'sme-mart.eng.test',
        zerobiasTaskId: 'task-001',
        title: 'My Task',
      });

      const taskCrumb = crumbs.find(c => c.level === 'task');
      expect(taskCrumb).toBeDefined();
      expect(taskCrumb?.label).toBe('My Task');
      expect(taskCrumb?.active).toBe(true);
    });

    it('should return empty array when no context provided', async () => {
      const crumbs = await service.buildBreadcrumbs({});
      expect(crumbs).toEqual([]);
    });
  });

  describe('buildSubtaskBreadcrumbs()', () => {
    it('should deactivate parent crumbs and add subtask', () => {
      const parent = [
        { label: 'Boundary', level: 'boundary' as const, active: true },
        { label: 'Task', level: 'task' as const, active: true },
      ];

      const subtask = { id: 'st-1', name: 'Subtask 1' } as any;
      const result = service.buildSubtaskBreadcrumbs(parent, subtask);

      expect(result).toHaveLength(3);
      expect(result[0].active).toBe(false);
      expect(result[1].active).toBe(false);
      expect(result[2].level).toBe('subtask');
      expect(result[2].label).toBe('Subtask 1');
      expect(result[2].active).toBe(true);
    });
  });

  // ── Tag CRUD delegation ──

  describe('tag operations', () => {
    it('should delegate createTag to SmeMartTagService', async () => {
      mockTagService.createTag.mockResolvedValue({ id: 'new-tag' });

      await service.createTag('sme-mart.eng.test', 'Test engagement');

      expect(mockTagService.createTag).toHaveBeenCalledWith('sme-mart.eng.test', 'Test engagement');
    });

    it('should delegate tagResource to SmeMartTagService', async () => {
      await service.tagResource('resource-1', ['tag-1', 'tag-2']);

      expect(mockTagService.assignTag).toHaveBeenCalledWith('resource-1', ['tag-1', 'tag-2']);
    });

    it('should delegate untagResource to SmeMartTagService', async () => {
      await service.untagResource('resource-1', 'tag-1');

      expect(mockTagService.removeTag).toHaveBeenCalledWith('resource-1', 'tag-1');
    });
  });
});
