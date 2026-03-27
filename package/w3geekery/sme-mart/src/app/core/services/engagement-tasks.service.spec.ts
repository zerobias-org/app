/**
 * Unit Tests for EngagementTasksService
 *
 * Tests task CRUD, child task listing, link type discovery, and subtask creation.
 * Mocks the ZB platform SDK (taskApi, resourceApi).
 */

import { TestBed } from '@angular/core/testing';
import { EngagementTasksService } from './engagement-tasks.service';
import { ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import { UUID } from '@zerobias-org/types-core-js';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Valid UUIDs for ZB SDK objects
const PARENT_ID = 'cf72be7c-1403-11f1-845f-000000000010';
const CHILD_1_ID = 'cf72be7c-1403-11f1-845f-000000000002';
const CHILD_2_ID = 'cf72be7c-1403-11f1-845f-000000000003';
const ACT_ID = 'cf72be7c-1403-11f1-845f-000000000020';
const TR_ID = 'cf72be7c-1403-11f1-845f-000000000030';
const LT_CHILD_OF = 'cf72be7c-1403-11f1-845f-dff3645d0fe7';
const LT_BLOCKED_BY = 'cf73b304-1403-11f1-845f-8b0a517a3fa6';
const LT_RELATES_TO = '2694788c-721e-11ef-a886-5357e9e8bc3b';

function makeTask(id: string, name: string) {
  return { id: new UUID(id), name, created: new Date('2026-01-01') };
}

function makeLinkType(fromLinkType: string, id: string) {
  return { id: new UUID(id), fromLinkType, fromType: 'task', toType: 'task' };
}

describe('EngagementTasksService', () => {
  let service: EngagementTasksService;
  let mockTaskApi: { get: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
  let mockResourceApi: {
    listResourceLinks: ReturnType<typeof vi.fn>;
    listResourceLinkTypes: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockTaskApi = {
      get: vi.fn().mockResolvedValue(makeTask(PARENT_ID, 'Test Task')),
      create: vi.fn().mockResolvedValue(makeTask(CHILD_1_ID, 'New Subtask')),
      update: vi.fn().mockResolvedValue(makeTask(PARENT_ID, 'Test Task')),
    };

    mockResourceApi = {
      listResourceLinks: vi.fn().mockResolvedValue({ items: [] }),
      listResourceLinkTypes: vi.fn().mockResolvedValue({
        items: [
          makeLinkType('child_of', LT_CHILD_OF),
          makeLinkType('blocked_by', LT_BLOCKED_BY),
          makeLinkType('relates_to', LT_RELATES_TO),
        ],
      }),
    };

    const mockClientApi = {
      platformClient: { getTaskApi: () => mockTaskApi },
      hydraClient: { getResourceApi: () => mockResourceApi },
    };

    TestBed.configureTestingModule({
      providers: [
        EngagementTasksService,
        { provide: ZerobiasClientApi, useValue: mockClientApi },
      ],
    });

    service = TestBed.inject(EngagementTasksService);
  });

  describe('getTask()', () => {
    it('should fetch task by ID', async () => {
      const result = await service.getTask(PARENT_ID);

      expect(mockTaskApi.get).toHaveBeenCalledTimes(1);
      expect(result.name).toBe('Test Task');
    });
  });

  describe('listChildTasks()', () => {
    it('should return empty array when no links', async () => {
      mockResourceApi.listResourceLinks.mockResolvedValue({ items: [] });

      const result = await service.listChildTasks(PARENT_ID);

      expect(result).toEqual([]);
    });

    it('should filter to child_of links and fetch tasks', async () => {
      mockResourceApi.listResourceLinks.mockResolvedValue({
        items: [
          { fromResource: PARENT_ID, toResource: CHILD_1_ID, linkType: LT_CHILD_OF },
          { fromResource: PARENT_ID, toResource: CHILD_2_ID, linkType: LT_CHILD_OF },
        ],
      });

      mockTaskApi.get
        .mockResolvedValueOnce(makeTask(CHILD_1_ID, 'Child 1'))
        .mockResolvedValueOnce(makeTask(CHILD_2_ID, 'Child 2'));

      const result = await service.listChildTasks(PARENT_ID);

      expect(result).toHaveLength(2);
    });

    it('should skip links where parent is toResource (not fromResource)', async () => {
      const OTHER_ID = 'cf72be7c-1403-11f1-845f-000000000099';
      mockResourceApi.listResourceLinks.mockResolvedValue({
        items: [
          { fromResource: OTHER_ID, toResource: PARENT_ID, linkType: LT_CHILD_OF },
        ],
      });

      const result = await service.listChildTasks(PARENT_ID);

      expect(result).toEqual([]);
      // get is not called for child tasks (none matched)
    });
  });

  describe('createSubTask()', () => {
    it('should create task with child_of link to parent', async () => {
      const result = await service.createSubTask(PARENT_ID, {
        name: 'New Subtask',
        activityId: ACT_ID,
      });

      expect(mockTaskApi.create).toHaveBeenCalledTimes(1);
      expect(result.name).toBe('New Subtask');
    });
  });

  describe('transitionTask()', () => {
    it('should call taskApi.update with transition ID', async () => {
      await service.transitionTask(PARENT_ID, TR_ID);

      expect(mockTaskApi.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('link type discovery', () => {
    it('should cache link types after first discovery', async () => {
      await service.listChildTasks(PARENT_ID);
      expect(mockResourceApi.listResourceLinkTypes).toHaveBeenCalledTimes(1);

      await service.listChildTasks(PARENT_ID);
      expect(mockResourceApi.listResourceLinkTypes).toHaveBeenCalledTimes(1);
    });

    it('should find blocked_by link type', async () => {
      const result = await service.getBlockedByLinkTypeId(PARENT_ID);

      expect(result).not.toBeNull();
    });
  });
});
